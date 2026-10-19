export * as array from './array.js';

export function assert (bool: unknown, message?: string): void {
  if (!bool) {
    throw new Error(message || 'Assertion failed');
  }
}

export * as dom from './dom.js';

export function getKey (el: Element): number {
  assert(el);
  return parseInt(el.getAttribute('data-key') as string);
}

export function isInteger (value: unknown): boolean {
  var x: number;
  if (isNaN(value as number)) {
    return false;
  }
  x = parseFloat(value as string);
  return (x | 0) === x;
}
