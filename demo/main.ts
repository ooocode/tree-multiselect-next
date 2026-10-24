import { treeMultiselect } from '../src/tree-multiselect.js';

import './setup.js';

treeMultiselect(document.querySelector('#test-select') as HTMLSelectElement, {
  enableSelectAll: true,
  sortable: true,
  selectAllText: '全选',
  unselectAllText: '全不选',
  onChange (allSelectedItems) {
    console.log(allSelectedItems);
  }
});

treeMultiselect(document.querySelector('#test-select-2') as HTMLSelectElement, {
  searchable: true
});

treeMultiselect(document.querySelector('#test-select-3') as HTMLSelectElement, {
  allowBatchSelection: false,
  enableSelectAll: true,
  maxSelections: 4,
  searchable: true,
  sortable: true,
  startCollapsed: true
});

treeMultiselect(document.querySelector('#test-select-4') as HTMLSelectElement, {
  allowBatchSelection: true,
  enableSelectAll: true,
  searchable: true,
  sortable: true,
  startCollapsed: true
});
