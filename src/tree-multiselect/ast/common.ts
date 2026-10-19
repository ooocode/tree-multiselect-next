const SEARCH_HIT_ATTR = 'searchhit';
const SEARCH_HIT_ATTR_VAL_TRUE = 'true';
const SEARCH_HIT_ATTR_VAL_FALSE = 'false';

export function addSearchHitMarker (node: HTMLElement | null, isSearchHit: boolean): void {
  if (node) {
    node.setAttribute(SEARCH_HIT_ATTR, isSearchHit ? SEARCH_HIT_ATTR_VAL_TRUE : SEARCH_HIT_ATTR_VAL_FALSE);
  }
}

export function removeSearchHitMarker (node: HTMLElement | null): void {
  if (node) {
    node.removeAttribute(SEARCH_HIT_ATTR);
  }
}

export function isNotSearchHit (node: HTMLElement | null): boolean {
  return !!node && node.getAttribute(SEARCH_HIT_ATTR) === SEARCH_HIT_ATTR_VAL_FALSE;
}
