import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Section Selections', () => {
  it('adds all child elements when section checkbox clicked', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\'>Two</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), []);
    let selected = Common.selected();
    assert.equal(selected.length, 0);

    let checkboxes = Common.sectionCheckbox();
    assert.equal(checkboxes.length, 1);
    checkboxes[0].click();

    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);

    selected = Common.selected();
    assert.equal(selected.length, 2);
    Common.assertSelected(selected[0], { text: 'One', value: 'one', section: 'foo' });
    Common.assertSelected(selected[1], { text: 'Two', value: 'two', section: 'foo' });
  });

  it('doesn\'t add child elements twice when other child elements are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'foo/bar/baz\' selected>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'foo/bar/baz\' selected>Four</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['three', 'four']);
    let selected = Common.selected();
    assert.equal(selected.length, 2);
    Common.assertSelected(selected[0], { text: 'Three', value: 'three', section: 'foo/bar/baz' });
    Common.assertSelected(selected[1], { text: 'Four', value: 'four', section: 'foo/bar/baz' });

    let checkboxes = Common.sectionCheckbox();
    assert.equal(checkboxes.length, 3);
    checkboxes[0].click();

    assert.deepEqual(Common.values(Common.select()), ['three', 'four', 'one', 'two']);

    selected = Common.selected();
    assert.equal(selected.length, 4);
    Common.assertSelected(selected[0], { text: 'Three', value: 'three', section: 'foo/bar/baz' });
    Common.assertSelected(selected[1], { text: 'Four', value: 'four', section: 'foo/bar/baz' });
    Common.assertSelected(selected[2], { text: 'One', value: 'one', section: 'foo' });
    Common.assertSelected(selected[3], { text: 'Two', value: 'two', section: 'foo' });
  });

  it('removes child elements when section unselected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'foo/bar/baz\' selected>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'foo/bar/baz\' selected>Four</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one', 'two', 'three', 'four']);
    let selected = Common.selected();
    Common.assertSelected(selected[0], { text: 'One', value: 'one', section: 'foo' });
    Common.assertSelected(selected[1], { text: 'Two', value: 'two', section: 'foo' });
    Common.assertSelected(selected[2], { text: 'Three', value: 'three', section: 'foo/bar/baz' });
    Common.assertSelected(selected[3], { text: 'Four', value: 'four', section: 'foo/bar/baz' });

    let checkboxes = Common.sectionCheckbox({ text: 'baz' });
    assert.equal(checkboxes.length, 1);
    checkboxes[0].click();

    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);

    selected = Common.selected();
    assert.equal(selected.length, 2);
    Common.assertSelected(selected[0], { text: 'One', value: 'one', section: 'foo' });
    Common.assertSelected(selected[1], { text: 'Two', value: 'two', section: 'foo' });
  });
});
