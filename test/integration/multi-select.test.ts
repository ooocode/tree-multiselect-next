import Common from './common.js';

describe('Binding multiple selects', () => {
  it('creates one independent tree per matched select', () => {
    $('select').append('<option value=\'one\' data-section=\'test\'>One</option>');

    var second = Common.createFixtureSelect();
    $(second).append('<option value=\'two\' data-section=\'test\'>Two</option>');

    var handles = $('select').treeMultiselect();

    assert.equal(handles.length, 2);
    assert.equal($('.tree-multiselect').length, 2);

    var $trees = $('.tree-multiselect');
    var valuesPerTree = Array.from($trees).map((tree) => {
      return $(tree).find('.selections div.item').map((itemIdx, item) => $(item).attr('data-value')).get();
    });

    assert.deepEqual(valuesPerTree, [['one'], ['two']]);
  });

  it('keeps checkbox ids unique across trees', () => {
    $('select').append('<option value=\'one\' data-section=\'test\'>One</option>');

    var second = Common.createFixtureSelect();
    $(second).append('<option value=\'two\' data-section=\'test\'>Two</option>');

    $('select').treeMultiselect();

    var ids = $('input.option[type=checkbox]').map((idx, el) => el.id).get();
    assert.equal(ids.length, 2);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('selects only the item in the tree that was clicked', () => {
    $('select').append('<option value=\'one\' data-section=\'test\'>One</option>');

    var second = Common.createFixtureSelect();
    $(second).append('<option value=\'two\' data-section=\'test\'>Two</option>');

    $('select').treeMultiselect();

    var $trees = $('.tree-multiselect');
    $trees.eq(0).find('.selections div.item > input.option[type=checkbox]').click();

    assert.deepEqual($('select').val(), ['one']);
    assert.deepEqual($(second).val(), []);
    assert.equal($trees.eq(0).find('.selected div.item').length, 1);
    assert.equal($trees.eq(1).find('.selected div.item').length, 0);
  });
});
