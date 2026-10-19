import * as Ast from '../../src/tree-multiselect/ast/index.js';
import * as Util from '../../src/tree-multiselect/utility/index.js';

describe('Ast', () => {
  it('can tell that AST item is not a section', () => {
    var option = Ast.createItem({
      id: 0,
      value: 'val',
      text: 'text',
      description: 'description'
    });

    assert(option.isItem());
    assert.isFalse(option.isSection());
  });

  it('creates selection node with all properties', () => {
    var section = Ast.createSection('name' as unknown as Ast.SectionOptions);

    assert(section.isSection());
    assert.isFalse(section.isItem());
  });

  it('creates selection node with value as text', () => {
    var option = Ast.createItem({
      id: 0,
      value: 'val',
      text: null
    });
    var node = (Util.dom.createSelection as (...args: unknown[]) => HTMLElement)(option, 0, true, true);
    assert.equal(node.getAttribute('data-value'), 'val');
  });
});
