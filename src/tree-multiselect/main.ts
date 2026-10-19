import Tree from './tree.js';

import type { ResolvedTreeMultiselectOptions, TreeMultiselectHandle, TreeMultiselectOptions } from './types.js';

let uniqueId = 0;

// `this` is the jQuery collection the plugin was called on; the jQuery
// collection is only used as the public entry point, the tree itself is plain DOM
export default function treeMultiselect (this: JQuery, opts?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle> {
  let options = mergeDefaultOptions(opts);

  return this.map((_index, originalSelect) => {
    let selectNode = originalSelect as HTMLSelectElement;
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
  }) as unknown as JQuery<TreeMultiselectHandle>;
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
  // same as jQuery.extend({}, defaults, options): enumerable keys, undefined
  // values in options do not override the default
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
