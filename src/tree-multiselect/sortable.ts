// Single-list drag reordering for the selected panel, built on Pointer Events.
// The panel only ever contains direct `div.item` children, so this stays small:
// move the dragged node live while the pointer is down, then report the start
// and end index on release.
const DRAG_THRESHOLD = 3; // px the pointer must travel before a drag begins
const SCROLL_EDGE = 20; // px from the panel edge where auto-scrolling starts
const SCROLL_STEP = 8; // px scrolled per animation frame
const FLIP_DURATION = 140; // ms for the items that make way
const FLIP_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const flipAnimations = new WeakMap<Element, Animation>();

function prefersReducedMotion (): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// A bounding rect includes the element's transform (an in-flight FLIP
// animation or the drag offset), so subtract it to get the layout position.
// Transforms use the element center as origin, hence the scale correction.
function layoutTop (element: HTMLElement): number {
  let top = element.getBoundingClientRect().top;
  let transform = getComputedStyle(element).transform;
  if (transform !== 'none') {
    let matrix = new DOMMatrixReadOnly(transform);
    top -= matrix.m42 - ((matrix.d - 1) * element.offsetHeight / 2);
  }
  return top;
}

export function makeSelectedPanelSortable (
  selectedContainer: HTMLElement,
  onReorder: (startIndex: number, endIndex: number) => void
): void {
  selectedContainer.classList.add('sortable-enabled');

  selectedContainer.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    let target = event.target as Element | null;
    if (!target || target.closest('span.remove-selected')) {
      return;
    }

    let item = target.closest('div.item');
    if (!item || item.parentElement !== selectedContainer) {
      return;
    }

    startDrag(item as HTMLElement, event);
  });

  function startDrag (item: HTMLElement, downEvent: PointerEvent): void {
    let startIndex = indexOfElement(item);
    let startX = downEvent.clientX;
    let startY = downEvent.clientY;
    let grabOffsetY = downEvent.clientY - item.getBoundingClientRect().top;
    let pointerId = downEvent.pointerId;
    let originalOrder = Array.from(selectedContainer.children);

    let moved = false;
    let lastY = startY;
    let scrollDirection = 0;
    let animationFrame: number | null = null;

    function onPointerMove (event: PointerEvent): void {
      if (event.pointerId !== pointerId) {
        return;
      }

      lastY = event.clientY;

      if (!moved) {
        let distance = Math.max(
          Math.abs(event.clientX - startX),
          Math.abs(event.clientY - startY)
        );
        if (distance < DRAG_THRESHOLD) {
          return;
        }

        moved = true;
        item.classList.add('sortable-dragging');
        selectedContainer.classList.add('sortable-dragging');
      }

      event.preventDefault();
      placeItem();
      updateDragTransform();
      updateAutoScroll();
    }

    // Keep the dragged node visually under the pointer while its layout slot
    // is the one chosen by placeItem().
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

    function onPointerUp (event: PointerEvent): void {
      if (event.pointerId !== pointerId) {
        return;
      }

      let endIndex = indexOfElement(item);
      let didMove = moved;
      cleanup();
      if (didMove && endIndex !== startIndex) {
        onReorder(startIndex, endIndex);
      }
    }

    function onPointerCancel (event: PointerEvent): void {
      if (event.pointerId !== pointerId) {
        return;
      }

      for (let ii = 0; ii < originalOrder.length; ++ii) {
        selectedContainer.appendChild(originalOrder[ii]);
      }
      cleanup();
    }

    function cleanup (): void {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      item.classList.remove('sortable-dragging');
      item.style.removeProperty('transform');
      selectedContainer.classList.remove('sortable-dragging');
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
  }
}

// position among the parent's element children
function indexOfElement (element: Element): number {
  let parentNode = element.parentElement;
  return parentNode ? Array.prototype.indexOf.call(parentNode.children, element) : -1;
}
