import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Removing', () => {
  it('can remove tree', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\' data-description=\'One\'>One</option>');
    let tree = treeMultiselect(Common.select())[0];

    assert.equal(Common.all('.tree-multiselect').length, 1);

    tree.remove();
    assert.equal(Common.all('.tree-multiselect').length, 0);
  });
});
