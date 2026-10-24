import { treeMultiselect } from '../src/tree-multiselect.js';

describe('toolchain', () => {
  it('exposes treeMultiselect from the package entry', () => {
    assert.isFunction(treeMultiselect);
  });
});
