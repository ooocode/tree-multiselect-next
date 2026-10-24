import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Reloading', () => {
  it('can reload tree', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\' data-description=\'One\'>One</option>');
    let tree = treeMultiselect(Common.select())[0];

    assert.equal(Common.selection().length, 1);
    assert.equal(Common.selection({ text: 'One' }).length, 1);

    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\' selected=\'selected\' data-description=\'Two\'>Two</option>');

    tree.reload();
    assert.equal(Common.selection().length, 2);
    assert.equal(Common.selection({ text: 'One' }).length, 1);
    assert.equal(Common.selection({ text: 'Two' }).length, 1);
  });

  it('reload saves user-changed options', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\' data-description=\'One\'>One</option>');
    let tree = treeMultiselect(Common.select())[0];

    assert.equal(Common.selection().length, 1);
    assert.equal(Common.selected().length, 1);
    assert.equal(Common.values(Common.select()).length, 1);

    Common.setValues(Common.select(), []);
    Common.dispatch(Common.select(), 'change');

    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\' selected=\'selected\' data-description=\'Two\'>Two</option>');
    tree.reload();

    assert.equal(Common.selection().length, 2);
    assert.equal(Common.selected().length, 1);
    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('fires a single change event per reload', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\'>One</option>');
    let tree = treeMultiselect(Common.select())[0];

    let changeCount = 0;
    Common.select().addEventListener('change', () => {
      ++changeCount;
    });

    tree.reload();

    assert.equal(changeCount, 1);
  });
});
