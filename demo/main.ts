import jQuery from 'jquery';

import './setup.js';

jQuery('#test-select').treeMultiselect({
  enableSelectAll: true,
  sortable: true,
  selectAllText: '全选',
  unselectAllText: '全不选',
  onChange(allSelectedItems, addedItems, removedItems) {
    console.log(allSelectedItems)
  },
});

jQuery('#test-select-2').treeMultiselect({
  searchable: true
});

jQuery('#test-select-3').treeMultiselect({
  allowBatchSelection: false,
  enableSelectAll: true,
  maxSelections: 4,
  searchable: true,
  sortable: true,
  startCollapsed: true
});

jQuery('#test-select-4').treeMultiselect({
  allowBatchSelection: true,
  enableSelectAll: true,
  searchable: true,
  sortable: true,
  startCollapsed: true
});
