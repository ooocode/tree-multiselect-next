import jQuery from 'jquery';

import './setup.js';

const $select = jQuery('#test-select');
for (let ii = 0; ii < 2000; ++ii) {
  const $option = jQuery('<option value="fruit' + ii + '" data-section="Smoothies/' + ii + '" data-description="The greatest flavor" selected="selected">Passion Fruit</option>');
  $select.append($option);
}
const time = Date.now();
console.profile('tree-multiselect');
$select.treeMultiselect({ enableSelectAll: true, sortable: true, searchable: true });
console.profileEnd();
console.log('time elapsed - ' + (Date.now() - time) + 'ms');
