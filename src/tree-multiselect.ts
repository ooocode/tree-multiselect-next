import jQuery from 'jquery';

import treeMultiselect from './tree-multiselect/main.js';

import type { TreeMultiselectHandle, TreeMultiselectOptions } from './tree-multiselect/types.js';

jQuery.fn.treeMultiselect = treeMultiselect;

declare global {
  interface JQuery {
    treeMultiselect (options?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle>;
  }
}

export type { TreeMultiselectOptions, TreeMultiselectItem, TreeMultiselectHandle } from './tree-multiselect/types.js';
