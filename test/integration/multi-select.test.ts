import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Binding multiple selects', () => {
  it('creates one independent tree per matched select', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');

    let second = Common.createFixtureSelect();
    Common.appendOptions(second, '<option value=\'two\' data-section=\'test\'>Two</option>');

    let handles = treeMultiselect([Common.select(), second]);

    assert.equal(handles.length, 2);
    assert.equal(Common.all('.tree-multiselect').length, 2);

    let valuesPerTree = Common.all('.tree-multiselect').map((tree) => {
      return Array.from(tree.querySelectorAll('.selections div.item'))
        .map((item) => item.getAttribute('data-value'));
    });

    assert.deepEqual(valuesPerTree, [['one'], ['two']]);
  });

  it('keeps checkbox ids unique across trees', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');

    let second = Common.createFixtureSelect();
    Common.appendOptions(second, '<option value=\'two\' data-section=\'test\'>Two</option>');

    treeMultiselect([Common.select(), second]);

    let ids = Common.all('input.option[type=checkbox]').map((element) => (element as HTMLInputElement).id);
    assert.equal(ids.length, 2);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('selects only the item in the tree that was clicked', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');

    let second = Common.createFixtureSelect();
    Common.appendOptions(second, '<option value=\'two\' data-section=\'test\'>Two</option>');

    treeMultiselect([Common.select(), second]);

    let trees = Common.all('.tree-multiselect');
    let checkbox = trees[0].querySelector('.selections div.item > input.option[type=checkbox]') as HTMLInputElement;
    checkbox.click();

    assert.deepEqual(Common.values(Common.select()), ['one']);
    assert.deepEqual(Common.values(second), []);
    assert.equal(trees[0].querySelectorAll('.selected div.item').length, 1);
    assert.equal(trees[1].querySelectorAll('.selected div.item').length, 0);
  });
});
