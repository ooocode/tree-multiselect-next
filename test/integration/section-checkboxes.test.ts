import { treeMultiselect } from '../../src/tree-multiselect.js';
import { dragItemPast } from './pointer-events.js';

import Common from './common.js';

describe('Section Checkboxes', () => {
  it('is all checked when all children are selected initially', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\' selected>Two</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.all('input[type=checkbox]').length, 3);
    assert.equal(Common.all('input.option[type=checkbox]').length, 2);
    assert.equal(Common.all('input.section[type=checkbox]').length, 1);
    assert.equal(Common.all('input[type=checkbox]:checked').length, 3);
  });

  it('should all be checked when all children are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo\'>Two</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.all('input[type=checkbox]').length, 3);
    assert.equal(Common.all('input.option[type=checkbox]').length, 2);
    assert.equal(Common.all('input.section[type=checkbox]').length, 1);

    assert.equal(Common.all('input.section[type=checkbox]:checked').length, 0);
    assert.equal(Common.all('input.option[type=checkbox]:checked').length, 1);

    let selections = Common.selection();
    let checkbox = Common.directChild(selections[selections.length - 1], 'input[type=checkbox]') as HTMLInputElement;
    checkbox.click();

    assert.equal(Common.all('input.section[type=checkbox]:checked').length, 1);
    assert.equal(Common.all('input.option[type=checkbox]:checked').length, 2);
  });

  it('should not check top level parent if only one child section is completely checked', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo/bar\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'foo/baz\'>Two</option>');
    treeMultiselect(Common.select());

    let topLevel = Common.section({ text: 'foo' })[0];
    let checkbox = topLevel.querySelector(':scope > div.title > input.section[type=checkbox]') as HTMLInputElement;
    assert.notOk(checkbox.checked);
  });

  it('should uncheck parent sections when a child is unselected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected>One</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.all('input.section[type=checkbox]:checked').length, 1);

    let checkbox = Common.directChild(Common.selection()[0], 'input.option[type=checkbox]') as HTMLInputElement;
    checkbox.click();

    assert.equal(Common.all('input.section[type=checkbox]:checked').length, 0);
  });

  it('checks nested titles', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top/middle/inner\'>One</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.sectionCheckbox().length, 3);
    assert.equal(Common.selectionCheckbox().length, 1);
    assert.equal(Common.all('input[type=checkbox]').length, 4);
    assert.equal(Common.all('input[type=checkbox]:checked').length, 0);

    let middleSectionCheckbox = Common.sectionCheckbox({ text: 'middle' })[0];
    middleSectionCheckbox.click();

    assert.equal(Common.all('div.title > input[type=checkbox]:checked').length, 3);
    assert.equal(Common.all('div.item > input[type=checkbox]:checked').length, 1);
    assert.equal(Common.all('input[type=checkbox]:checked').length, 4);
  });

  it('only checks relevant titles', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top/middle/inner\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\'>Two</option>');
    treeMultiselect(Common.select());

    assert.notOk(Common.sectionCheckbox({ text: 'top' })[0].checked);
    assert.notOk(Common.sectionCheckbox({ text: 'middle' })[0].checked);
    assert.notOk(Common.sectionCheckbox({ text: 'inner' })[0].checked);

    assert.notOk(Common.selectionCheckbox({ text: 'One' })[0].checked);

    Common.sectionCheckbox({ text: 'middle' })[0].click();

    assert.notOk(Common.sectionCheckbox({ text: 'top' })[0].checked);
    assert(Common.sectionCheckbox({ text: 'middle' })[0].checked);
    assert(Common.sectionCheckbox({ text: 'inner' })[0].checked);

    assert(Common.selectionCheckbox({ text: 'One' })[0].checked);
  });

  it('checkbox is indeterminate when some children are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top/middle/inner\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\'>Two</option>');
    treeMultiselect(Common.select());

    let topCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    assert.notOk(topCheckbox.checked);
    assert(topCheckbox.indeterminate);
  });

  it('checkbox is not indeterminate when all children are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\' selected>Two</option>');
    treeMultiselect(Common.select());

    let titleCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    assert.notOk(titleCheckbox.indeterminate);
  });

  it('checkbox is not indeterminate when no children are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\'>Two</option>');
    treeMultiselect(Common.select());

    let titleCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    assert.notOk(titleCheckbox.indeterminate);
  });

  it('checkbox doesn\'t select unselected readonly children', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top\' readonly>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\'>Two</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.selected().length, 0);

    let titleCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    titleCheckbox.click();

    assert.equal(Common.selected().length, 1);
    assert.equal(Common.selected({ value: 'two' }).length, 1);
  });

  it('checkbox doesn\'t unselect selected readonly children', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top\' selected readonly>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\' selected>Two</option>');
    treeMultiselect(Common.select());

    assert.equal(Common.selected().length, 2);

    let titleCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    titleCheckbox.click();

    assert.equal(Common.selected().length, 1);
    assert.equal(Common.selected({ value: 'one' }).length, 1);
  });

  it('keeps checkbox states when the selected panel is reordered', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'top\'>Three</option>');
    treeMultiselect(Common.select(), { sortable: true });

    let sectionCheckbox = Common.sectionCheckbox({ text: 'top' })[0];
    assert.notOk(sectionCheckbox.checked);
    assert(sectionCheckbox.indeterminate);

    let selected = Common.selected();
    let one = selected[0];
    let two = selected[selected.length - 1];

    dragItemPast(one, two, 'after');

    assert.deepEqual(Common.values(Common.select()), ['two', 'one']);
    assert.notOk(Common.sectionCheckbox({ text: 'top' })[0].checked);
    assert(Common.sectionCheckbox({ text: 'top' })[0].indeterminate);
    assert.equal(Common.selectionCheckbox({ checked: true }).length, 2);
    assert.equal(Common.selectionCheckbox({ value: 'three', checked: true }).length, 0);
  });
});
