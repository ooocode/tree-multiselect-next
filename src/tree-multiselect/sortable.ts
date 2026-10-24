// Single-list drag reordering for the selected panel. Pointer Events are used
// when available; Safari 11/12 and other pre-Pointer-Events browsers fall back
// to mouse/touch events. The panel only ever contains direct `div.item`
// children, so this stays small: move the dragged node live while the input is
// down, then report the start and end index on release.
const DRAG_THRESHOLD = 3; // px the input must travel before a drag begins
const SCROLL_EDGE = 20; // px from the panel edge where auto-scrolling starts
const SCROLL_STEP = 8; // px scrolled per animation frame
const FLIP_DURATION = 140; // ms for the items that make way
const FLIP_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const flipAnimations = new WeakMap<Element, Animation>();

type DragMode = 'pointer' | 'mouse' | 'touch';

function prefersReducedMotion (): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Reads the translate/scale components out of a computed transform without
// DOMMatrixReadOnly, which Firefox only shipped in version 62.
function transformMetrics (transform: string): { translateY: number, scaleY: number } {
  let values: number[];
  if (transform.indexOf('matrix3d(') === 0) {
    values = transform.slice(9, -1).split(',').map((value) => parseFloat(value));
    return { translateY: values[13] || 0, scaleY: values[5] || 1 };
  }
  if (transform.indexOf('matrix(') === 0) {
    values = transform.slice(7, -1).split(',').map((value) => parseFloat(value));
    return { translateY: values[5] || 0, scaleY: values[3] || 1 };
  }
  return { translateY: 0, scaleY: 1 };
}

// A bounding rect includes the element's transform (an in-flight FLIP
// animation or the drag offset), so subtract it to get the layout position.
// Transforms use the element center as origin, hence the scale correction.
function layoutTop (element: HTMLElement): number {
  let top = element.getBoundingClientRect().top;
  let transform = getComputedStyle(element).transform;
  if (transform !== 'none') {
    let metrics = transformMetrics(transform);
    top -= metrics.translateY - ((metrics.scaleY - 1) * element.offsetHeight / 2);
  }
  return top;
}

