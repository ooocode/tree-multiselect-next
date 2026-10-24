import { treeMultiselect } from '../src/tree-multiselect.js';

import './setup.js';

const select = document.querySelector('#test-select') as HTMLSelectElement;
for (let ii = 0; ii < 2000; ++ii) {
  let option = document.createElement('option');
  option.value = 'fruit' + ii;
  option.setAttribute('data-section', 'Smoothies/' + ii);
  option.setAttribute('data-description', 'The greatest flavor');
  option.selected = true;
  option.textContent = 'Passion Fruit';
  select.appendChild(option);
}

const time = Date.now();
console.profile('tree-multiselect');
treeMultiselect(select, { enableSelectAll: true, sortable: true, searchable: true });
console.profileEnd();
console.log('time elapsed - ' + (Date.now() - time) + 'ms');
