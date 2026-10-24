import { treeMultiselect } from '../../src/tree-multiselect.js';
import { dragItemPast } from './pointer-events.js';

import Common from './common.js';

import type { TreeMultiselectItem } from '../../src/tree-multiselect/types.js';

describe('Options', () => {
  it('is collapsible', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\'>Three</option>');
    treeMultiselect(Common.select());

    let sections = Common.section();
    assert.equal(sections.length, 1);

    let titles = Common.directChildren(sections[0], 'div.title');
    assert.equal(titles.length, 1);

    for (let section of Common.section()) {
      assert(!Common.hasClass(section, 'collapsed'));
    }

    titles[0].click();

    for (let section of Common.section()) {
      assert(Common.hasClass(section, 'collapsed'));
    }
  });

  it('startCollapsed', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test/inner\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test/inner2\'>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'1\' data-section=\'another\'>Beep</option>');
    treeMultiselect(Common.select(), { startCollapsed: true });

    let sections = Common.section();
    assert.equal(sections.length, 4);
    let hiddenSections = sections.filter((section) => Common.hasClass(section, 'collapsed'));
    assert.equal(hiddenSections.length, 4);
  });

  it('startCollapsed doesn\'t do anything if collapsible is false', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\'>Three</option>');

    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'test/inner\'>Four</option>');
    Common.appendOptions(Common.select(), '<option value=\'five\' data-section=\'test/inner2\'>Five</option>');
    Common.appendOptions(Common.select(), '<option value=\'Six\' data-section=\'test/inner2\'>Six</option>');

    treeMultiselect(Common.select(), { collapsible: false, startCollapsed: true });

    let sections = Common.section();
    assert.equal(sections.length, 3);

    let titles = sections.map((section) => Common.directChild(section, 'div.title'));
    assert.equal(titles.length, 3);

    for (let element of Common.selection()) {
      assert.notOk(Common.hasClass(element, 'collapsed'));
    }

    for (let title of titles) {
      (title as HTMLElement).click();
      for (let element of Common.selection()) {
        assert.notOk(Common.hasClass(element, 'collapsed'));
      }
    }
  });

  it('can set a different section delimiter', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'top-inner\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'top-inner\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'top-inner2\'>Three</option>');

    treeMultiselect(Common.select(), { sectionDelimiter: '-' });

    let selections = Common.selection();
    assert.equal(selections.length, 3);

    let sections = Common.section();
    assert.equal(sections.length, 3);
    let innerSections = Common.directChildren(sections[0], '.section');
    assert.equal(innerSections.length, 2);

    assert.equal(Common.textOf(Common.directChild(innerSections[0], 'div.title') as HTMLElement), 'inner');
    assert.equal(Common.textOf(Common.directChild(innerSections[1], 'div.title') as HTMLElement), 'inner2');
  });

  it('can disable batch selection', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\'>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'test/inner\'>Four</option>');
    Common.appendOptions(Common.select(), '<option value=\'five\' data-section=\'test/inner2\'>Five</option>');
    Common.appendOptions(Common.select(), '<option value=\'Six\' data-section=\'test/inner2\'>Six</option>');
    treeMultiselect(Common.select(), { allowBatchSelection: false });

    assert.equal(Common.all('input.section[type=checkbox]').length, 0);
  });

  it('can disable section display for selected items', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' data-description=\'foobar\' selected=\'selected\'>One</option>');
    treeMultiselect(Common.select(), { showSectionOnSelected: false });

    let selectedItem = Common.selection();
    assert.equal(selectedItem.length, 1);
    assert.equal(selectedItem[0].querySelectorAll('span.section-name').length, 0);
  });

  it('can freeze selections', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    treeMultiselect(Common.select(), { freeze: true });

    let checkboxes = Common.selectionCheckbox();
    assert.equal(checkboxes.length, 2);
    for (let checkbox of checkboxes) {
      assert(checkbox.disabled);
    }

    let removeSpans = Common.all('div.selected span.remove-selected');
    assert.equal(removeSpans.length, 0);
  });

  it('section checkboxes are indetermine if some children are selected', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    treeMultiselect(Common.select(), { freeze: true });

    let sectionCheckbox = Common.sectionCheckbox({ text: 'test' })[0];
    assert(sectionCheckbox !== undefined);
    assert(sectionCheckbox.indeterminate);
    assert(!sectionCheckbox.checked);
  });

  it('applies only to one tree and not another', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    treeMultiselect(Common.select());

    let frozen = Common.appendSelect('frozen', '<option value=\'two\' data-section=\'anothertest\' selected=\'selected\'>Two</option>');
    treeMultiselect(frozen, { freeze: true });

    let frozenOption = Common.selection({ text: 'Two' })[0];
    assert(frozenOption !== undefined);
    assert((frozenOption.querySelector('input[type=checkbox]') as HTMLInputElement).disabled);

    let unfrozenOption = Common.selection({ text: 'One' })[0];
    assert(unfrozenOption !== undefined);
    let checkbox = unfrozenOption.querySelector('input[type=checkbox]') as HTMLInputElement;
    assert.notOk(checkbox.disabled);
    checkbox.click();

    let unfrozenSelection = Common.selected({ text: 'One' });
    assert.equal(unfrozenSelection.length, 1);
    assert.deepEqual(Common.values(Common.select()), ['one']);
    assert.deepEqual(Common.values(frozen), ['two']);
  });

  it('hides side panel', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    treeMultiselect(Common.select(), { hideSidePanel: true });

    assert.equal(Common.all('div.selected').length, 0);
  });

  it('onlyBatchSelection gives checkboxes to only sections', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    treeMultiselect(Common.select(), { onlyBatchSelection: true });

    assert.equal(Common.all('input.section[type=checkbox]').length, 1);
    assert.equal(Common.all('input.option[type=checkbox]').length, 0);
  });

  it('can select and unselect through section checkboxes with onlyBatchSelection', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    treeMultiselect(Common.select(), { onlyBatchSelection: true });

    let sectionCheckbox = Common.sectionCheckbox({ text: 'test' })[0];

    sectionCheckbox.click();
    assert.equal(Common.selected().length, 2);
    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);

    sectionCheckbox.click();
    assert.equal(Common.selected().length, 0);
    assert.deepEqual(Common.values(Common.select()), []);
  });

  it('calls onChange with correct arguments when item is added', () => {
    return new Promise<void>((resolve) => {
      Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
      Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
      treeMultiselect(Common.select(), {
        onChange: function (all: TreeMultiselectItem[], added: TreeMultiselectItem[], removed: TreeMultiselectItem[]) {
          assert.equal(all.length, 2);
          assert.equal(added.length, 1);
          assert.equal(removed.length, 0);
          let expectedSecondSelections = [all[1], added[0]];
          for (let ii = 0; ii < expectedSecondSelections.length; ++ii) {
            let selection = expectedSecondSelections[ii];
            assert.equal(selection.text, 'Two');
            assert.equal(selection.value, 'two');
            assert.isNull(selection.initialIndex);
            assert.equal(selection.section, 'test');
          }
          assert.equal(all[0].text, 'One');
          assert.equal(all[0].value, 'one');
          assert.isNull(all[0].initialIndex);
          assert.equal(all[0].section, 'test');
          resolve();
        }
      });

      let item = Common.selection({ text: 'Two' })[0];
      assert(item !== undefined);
      (item.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    });
  });

  it('calls onChange with correct arguments when item is removed', () => {
    return new Promise<void>((resolve) => {
      Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
      Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
      treeMultiselect(Common.select(), {
        onChange: function (all: TreeMultiselectItem[], added: TreeMultiselectItem[], removed: TreeMultiselectItem[]) {
          assert.equal(all.length, 0);
          assert.equal(added.length, 0);
          assert.equal(removed.length, 1);
          assert.equal(removed[0].text, 'One');
          assert.equal(removed[0].value, 'one');
          assert.isNull(removed[0].initialIndex);
          assert.equal(removed[0].section, 'test');
          resolve();
        }
      });

      let item = Common.selection({ text: 'One' })[0];
      assert(item !== undefined);
      (item.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    });
  });

  it('fixes original select value when sorted', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected>Two</option>');
    treeMultiselect(Common.select(), { sortable: true });

    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);

    let selected = Common.selected();
    assert.equal(selected.length, 2);
    let one = selected[0];
    let two = selected[selected.length - 1];

    assert(Common.hasClass(Common.all('div.selected')[0], 'sortable-enabled'));
    dragItemPast(one, two, 'after');

    assert.deepEqual(Common.values(Common.select()), ['two', 'one']);
  });

  it('puts selected items in right order when sorted', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected>Two</option>');
    treeMultiselect(Common.select(), { sortable: true });

    let selected = Common.selected();
    assert.equal(selected.length, 2);
    let one = selected[0];
    let two = selected[selected.length - 1];

    Common.assertSelected(one, { text: 'One', value: 'one', section: 'test' });
    Common.assertSelected(two, { text: 'Two', value: 'two', section: 'test' });

    dragItemPast(one, two, 'after');

    selected = Common.selected();
    assert.equal(selected.length, 2);
    Common.assertSelected(selected[0], { text: 'Two', value: 'two', section: 'test' });
    Common.assertSelected(selected[selected.length - 1], { text: 'One', value: 'one', section: 'test' });
  });

  it('doesn\'t do anything when sorted in same order', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected>Two</option>');
    treeMultiselect(Common.select(), { sortable: true });

    let selected = Common.selected();
    assert.equal(selected.length, 2);
    let one = selected[0];
    let two = selected[selected.length - 1];

    Common.assertSelected(one, { text: 'One', value: 'one', section: 'test' });
    Common.assertSelected(two, { text: 'Two', value: 'two', section: 'test' });

    dragItemPast(one, two, 'before');

    selected = Common.selected();
    assert.equal(selected.length, 2);
    Common.assertSelected(selected[0], { text: 'One', value: 'one', section: 'test' });
    Common.assertSelected(selected[selected.length - 1], { text: 'Two', value: 'two', section: 'test' });
  });

  it('select all button works', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    treeMultiselect(Common.select(), { enableSelectAll: true });

    let selectAll = document.querySelector('.select-all') as HTMLElement;
    assert(selectAll !== null);

    let selectedItems = Common.selected();
    assert.equal(selectedItems.length, 0);
    assert.deepEqual(Common.values(Common.select()), [], 'an empty multi-select has no values');

    selectAll.click();

    selectedItems = Common.selected();
    assert.equal(selectedItems.length, 2);
    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);
  });

  it('unselect button works', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    treeMultiselect(Common.select(), { enableSelectAll: true });

    let unselectAll = document.querySelector('.unselect-all') as HTMLElement;
    assert(unselectAll !== null);

    let selectedItems = Common.selected();
    assert.equal(selectedItems.length, 2);
    assert.deepEqual(Common.values(Common.select()), ['one', 'two']);

    unselectAll.click();

    selectedItems = Common.selected();
    assert.equal(selectedItems.length, 0);
    assert.deepEqual(Common.values(Common.select()), [], 'an empty multi-select has no values');
  });

  it('select all text option', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    let selectAllText = 'foobar';
    treeMultiselect(Common.select(), { enableSelectAll: true, selectAllText: selectAllText });

    let selectAll = document.querySelector('.select-all') as HTMLElement;
    assert.equal(selectAll.textContent, selectAllText);
  });

  it('unselect all text option', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    let unselectAllText = 'foobar';
    treeMultiselect(Common.select(), { enableSelectAll: true, unselectAllText: unselectAllText });

    let unselectAll = document.querySelector('.unselect-all') as HTMLElement;
    assert.equal(unselectAll.textContent, unselectAllText);
  });

  it('can have individual readonly attributes', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\' readonly>Two</option>');
    treeMultiselect(Common.select());

    let firstSelectionCheckbox = Common.selectionCheckbox({ value: 'one' });
    assert.equal(firstSelectionCheckbox.length, 1);
    assert.isFalse(firstSelectionCheckbox[0].disabled);

    let secondSelectionCheckbox = Common.selectionCheckbox({ value: 'two' });
    assert.equal(secondSelectionCheckbox.length, 1);
    assert.isTrue(secondSelectionCheckbox[0].disabled);
  });

  it('has readonly attributes that still appear in select val', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected readonly>One</option>');
    treeMultiselect(Common.select());

    assert.deepEqual(Common.values(Common.select()), ['one']);
  });

  it('cannot remove readonly elements by selected elements', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\' readonly>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    treeMultiselect(Common.select());

    let selected = Common.selected();
    assert.equal(selected.length, 2);

    let removeSpans = Common.all('.selected .item > span.remove-selected');
    assert.equal(removeSpans.length, 1);
    (removeSpans[0] as HTMLElement).click();

    selected = Common.selected();
    assert.equal(selected.length, 1);

    selected = Common.selected({ value: 'one' });
    assert.equal(selected.length, 1);
  });

  it('can set a maximum number of selections', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\' selected=\'selected\'>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'test\' selected=\'selected\'>Four</option>');
    treeMultiselect(Common.select(), { maxSelections: 2 });

    assert.equal(Common.selected().length, 2);
    assert.deepEqual(Common.values(Common.select()), ['three', 'four']);

    let checkboxes = Common.selectionCheckbox();
    checkboxes[0].click();

    assert.equal(Common.selected().length, 2);
    assert.deepEqual(Common.values(Common.select()), ['four', 'one']);
  });

  it('maximum number of selections doesn\'t work with negative numbers', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\' selected=\'selected\'>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'test\' selected=\'selected\'>Four</option>');
    treeMultiselect(Common.select(), { maxSelections: -1 });

    assert.equal(Common.selected().length, 4);
  });

  it('maximum number of selections doesn\'t work with non-numerical truthy values', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\' selected=\'selected\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\' selected=\'selected\'>Three</option>');
    Common.appendOptions(Common.select(), '<option value=\'four\' data-section=\'test\' selected=\'selected\'>Four</option>');
    treeMultiselect(Common.select(), { maxSelections: true as unknown as number });

    assert.equal(Common.selected().length, 4);
  });

  it('applies maxSelections to a batch selection made through a section checkbox', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
    Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
    Common.appendOptions(Common.select(), '<option value=\'three\' data-section=\'test\'>Three</option>');
    treeMultiselect(Common.select(), { maxSelections: 1 });

    Common.sectionCheckbox({ text: 'test' })[0].click();

    assert.equal(Common.selected().length, 1);
    assert.equal(Common.selectionCheckbox({ checked: true }).length, 1);
  });

  it('calls onChange with the post-change state when a section checkbox is clicked', () => {
    return new Promise<void>((resolve) => {
      Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\'>One</option>');
      Common.appendOptions(Common.select(), '<option value=\'two\' data-section=\'test\'>Two</option>');
      treeMultiselect(Common.select(), {
        onChange: function (all: TreeMultiselectItem[], added: TreeMultiselectItem[], removed: TreeMultiselectItem[]) {
          assert.equal(all.length, 2);
          assert.equal(added.length, 2);
          assert.equal(removed.length, 0);
          resolve();
        }
      });

      Common.sectionCheckbox({ text: 'test' })[0].click();
    });
  });

  it('does not make the selected panel sortable when selections are frozen', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'test\' selected=\'selected\'>One</option>');
    treeMultiselect(Common.select(), { freeze: true, sortable: true });

    assert.equal(Common.hasClass(Common.all('div.selected')[0], 'sortable-enabled'), false);
  });
});
