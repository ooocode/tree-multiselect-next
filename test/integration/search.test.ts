import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

import type { FindOptions } from './common.js';

function getVisibleSelections (props?: FindOptions): HTMLElement[] {
  return Common.selection(props).filter((element) => {
    return element.getAttribute('searchhit') === 'true';
  });
}

function getHiddenSelections (props?: FindOptions): HTMLElement[] {
  return Common.selection(props).filter((element) => {
    return element.getAttribute('searchhit') === 'false';
  });
}

function selectionHit (options: FindOptions): string | null {
  let element = Common.selection(options)[0];
  return element ? element.getAttribute('searchhit') : null;
}

function sectionHit (options: FindOptions): string | null {
  let element = Common.section(options)[0];
  return element ? element.getAttribute('searchhit') : null;
}

describe('Search', () => {
  let searchInput!: HTMLInputElement;

  describe('default behavior', () => {
    beforeEach(() => {
      // value, section
      Common.appendOptions(Common.select(), '<option value=\'abcde\' data-section=\'s1\'></option>');

      // section
      Common.appendOptions(Common.select(), '<option value=\'fghij\' data-section=\'s1\'>yyyyy</option>');

      // text
      Common.appendOptions(Common.select(), '<option value=\'KLMNOP\' data-section=\'s2\'>klmnop</option>');

      // description
      Common.appendOptions(Common.select(), '<option value=\'QRS\' data-section=\'ttt/uuu/vvv\' data-description=\'fox\'></option>');

      // description with spaces
      Common.appendOptions(Common.select(), '<option value=\'passion\' data-section=\'s3\' data-description=\'Passion\'></option>');
      Common.appendOptions(Common.select(), '<option value=\'passionfruit\' data-section=\'fruit\' data-description=\'Passion Fruit\'></option>');

      treeMultiselect(Common.select(), { searchable: true, enableSelectAll: true });

      searchInput = Common.all('input.search')[0] as HTMLInputElement;
      assert(searchInput !== undefined);
    });

    it('matches on value', () => {
      ['a', 'c', 'abc', 'cde', 'bcd', 'abcde', 'abcd'].forEach((searchTerm) => {
        Common.typeInto(searchInput, searchTerm);
        assert.equal(selectionHit({ value: 'abcde' }), 'true');
        assert.equal(selectionHit({ value: 'fghij' }), 'false');
        assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
        assert.equal(selectionHit({ value: 'QRS' }), 'false');
      });

      ['fghij', 'ghi', 'fgh'].forEach((searchTerm) => {
        Common.typeInto(searchInput, searchTerm);
        assert.equal(selectionHit({ value: 'abcde' }), 'false');
        assert.equal(selectionHit({ value: 'fghij' }), 'true');
        assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
        assert.equal(selectionHit({ value: 'QRS' }), 'false');
      });

      ['q', 'qr', 'qrs', 'rs'].forEach((searchTerm) => {
        Common.typeInto(searchInput, searchTerm);
        assert.equal(selectionHit({ value: 'abcde' }), 'false');
        assert.equal(selectionHit({ value: 'fghij' }), 'false');
        assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
        assert.equal(selectionHit({ value: 'QRS' }), 'true');
      });
    });

    it('matches on section', () => {
      Common.typeInto(searchInput, 's1');
      assert.equal(selectionHit({ value: 'abcde' }), 'true');
      assert.equal(selectionHit({ value: 'fghij' }), 'true');
      assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
      assert.equal(selectionHit({ value: 'QRS' }), 'false');
    });

    it('matches on text', () => {
      Common.typeInto(searchInput, 'yyy');
      assert.equal(selectionHit({ value: 'abcde' }), 'false');
      assert.equal(selectionHit({ value: 'fghij' }), 'true');
      assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
      assert.equal(selectionHit({ value: 'QRS' }), 'false');
    });

    it('matches on description', () => {
      Common.typeInto(searchInput, 'fox');
      assert.equal(selectionHit({ value: 'abcde' }), 'false');
      assert.equal(selectionHit({ value: 'fghij' }), 'false');
      assert.equal(selectionHit({ value: 'KLMNOP' }), 'false');
      assert.equal(selectionHit({ value: 'QRS' }), 'true');
    });

    it('hides sections with no nodes visible', () => {
      Common.typeInto(searchInput, 's1');
      assert.equal(sectionHit({ text: 's1' }), 'true');
      assert.equal(sectionHit({ text: 's2' }), 'false');
      assert.equal(sectionHit({ text: 'ttt' }), 'false');
      assert.equal(sectionHit({ text: 'uuu' }), 'false');
      assert.equal(sectionHit({ text: 'vvv' }), 'false');

      Common.typeInto(searchInput, 'uuu');
      assert.equal(sectionHit({ text: 's1' }), 'false');
      assert.equal(sectionHit({ text: 's2' }), 'false');
      assert.equal(sectionHit({ text: 'ttt' }), 'true');
      assert.equal(sectionHit({ text: 'uuu' }), 'true');
      assert.equal(sectionHit({ text: 'vvv' }), 'true');
    });

    it('shows all sections when no search term is entered', () => {
      Common.typeInto(searchInput, '43t#Q%'); // no nodes should be shown
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, ''); // no nodes should be shown
      assert.equal(getHiddenSelections().length, 0);
    });

    it('only adds filtered selections when using section checkbox', () => {
      Common.typeInto(searchInput, 'abcde');

      assert.equal(Common.selected().length, 0);
      Common.sectionCheckbox({ text: 's1' })[0].click();
      assert.equal(Common.selected().length, 1);

      Common.typeInto(searchInput, 'fox');
      assert.equal(Common.selected().length, 1);
      let tttCheckbox = Common.sectionCheckbox({ text: 'ttt' })[0];
      tttCheckbox.click();
      assert.equal(Common.selected().length, 2);

      tttCheckbox.click();
      assert.equal(Common.selected().length, 1);
    });

    it('only adds filtered selections when selecting and unselecting all', () => {
      Common.typeInto(searchInput, 's1');

      let selectAll = document.querySelector('.select-all') as HTMLElement;
      let unselectAll = document.querySelector('.unselect-all') as HTMLElement;
      assert(selectAll !== null);
      assert(unselectAll !== null);

      assert.equal(Common.selected().length, 0);
      selectAll.click();
      assert.equal(Common.selected().length, 2);

      Common.typeInto(searchInput, 'abcde');
      unselectAll.click();
      assert.equal(Common.selected().length, 1);
    });

    it('handles empty search queries', () => {
      Common.typeInto(searchInput, ' ');

      assert.equal(getVisibleSelections().length, 0);
      assert.equal(getHiddenSelections().length, 0);
    });

    it('handles search queries with spaces in them', () => {
      Common.typeInto(searchInput, 'passion ');
      assert.equal(getVisibleSelections().length, 2);
      assert.equal(getHiddenSelections().length, 4);

      Common.typeInto(searchInput, 'passion f ');
      assert.equal(getVisibleSelections().length, 1);
      assert.equal(getHiddenSelections().length, 5);
    });
  });

  describe('custom search params', () => {
    beforeEach(() => {
      Common.appendOptions(Common.select(), '<option value=\'abcde\' data-section=\'s1\' data-description=\'xyz\'>ayy</option>');
    });

    it('section only', () => {
      treeMultiselect(Common.select(), { searchable: true, searchParams: ['section'] });
      searchInput = Common.all('input.search')[0] as HTMLInputElement;

      Common.typeInto(searchInput, 's1');
      assert.equal(getVisibleSelections().length, 1);

      Common.typeInto(searchInput, 'abc');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'ayy');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'xyz');
      assert.equal(getVisibleSelections().length, 0);
    });

    it('value only', () => {
      treeMultiselect(Common.select(), { searchable: true, searchParams: ['value'] });
      searchInput = Common.all('input.search')[0] as HTMLInputElement;

      Common.typeInto(searchInput, 's1');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'abc');
      assert.equal(getVisibleSelections().length, 1);

      Common.typeInto(searchInput, 'ayy');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'xyz');
      assert.equal(getVisibleSelections().length, 0);
    });

    it('text and description', () => {
      treeMultiselect(Common.select(), { searchable: true, searchParams: ['text', 'description'] });
      searchInput = Common.all('input.search')[0] as HTMLInputElement;

      Common.typeInto(searchInput, 's1');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'abc');
      assert.equal(getVisibleSelections().length, 0);

      Common.typeInto(searchInput, 'ayy');
      assert.equal(getVisibleSelections().length, 1);

      Common.typeInto(searchInput, 'xyz');
      assert.equal(getVisibleSelections().length, 1);
    });
  });

  describe('regex metacharacters', () => {
    beforeEach(() => {
      Common.appendOptions(Common.select(), '<option value=\'a[b\' data-section=\'s1\'>a[b</option>');
      Common.appendOptions(Common.select(), '<option value=\'plain\' data-section=\'s1\'>plain</option>');
      treeMultiselect(Common.select(), { searchable: true });
      searchInput = Common.all('input.search')[0] as HTMLInputElement;
    });

    it('matches a query containing regex metacharacters literally', () => {
      Common.typeInto(searchInput, 'a[b');
      assert.equal(getVisibleSelections().length, 1);
    });

    it('does not treat a regex-like query as a regular expression', () => {
      Common.typeInto(searchInput, '.*');
      assert.equal(getVisibleSelections().length, 0);
    });
  });
});