export function makeSelectedPanelSortable (
  selectedContainer: HTMLElement,
  onReorder: (startIndex: number, endIndex: number) => void
): void {
  selectedContainer.classList.add('sortable-enabled');

  let pointerEventsSupported = typeof window.PointerEvent === 'function';

  function findItem (eventTarget: EventTarget | null): HTMLElement | null {
    if (!(eventTarget instanceof Element) || eventTarget.closest('span.remove-selected')) {
      return null;
    }

    let item = eventTarget.closest('div.item');
    if (!item || item.parentElement !== selectedContainer) {
      return null;
    }
    return item as HTMLElement;
  }

  if (pointerEventsSupported) {
    selectedContainer.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }

      let item = findItem(event.target);
      if (item) {
        startDrag(item, event.clientX, event.clientY, 'pointer', event.pointerId);
      }
    });
  } else {
    selectedContainer.addEventListener('mousedown', (event) => {
      if (event.button !== 0) {
        return;
      }

      let item = findItem(event.target);
      if (item) {
        event.preventDefault();
        startDrag(item, event.clientX, event.clientY, 'mouse', 0);
      }
    });

    selectedContainer.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) {
        return;
      }

      let item = findItem(event.target);
      if (item) {
        let touch = event.touches[0];
        startDrag(item, touch.clientX, touch.clientY, 'touch', touch.identifier);
      }
    });
  }

  function startDrag (
    item: HTMLElement,
    clientX: number,
    clientY: number,
    mode: DragMode,
    pointerId: number
  ): void {
    let startIndex = indexOfElement(item);
    let startX = clientX;
    let startY = clientY;
    let grabOffsetY = clientY - item.getBoundingClientRect().top;
    let originalOrder = Array.from(selectedContainer.children);

    let moved = false;
    let lastY = startY;
    let scrollDirection = 0;
    let animationFrame: number | null = null;

    function handleMove (x: number, y: number): void {
      lastY = y;

      if (!moved) {
        let distance = Math.max(Math.abs(x - startX), Math.abs(y - startY));
        if (distance < DRAG_THRESHOLD) {
          return;
        }

        moved = true;
        item.classList.add('sortable-dragging');
        selectedContainer.classList.add('sortable-dragging');
      }

      placeItem();
      updateDragTransform();
      updateAutoScroll();
    }

    function handleEnd (): void {
      let endIndex = indexOfElement(item);
      let didMove = moved;
      cleanup();
      if (didMove && endIndex !== startIndex) {
        onReorder(startIndex, endIndex);
      }
    }

    function handleCancel (): void {
      for (let ii = 0; ii < originalOrder.length; ++ii) {
        selectedContainer.appendChild(originalOrder[ii]);
      }
      cleanup();
    }

    function findTouch (list: TouchList): Touch | null {
      for (let ii = 0; ii < list.length; ++ii) {
        if (list[ii].identifier === pointerId) {
          return list[ii];
        }
      }
      return null;
    }

    function onPointerMove (event: PointerEvent): void {
      if (event.pointerId !== pointerId) {
        return;
      }
      if (moved) {
        event.preventDefault();
      }
      handleMove(event.clientX, event.clientY);
    }

    function onPointerUp (event: PointerEvent): void {
      if (event.pointerId === pointerId) {
        handleEnd();
      }
    }

    function onPointerCancel (event: PointerEvent): void {
      if (event.pointerId === pointerId) {
        handleCancel();
      }
    }

    function onMouseMove (event: MouseEvent): void {
      if (moved) {
        event.preventDefault();
      }
      handleMove(event.clientX, event.clientY);
    }

    function onMouseUp (): void {
      handleEnd();
    }

    function onTouchMove (event: TouchEvent): void {
      let touch = findTouch(event.touches);
      if (!touch) {
        return;
      }
      event.preventDefault();
      handleMove(touch.clientX, touch.clientY);
    }

    function onTouchEnd (event: TouchEvent): void {
      if (findTouch(event.changedTouches)) {
        handleEnd();
      }
    }

    function onTouchCancel (event: TouchEvent): void {
      if (findTouch(event.changedTouches)) {
        handleCancel();
      }
    }

    // Keep the dragged node visually under the input while its layout slot is
    // the one chosen by placeItem().
    function updateDragTransform (): void {
      let translate = lastY - grabOffsetY - layoutTop(item);
      item.style.transform = `translateY(${translate}px) scale(1.02)`;
    }

    function placeItem (): void {
      let siblings = Array.from(selectedContainer.children)
        .filter((child) => child !== item) as HTMLElement[];
      let dragCenterY = lastY - grabOffsetY + item.offsetHeight / 2;
      let next: HTMLElement | null = null;
      for (let ii = 0; ii < siblings.length; ++ii) {
        if (dragCenterY < layoutTop(siblings[ii]) + siblings[ii].offsetHeight / 2) {
          next = siblings[ii];
          break;
        }
      }

      let needsMove = next
        ? item.nextElementSibling !== next
        : selectedContainer.lastElementChild !== item;
      if (!needsMove) {
        return;
      }

      // FLIP: remember where the siblings were before the DOM move, then
      // animate them from their old position to the new one.
      let beforeTops = new Map<HTMLElement, number>();
      for (let ii = 0; ii < siblings.length; ++ii) {
        beforeTops.set(siblings[ii], layoutTop(siblings[ii]));
      }

      if (next) {
        selectedContainer.insertBefore(item, next);
      } else {
        selectedContainer.appendChild(item);
      }

      if (prefersReducedMotion()) {
        return;
      }

      for (let ii = 0; ii < siblings.length; ++ii) {
        let sibling = siblings[ii];
        if (typeof sibling.animate !== 'function') {
          continue;
        }

        let previous = flipAnimations.get(sibling);
        if (previous) {
          previous.cancel();
        }

        let delta = (beforeTops.get(sibling) as number) - layoutTop(sibling);
        if (delta === 0) {
          continue;
        }

        let animation = sibling.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
          { duration: FLIP_DURATION, easing: FLIP_EASING }
        );
        flipAnimations.set(sibling, animation);
      }
    }

    function updateAutoScroll (): void {
      let rect = selectedContainer.getBoundingClientRect();
      let direction = 0;
      if (lastY < rect.top + SCROLL_EDGE) {
        direction = -1;
      } else if (lastY > rect.bottom - SCROLL_EDGE) {
        direction = 1;
      }

      scrollDirection = direction;
      if (direction !== 0 && animationFrame === null) {
        animationFrame = requestAnimationFrame(scrollStep);
      }
    }

    function scrollStep (): void {
      animationFrame = null;
      if (!moved || scrollDirection === 0) {
        return;
      }

      selectedContainer.scrollTop += scrollDirection * SCROLL_STEP;
      placeItem();
      updateDragTransform();
      animationFrame = requestAnimationFrame(scrollStep);
    }

    function cleanup (): void {
      if (mode === 'pointer') {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
      } else if (mode === 'mouse') {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      } else {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchCancel);
      }

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      item.classList.remove('sortable-dragging');
      item.style.removeProperty('transform');
      selectedContainer.classList.remove('sortable-dragging');
    }

    if (mode === 'pointer') {
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerCancel);
    } else if (mode === 'mouse') {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    } else {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchCancel);
    }
  }
}

// position among the parent's element children
function indexOfElement (element: Element): number {
  let parentNode = element.parentElement;
  return parentNode ? Array.prototype.indexOf.call(parentNode.children, element) : -1;
}
