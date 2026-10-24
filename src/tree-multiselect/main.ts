import Tree from './tree.js';

import type { ResolvedTreeMultiselectOptions, TreeMultiselectHandle, TreeMultiselectOptions } from './types.js';

let uniqueId = 0;

export type TreeMultiselectTarget = HTMLSelectElement | Iterable<HTMLSelectElement>;

// Creates one independent tree per `<select>` and returns a handle for each, in
// the same order as the targets, so `treeMultiselect(select)[0]` works for the
// common single-select case.
export default function treeMultiselect (
  target: TreeMultiselectTarget,
  opts?: TreeMultiselectOptions
): TreeMultiselectHandle[] {
  let options = mergeDefaultOptions(opts);

  return selectElements(target).map((selectNode) => {
    selectNode.setAttribute('multiple', '');
    selectNode.style.display = 'none';

    let tree = new Tree(uniqueId, selectNode, options);
    tree.initialize();

    ++uniqueId;

    return {
      reload: function (): void {
        tree.reload();
      },

      remove: function (): void {
        tree.remove();
      }
    };
  });
}

function selectElements (target: TreeMultiselectTarget): HTMLSelectElement[] {
  if (isSelectElement(target)) {
    return [target];
  }

  if (target && typeof (target as Iterable<HTMLSelectElement>)[Symbol.iterator] === 'function') {
    let selects = Array.from(target as Iterable<HTMLSelectElement>);
    for (let ii = 0; ii < selects.length; ++ii) {
      if (!isSelectElement(selects[ii])) {
        throw new TypeError('treeMultiselect expects <select> elements');
      }
    }
    return selects;
  }

  throw new TypeError('treeMultiselect expects a <select> element or an iterable of them');
}

// Duck-typing keeps this working for elements created in another realm (iframe),
// where `instanceof HTMLSelectElement` would be false.
function isSelectElement (value: unknown): value is HTMLSelectElement {
  return typeof value === 'object' && value !== null && (value as Element).tagName === 'SELECT';
}

function mergeDefaultOptions (options?: TreeMultiselectOptions): ResolvedTreeMultiselectOptions {
  let defaults: ResolvedTreeMultiselectOptions = {
    allowBatchSelection: true,
    collapsible: true,
    enableSelectAll: false,
    selectAllText: 'Select All',
    unselectAllText: 'Unselect All',
    freeze: false,
    hideSidePanel: false,
    maxSelections: 0,
    onChange: null,
    onlyBatchSelection: false,
    searchable: false,
    searchParams: ['value', 'text', 'description', 'section'],
    sectionDelimiter: '/',
    showSectionOnSelected: true,
    sortable: false,
    startCollapsed: false
  };
  let merged = { ...defaults } as Record<string, unknown>;
  if (options) {
    let source = options as Record<string, unknown>;
    for (let key in source) {
      if (source[key] !== undefined) {
        merged[key] = source[key];
      }
    }
  }
  return merged as ResolvedTreeMultiselectOptions;
}
