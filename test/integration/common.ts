export interface FindOptions {
  text?: string;
  value?: string;
  section?: string;
  checked?: boolean;
}

let fixture: HTMLElement | null = null;
let selectCount = 1;
let fixtureSelect: HTMLSelectElement | null = null;

function getFixture (): HTMLElement {
  if (!fixture) {
    fixture = document.createElement('div');
    fixture.id = 'fixture';
    document.body.appendChild(fixture);
  }
  return fixture;
}

function createFixtureSelect (): HTMLSelectElement {
  let select = document.createElement('select');
  select.id = 'select-' + selectCount;
  ++selectCount;
  select.setAttribute('multiple', 'multiple');
  getFixture().appendChild(select);
  return select;
}

beforeEach(() => {
  getFixture().replaceChildren();
  selectCount = 0;
  fixtureSelect = createFixtureSelect();
});

export function select (): HTMLSelectElement {
  return fixtureSelect as HTMLSelectElement;
}

export function appendSelect (id: string, optionsHtml = ''): HTMLSelectElement {
  let select = createFixtureSelect();
  select.id = id;
  appendOptions(select, optionsHtml);
  return select;
}

// Parses option markup and appends it to a select without going through a
// selector engine.
export function appendOptions (selectNode: HTMLSelectElement, optionsHtml: string): void {
  let template = document.createElement('template');
  template.innerHTML = optionsHtml;
  selectNode.append(...Array.from(template.content.children) as HTMLOptionElement[]);
}

export function values (selectNode: HTMLSelectElement): string[] {
  return Array.from(selectNode.options).filter((option) => option.selected).map((option) => option.value);
}

export function setValues (selectNode: HTMLSelectElement, selectedValues: string[]): void {
  let wanted = new Set(selectedValues);
  for (let ii = 0; ii < selectNode.options.length; ++ii) {
    selectNode.options[ii].selected = wanted.has(selectNode.options[ii].value);
  }
}

export function dispatch (target: EventTarget, eventType: string): void {
  target.dispatchEvent(new Event(eventType, { bubbles: true }));
}

export function typeInto (input: HTMLInputElement, value: string): void {
  input.value = value;
  dispatch(input, 'input');
}

export function hover (element: Element): void {
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}

export function unhover (element: Element): void {
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
}

export function textOf (element: Element): string {
  let label = element.querySelector(':scope > label');
  if (label) {
    return label.textContent || '';
  }

  // Drop child elements (remove buttons, section names) and keep text nodes.
  let clone = element.cloneNode(true) as Element;
  while (clone.firstElementChild) {
    clone.removeChild(clone.firstElementChild);
  }
  return clone.textContent || '';
}

export function hasClass (element: Element, className: string): boolean {
  return element.classList.contains(className);
}

function escapeAttributeValue (value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function find (containerSelector: string, options?: FindOptions): HTMLElement[] {
  let selector = containerSelector;
  if (options && options.value) {
    selector += `[data-value="${escapeAttributeValue(options.value)}"]`;
  }

  let elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (options && options.text) {
    let text = options.text;
    elements = elements.filter((element) => textOf(element) === text);
  }
  return elements;
}

export function all (selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

export function directChild (element: Element, selector: string): HTMLElement | null {
  return element.querySelector(':scope > ' + selector);
}

export function directChildren (element: Element, selector: string): HTMLElement[] {
  return Array.from(element.children).filter((child) => child.matches(selector)) as HTMLElement[];
}

function directCheckboxes (elements: HTMLElement[]): HTMLInputElement[] {
  let checkboxes: HTMLInputElement[] = [];
  for (let ii = 0; ii < elements.length; ++ii) {
    for (let child = elements[ii].firstElementChild; child !== null; child = child.nextElementSibling) {
      if (child.tagName === 'INPUT' && (child as HTMLInputElement).type === 'checkbox') {
        checkboxes.push(child as HTMLInputElement);
      }
    }
  }
  return checkboxes;
}

function findCheckbox (containerSelector: string, options?: FindOptions): HTMLInputElement[] {
  let checkboxes = directCheckboxes(find(containerSelector, options));
  if (options && options.checked !== undefined) {
    checkboxes = checkboxes.filter((checkbox) => checkbox.checked === options.checked);
  }
  return checkboxes;
}

export function selection (options?: FindOptions): HTMLElement[] {
  return find('.selections .item', options);
}

export function selected (options?: FindOptions): HTMLElement[] {
  return find('.selected .item', options);
}

export function section (options?: FindOptions): HTMLElement[] {
  return find('.selections .section > .title', options)
    .map((title) => title.parentElement as HTMLElement);
}

export function selectionCheckbox (options?: FindOptions): HTMLInputElement[] {
  return findCheckbox('.selections .item', options);
}

export function sectionCheckbox (options?: FindOptions): HTMLInputElement[] {
  return findCheckbox('.selections .section > .title', options);
}

export function assertSelection (element: Element, params: FindOptions): void {
  assert(element.classList.contains('item'));
  assert.equal(textOf(element), params.text);
  assert.equal(element.getAttribute('data-value'), params.value);
}

export function assertSelected (element: Element, params: FindOptions): void {
  assertSelection(element, params);
  let sectionName = element.querySelector(':scope > .section-name');
  assert(sectionName !== null);
  assert.equal(textOf(sectionName), params.section);
}

export default {
  all,
  appendOptions,
  appendSelect,
  assertSelected,
  assertSelection,
  createFixtureSelect,
  directChild,
  directChildren,
  dispatch,
  find,
  hasClass,
  hover,
  section,
  sectionCheckbox,
  select,
  selected,
  selection,
  selectionCheckbox,
  setValues,
  textOf,
  typeInto,
  unhover,
  values
};
