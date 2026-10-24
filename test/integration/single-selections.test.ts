import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Single Selection', () => {
  it('can add an item', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), []);

    let checkboxes = Common.selectionCheckbox({ checked: false });
    assert.equal(checkboxes.length, 1);
    checkboxes[0].click();

    let checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 1);

    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('can remove an item', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one']);

    let checkboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkboxes.length, 1);
    checkboxes[0].click();

    let checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 0);

    assert.deepEqual(Common.values(Common.select()), []);
  });

  it('can add an item with the same text', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' selected>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['two']);

    let checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 1);

    let checkboxes = Common.selectionCheckbox();
    assert.equal(checkboxes.length, 2);

    checkboxes[0].click();

    checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 2);

    assert.deepEqual(Common.values(Common.select()), ['two', 'one']);
  });

  it('can add an item with the same value as another', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One2</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One3</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one']);

    let checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 1);

    let checkboxes = Common.selectionCheckbox();
    assert.equal(checkboxes.length, 3);

    checkboxes[checkboxes.length - 1].click();

    checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 2);

    assert.deepEqual(Common.values(Common.select()), ['one', 'one']);
  });

  it('can remove an item with the same value as another', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One2</option>');
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One3</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one', 'one']);

    let checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 2);

    let checkboxes = Common.selectionCheckbox();
    assert.equal(checkboxes.length, 3);

    checkboxes[checkboxes.length - 1].click();

    checkedCheckboxes = Common.selectionCheckbox({ checked: true });
    assert.equal(checkedCheckboxes.length, 1);

    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('can remove an item by selected item remove button', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one']);

    let selected = Common.selected();
    assert.equal(selected.length, 1);

    let removeSpan = Common.directChild(selected[0], '.remove-selected') as HTMLElement;
    removeSpan.click();

    assert.equal(Common.selected().length, 0);
    assert.deepEqual(Common.values(Common.select()), []);
  });

  it('can remove an item by unchecking selection checkbox', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one']);

    let selections = Common.selection();
    let checkbox = Common.directChild(selections[0], 'input[type=checkbox]') as HTMLInputElement;
    checkbox.click();

    assert.deepEqual(Common.values(Common.select()), []);
  });

  it('removing an item does not remove any others', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'section\' selected>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'section\' selected>Three</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one', 'two', 'three']);

    let selections = Common.selected();
    assert.equal(selections.length, 3);

    let removeSpan = Common.directChild(selections[0], '.remove-selected') as HTMLElement;
    removeSpan.click();

    assert.equal(Common.selected().length, 2);
    assert.deepEqual(Common.values(Common.select()), ['two', 'three']);
  });

  it('fires change event on original select', () => {
    return new Promise<void>((resolve) => {
      Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'section\' selected>One</option>');
      treeMultiselect(Common.select());

      Common.select().addEventListener('change', () => {
        resolve();
      });

      let checkbox = Common.directChild(Common.selection()[0], 'input[type=checkbox]') as HTMLInputElement;
      checkbox.click();
    });
  });
});
