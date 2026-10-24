const POINTER_ID = 7;

export function midY (element: Element): number {
  let rect = element.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

export function firePointer (
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  target: EventTarget,
  clientY: number
): void {
  target.dispatchEvent(new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: POINTER_ID,
    pointerType: 'mouse',
    isPrimary: true,
    button: type === 'pointermove' ? -1 : 0,
    buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    clientX: 10,
    clientY
  }));
}

export function dragItem (item: Element, clientY: number): void {
  firePointer('pointerdown', item, midY(item));
  firePointer('pointermove', document, clientY);
  firePointer('pointerup', document, clientY);
}

export function dragItemPast (item: Element, target: Element, position: 'before' | 'after'): void {
  let rect = target.getBoundingClientRect();
  let clientY = position === 'before' ? rect.top + 1 : rect.bottom - 1;
  dragItem(item, clientY);
}
