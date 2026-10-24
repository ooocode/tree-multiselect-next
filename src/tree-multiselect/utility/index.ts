import * as array from './array.js';
import * as dom from './dom.js';

// `export * as array from ...` is ES2020 syntax; explicit imports keep the
// published ESM parseable by Chrome 61 / Firefox 60 / Safari 11.1.
export { array, dom };

export function assert (bool: unknown, message?: string): void {
  if (!bool) {
    throw new Error(message || 'Assertion failed');
  }
}

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
