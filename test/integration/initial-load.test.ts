import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Initial Load', () => {
  it('creates container', () => {
    assert.equal(Common.all('.tree-multiselect').length, 0);
    assert.equal(Common.all('.tree-multiselect div.selections').length, 0);
    assert.equal(Common.all('.tree-multiselect div.selected').length, 0);

    treeMultiselect(Common.select());
    assert.equal(Common.all('.tree-multiselect').length, 1);
    assert.equal(Common.all('.tree-multiselect div.selections').length, 1);
    assert.equal(Common.all('.tree-multiselect div.selected').length, 1);
  });

  it('renders option', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 1);

    let selection = selections[0];

    Common.assertSelection(selection, { text: 'One', value: 'one' });

    let checkbox = Common.directChild(selection, 'input[type=checkbox]') as HTMLInputElement;
    let label = Common.directChild(selection, 'label');
    assert(checkbox !== null);
    assert(label !== null);
    assert.equal(checkbox.id, label.getAttribute('for'));
  });

  it('renders multiple options', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\'>Two</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    Common.assertSelection(selections[0], { text: 'One', value: 'one' });
    Common.assertSelection(selections[1], { text: 'Two', value: 'two' });
  });

  it('renders options with the same value', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One duplicate</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    Common.assertSelection(selections[0], { text: 'One', value: 'one' });
    Common.assertSelection(selections[1], { text: 'One duplicate', value: 'one' });
  });

  it('renders options with the same value and text', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    Common.assertSelection(selections[0], { text: 'One', value: 'one' });
    Common.assertSelection(selections[1], { text: 'One', value: 'one' });
  });

  it('renders options without data-section', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\'>Two</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    Common.assertSelection(selections[0], { text: 'One', value: 'one' });
    Common.assertSelection(selections[1], { text: 'Two', value: 'two' });
  });

  it('respects selected attribute', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 1);

    let selected = Common.selected();
    assert.equal(selected.length, 1);

    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('respects data-index attribute', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'1\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 1);

    let selected = Common.selected();
    assert.equal(selected.length, 1);
    Common.assertSelection(selected[0], { text: 'One', value: 'one' });

    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('only respects data-index if selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'2\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'2\' selected>Two</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    let selected = Common.selected();
    assert.equal(selected.length, 1);
    Common.assertSelection(selected[0], { text: 'Two', value: 'two' });

    assert.deepEqual(Common.values(Common.select()), ['two']);
  });

  it('renders selected item correctly', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section/foo/bar\' data-index=\'1\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 1);

    let selected = Common.selected();
    assert.equal(selected.length, 1);

    Common.assertSelection(selected[0], { text: 'One', value: 'one' });

    let sectionName = Common.directChild(selected[0], '.section-name');
    assert(sectionName !== null);
    assert.equal(Common.textOf(sectionName), 'section/foo/bar');
  });

  it('ranks data-index lowest to highest', () => {
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'2\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'section\' data-index=\'3\' selected>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'1\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 3);

    let selected = Common.selected();
    assert.equal(selected.length, 3);

    Common.assertSelection(selected[0], { text: 'One', value: 'one' });
    Common.assertSelection(selected[1], { text: 'Two', value: 'two' });
    Common.assertSelection(selected[2], { text: 'Three', value: 'three' });

    assert.deepEqual(Common.values(Common.select()), ['one', 'two', 'three']);
  });

  it('handles non-consecutive data-index', () => {
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'593\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'1\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    let selected = Common.selected();
    assert.equal(selected.length, 2);

    Common.assertSelection(selected[0], { text: 'One', value: 'one' });
    Common.assertSelection(selected[1], { text: 'Two', value: 'two' });

    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);
  });

  it('ranks data-index higher than selected attribute', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' selected data-index=\'300\'>Two</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    let selected = Common.selected();
    assert.equal(selected.length, 2);

    Common.assertSelection(selected[0], { text: 'Two', value: 'two' });
    Common.assertSelection(selected[1], { text: 'One', value: 'one' });

    assert.deepEqual(Common.values(Common.select()), ['two', 'one']);
  });

  it('data-index doesn\'t do string comparison', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'2\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'10\' selected>Two</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    let selected = Common.selected();
    assert.equal(selected.length, 2);

    Common.assertSelection(selected[0], { text: 'One', value: 'one' });
    Common.assertSelection(selected[1], { text: 'Two', value: 'two' });

    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);
  });

  it('repeated data-index results in original order', () => {
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'2\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'2\' selected>One</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 2);

    let selected = Common.selected();
    assert.equal(selected.length, 2);

    Common.assertSelection(selected[0], { text: 'Two', value: 'two' });
    Common.assertSelection(selected[1], { text: 'One', value: 'one' });

    assert.deepEqual(Common.values(Common.select()), ['two', 'one']);
  });

  it('repeated data-index comes before sequential data-index', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' data-index=\'2\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' data-index=\'3\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'section\' data-index=\'2\' selected>Three</option>');
    treeMultiselect(Common.select());

    let selections = Common.selection();
    assert.equal(selections.length, 3);

    let selected = Common.selected();
    assert.equal(selected.length, 3);

    Common.assertSelection(selected[0], { text: 'One', value: 'one' });
    Common.assertSelection(selected[1], { text: 'Three', value: 'three' });
    Common.assertSelection(selected[2], { text: 'Two', value: 'two' });

    assert.deepEqual(Common.values(Common.select()), ['one', 'three', 'two']);
  });

  it('exposes treeMultiselect from the package entry', () => {
    assert.isFunction(treeMultiselect);
  });
});
