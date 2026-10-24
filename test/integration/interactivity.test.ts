import { treeMultiselect } from '../../src/tree-multiselect.js';

import Common from './common.js';

describe('Interactivity', () => {
  it('data-description pops up when moused over', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\' data-description=\'One\'>One</option>');
    treeMultiselect(Common.select());

    let descriptions = Common.all('div.item > span.description');
    assert.equal(descriptions.length, 1);

    Common.hover(descriptions[0]);
    let popups = Common.all('.temp-description-popup');
    assert.equal(popups.length, 1);
    assert.equal(Common.textOf(popups[0]), 'One');

    Common.unhover(descriptions[0]);
    popups = Common.all('.temp-description-popup');
    assert.equal(popups.length, 0);
  });

  it('data-description is removed when mouse leaves', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' selected=\'selected\' data-description=\'One\'>One</option>');
    treeMultiselect(Common.select());

    let descriptions = Common.all('div.item > span.description');
    assert.equal(descriptions.length, 1);

    Common.hover(descriptions[0]);
    let popups = Common.all('.temp-description-popup');
    assert.equal(popups.length, 1);

    Common.unhover(descriptions[0]);
    popups = Common.all('.temp-description-popup');
    assert.equal(popups.length, 0);
  });

  it('has correct label id', () => {
    Common.appendOptions(Common.select(), '<option value=\'one\' data-section=\'foo\' data-description=\'One\'>One</option>');
    treeMultiselect(Common.select());
    let option = Common.all('input.option')[0] as HTMLInputElement;
    assert(option !== undefined);
    assert(document.getElementById(option.id) !== null);

    let second = Common.appendSelect('two', '<option value=\'two\' data-section=\'foo\' data-description=\'Two\'>Two</option>');
    treeMultiselect(second);
    assert(document.getElementById(option.id) !== null);
  });
});
