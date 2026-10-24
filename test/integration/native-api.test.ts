import { treeMultiselect } from '../../src/tree-multiselect.js';

import './common.js';

function createSelect (sandbox: HTMLElement, optionsHtml: string): HTMLSelectElement {
  let select = document.createElement('select');
  select.multiple = true;
  select.innerHTML = optionsHtml;
  sandbox.appendChild(select);
  return select;
}

describe('TreeMultiselect entry', () => {
  let sandbox: HTMLElement;

  beforeEach(() => {
    sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
  });

  afterEach(() => {
    sandbox.remove();
  });

  it('renders a tree for a single select and returns one handle', () => {
    let select = createSelect(sandbox, '<option value=\'one\' data-section=\'test\'>One</option>');

    let handles = treeMultiselect(select, { searchable: true });

    assert.equal(handles.length, 1);
    assert.equal(sandbox.querySelectorAll('.tree-multiselect').length, 1);
    assert.equal(sandbox.querySelectorAll('.tree-multiselect .selections div.item').length, 1);
    assert.equal(select.getAttribute('multiple'), '');
    assert.equal(select.style.display, 'none');
  });

  it('keeps the handle working after a reload', () => {
    let select = createSelect(sandbox, '<option value=\'one\' data-section=\'test\'>One</option>');
    let handle = treeMultiselect(select)[0];

    select.innerHTML += '<option value=\'two\' data-section=\'test\'>Two</option>';
    handle.reload();

    assert.equal(sandbox.querySelectorAll('.tree-multiselect .selections div.item').length, 2);

    handle.remove();
    assert.equal(sandbox.querySelectorAll('.tree-multiselect').length, 0);
  });

  it('accepts an iterable of selects and returns one handle each', () => {
    let first = createSelect(sandbox, '<option value=\'one\' data-section=\'test\'>One</option>');
    let second = createSelect(sandbox, '<option value=\'two\' data-section=\'test\'>Two</option>');

    let handles = treeMultiselect([first, second]);

    assert.equal(handles.length, 2);
    assert.equal(sandbox.querySelectorAll('.tree-multiselect').length, 2);
  });

  it('accepts a NodeList of selects', () => {
    createSelect(sandbox, '<option value=\'one\' data-section=\'test\'>One</option>');
    createSelect(sandbox, '<option value=\'two\' data-section=\'test\'>Two</option>');

    let handles = treeMultiselect(sandbox.querySelectorAll('select'));

    assert.equal(handles.length, 2);
    assert.equal(sandbox.querySelectorAll('.tree-multiselect').length, 2);
  });

  it('accepts an array-like collection of selects', () => {
    let select = createSelect(sandbox, '<option value=\'one\' data-section=\'test\'>One</option>');
    let collection = { length: 1, 0: select } as unknown as HTMLSelectElement[];

    let handles = treeMultiselect(collection);

    assert.equal(handles.length, 1);
    assert.equal(sandbox.querySelectorAll('.tree-multiselect').length, 1);
  });

  it('rejects targets that are not select elements', () => {
    let div = document.createElement('div');
    sandbox.appendChild(div);

    assert.throws(() => {
      treeMultiselect(div as unknown as HTMLSelectElement);
    }, TypeError);
  });
});
