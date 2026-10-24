import * as Ast from './ast/index.js';
import { onDelegated } from './events.js';
import Search from './search.js';
import { makeSelectedPanelSortable } from './sortable.js';
import UiBuilder from './ui-builder.js';
import * as Util from './utility/index.js';

import type Item from './ast/item.js';
import type Section from './ast/section.js';
import type { ResolvedTreeMultiselectOptions, TreeMultiselectItem } from './types.js';

const SEARCH_HIT_ATTR = 'searchhit';

function findDirectCheckbox (parent: HTMLElement): HTMLInputElement | null {
  for (let child = parent.firstElementChild; child !== null; child = child.nextElementSibling) {
    if (child.tagName === 'INPUT' && (child as HTMLInputElement).type === 'checkbox') {
      return child as HTMLInputElement;
    }
  }
  return null;
}

export default class Tree {
  id: number;
  selectNode: HTMLSelectElement;

  params: ResolvedTreeMultiselectOptions;

  uiBuilder!: UiBuilder;
  treeContainer!: HTMLElement;
  selectionContainer!: HTMLElement;
  selectedContainer!: HTMLElement;

  // data-key is key, provides DOM node
  astItems!: Record<string, Item>;
  astSections!: Record<string, Section>;
  selectedNodes!: Record<string, HTMLElement | null>;

  selectedKeys!: number[];
  keysToAdd!: number[];
  keysToRemove!: number[];

  constructor (id: number, selectNode: HTMLSelectElement, params: ResolvedTreeMultiselectOptions) {
    this.id = id;
    this.selectNode = selectNode;

    this.params = params;

    this.resetState();
  }

  initialize (): void {
    this.generateSelections(this.selectionContainer);

    this.popupDescriptionHover();

    if (this.params.allowBatchSelection) {
      this.handleSectionCheckboxMarkings();
    }

    if (this.params.collapsible) {
      this.addCollapsibility();
    }

    if (this.params.searchable || this.params.enableSelectAll) {
      let auxiliaryBox = Util.dom.createNode('div', { class: 'auxiliary' });
      this.selectionContainer.insertBefore(auxiliaryBox, this.selectionContainer.firstChild);

      if (this.params.searchable) {
        this.createSearchBar(auxiliaryBox);
      }

      if (this.params.enableSelectAll) {
        this.createSelectAllButtons(auxiliaryBox);
      }
    }

    this.armRemoveSelectedOnClick();
    this.updateSelectedAndOnChange();

    this.render(true);
    this.uiBuilder.attach();
  }

  remove (): void {
    this.uiBuilder.remove();
    this.resetState();
  }

  reload (): void {
    let selectedValues = new Set<string>();
    this.selectedKeys.forEach((key) => {
      selectedValues.add(this.astItems[key].value as string);
    });

    this.remove();

    let children = this.selectNode.children;
    for (let ii = 0; ii < children.length; ++ii) {
      let child = children[ii];
      if (child.tagName !== 'OPTION') {
        continue;
      }
      let option = child as HTMLOptionElement;
      if (selectedValues.has(option.value)) {
        option.setAttribute('selected', 'selected');
      } else {
        option.removeAttribute('selected');
      }
    }

    this.initialize();
  }

  resetState (): void {
    this.uiBuilder = new UiBuilder(this.selectNode, this.params.hideSidePanel);
    this.treeContainer = this.uiBuilder.treeContainer;
    this.selectionContainer = this.uiBuilder.selectionContainer;
    this.selectedContainer = this.uiBuilder.selectedContainer;

    this.astItems = {};
    this.astSections = {};
    this.selectedNodes = {};

    this.selectedKeys = [];
    this.keysToAdd = [];
    this.keysToRemove = [];
  }

  generateSelections (parentNode: HTMLElement): void {
    let ast = this.createAst(this.optionElements());
    this.generateHtml(ast, parentNode);
  }

  optionElements (): HTMLOptionElement[] {
    let children = this.selectNode.children;
    let options: HTMLOptionElement[] = [];
    for (let ii = 0; ii < children.length; ++ii) {
      if (children[ii].tagName === 'OPTION') {
        options.push(children[ii] as HTMLOptionElement);
      }
    }
    return options;
  }

  createAst (options: HTMLOptionElement[]): (Item | Section)[] {
    let data: (Item | Section)[] = [];
    let lookup = Ast.createLookup(data);

    let itemId = 0;
    let sectionId = 0;

    let initialIndexItems = new Map<number, number[]>();
    let keysToAddAtEnd: number[] = [];
    for (let optionIndex = 0; optionIndex < options.length; ++optionIndex) {
      let option = options[optionIndex];
      option.setAttribute('data-key', String(itemId));

      let item = Ast.createItem({
        treeId: this.id,
        id: itemId,
        value: option.value,
        text: option.text,
        description: option.getAttribute('data-description'),
        initialIndex: option.getAttribute('data-index'),
        section: option.getAttribute('data-section'),
        disabled: option.hasAttribute('readonly'),
        selected: option.hasAttribute('selected')
      });

      if (item.initialIndex && item.selected) {
        let itemsAtIndex = initialIndexItems.get(item.initialIndex);
        if (itemsAtIndex) {
          itemsAtIndex.push(itemId);
        } else {
          initialIndexItems.set(item.initialIndex, [itemId]);
        }
      } else if (item.selected) {
        keysToAddAtEnd.push(itemId);
      }
      this.astItems[itemId] = item;

      ++itemId;

      let lookupPosition = lookup;
      let section = item.section;
      let sectionParts = (section && section.length > 0) ? section.split(this.params.sectionDelimiter) : [];
      for (let ii = 0; ii < sectionParts.length; ++ii) {
        let sectionPart = sectionParts[ii];
        if (lookupPosition.children[sectionPart]) {
          lookupPosition = lookupPosition.children[sectionPart];
        } else {
          let newSection = Ast.createSection({
            treeId: this.id,
            id: sectionId,
            name: sectionPart
          });
          ++sectionId;

          lookupPosition.arr.push(newSection);
          let newLookupNode = Ast.createLookup(newSection.items);
          lookupPosition.children[sectionPart] = newLookupNode;
          lookupPosition = newLookupNode;
        }
      }
      lookupPosition.arr.push(item);
    }
    let initialIndexes = Array.from(initialIndexItems.keys()).sort((a, b) => a - b);
    let keysToAdd: number[] = [];
    for (let ii = 0; ii < initialIndexes.length; ++ii) {
      keysToAdd.push(...(initialIndexItems.get(initialIndexes[ii]) as number[]));
    }
    keysToAdd.push(...keysToAddAtEnd);
    this.keysToAdd = keysToAdd;
    Util.array.uniq(this.keysToAdd);
    return data;
  }

  generateHtml (astArr: (Item | Section)[], parentNode: HTMLElement): void {
    for (let ii = 0; ii < astArr.length; ++ii) {
      const astObj = astArr[ii];
      if (astObj.isSection()) {
        const astSection = astObj as Section;
        this.astSections[astSection.id as number] = astSection;

        let createCheckboxes = this.params.allowBatchSelection;
        let disableCheckboxes = this.params.freeze;
        let node = astSection.render(createCheckboxes, disableCheckboxes);
        parentNode.appendChild(node);
        this.generateHtml(astSection.items, node);
      } else if (astObj.isItem()) {
        const astItem = astObj as Item;
        this.astItems[astItem.id as number] = astItem;

        let createCheckboxes = !this.params.onlyBatchSelection;
        let disableCheckboxes = this.params.freeze;
        let node = astItem.render(createCheckboxes, disableCheckboxes);
        parentNode.appendChild(node);
      }
    }
  }

  popupDescriptionHover (): void {
    onDelegated<HTMLElement>(this.selectionContainer, 'mouseover', 'div.item > span.description', (descriptionNode) => {
      let itemNode = descriptionNode.parentElement as HTMLElement;
      let description = itemNode.getAttribute('data-description');

      let descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'temp-description-popup';
      descriptionDiv.innerHTML = description as string;

      descriptionDiv.style.position = 'absolute';

      itemNode.appendChild(descriptionDiv);
    });

    onDelegated<HTMLElement>(this.selectionContainer, 'mouseout', 'div.item > span.description', (descriptionNode) => {
      let itemNode = descriptionNode.parentElement as HTMLElement;
      let popups = itemNode.querySelectorAll('div.temp-description-popup');
      for (let ii = 0; ii < popups.length; ++ii) {
        popups[ii].remove();
      }
    });
  }

  handleSectionCheckboxMarkings (): void {
    onDelegated<HTMLInputElement>(this.selectionContainer, 'click', 'input.section[type=checkbox]', (checkbox) => {
      let sectionNode = checkbox.closest('div.section') as HTMLElement;
      let itemNodes = sectionNode.querySelectorAll('div.item');
      let keys: number[] = [];
      for (let ii = 0; ii < itemNodes.length; ++ii) {
        let key = Util.getKey(itemNodes[ii]);
        let astItem = this.astItems[key];
        if (!astItem.disabled && !astItem.isNotSearchHit()) {
          keys.push(key);
        }
      }

      if (checkbox.checked) {
        // TODO why does this always take this branch
        this.keysToAdd.push(...keys);
        Util.array.uniq(this.keysToAdd);
      } else {
        this.keysToRemove.push(...keys);
        Util.array.uniq(this.keysToRemove);
      }
      this.render();
    });
  }

  redrawSectionCheckboxes (sectionNode: HTMLElement = this.selectionContainer): number {
    // Items without a checkbox (onlyBatchSelection) fall back to the canonical
    // selection list for their checked state.
    return this.redrawSectionCheckbox(sectionNode, new Set(this.selectedKeys));
  }

  redrawSectionCheckbox (sectionNode: HTMLElement, selectedKeys: Set<number>): number {
    // returns array; bit 1 is all children are true, bit 0 is all children are false
    let returnVal = 0b11;

    for (let child = sectionNode.firstElementChild; child !== null; child = child.nextElementSibling) {
      let childEl = child as HTMLElement;

      if (childEl.classList.contains('section')) {
        returnVal &= this.redrawSectionCheckbox(childEl, selectedKeys);
      } else if (childEl.classList.contains('item')) {
        let checkbox = findDirectCheckbox(childEl);
        let isChecked = checkbox ? checkbox.checked : selectedKeys.has(Util.getKey(childEl));

        if (isChecked) {
          returnVal &= ~0b10;
        } else {
          returnVal &= ~0b01;
        }
      }
    }

    let titleNode = sectionNode.firstElementChild as HTMLElement | null;
    if (titleNode && titleNode.classList.contains('title')) {
      let sectionCheckbox = findDirectCheckbox(titleNode);
      if (sectionCheckbox) {
        if (returnVal & 0b01) {
          sectionCheckbox.checked = true;
          sectionCheckbox.indeterminate = false;
        } else if (returnVal & 0b10) {
          sectionCheckbox.checked = false;
          sectionCheckbox.indeterminate = false;
        } else {
          sectionCheckbox.checked = false;
          sectionCheckbox.indeterminate = true;
        }
      }
    }

    return returnVal;
  }

  addCollapsibility (): void {
    let titleSelector = 'div.title';
    let titleNodes = this.selectionContainer.querySelectorAll(titleSelector);
    for (let ii = 0; ii < titleNodes.length; ++ii) {
      titleNodes[ii].insertBefore(Util.dom.createNode('span', { class: 'collapse-section' }), titleNodes[ii].firstChild);
    }

    let sectionSelector = 'div.section';
    if (this.params.startCollapsed) {
      let sectionNodes = this.selectionContainer.querySelectorAll(sectionSelector);
      for (let ii = 0; ii < sectionNodes.length; ++ii) {
        sectionNodes[ii].classList.add('collapsed');
      }
    }

    onDelegated<HTMLElement>(this.selectionContainer, 'click', titleSelector, (title, event) => {
      if ((event.target as Element).nodeName === 'INPUT') {
        return;
      }

      let section = title.parentElement as HTMLElement;
      section.classList.toggle('collapsed');
      event.stopPropagation();
    });
  }

  createSearchBar (parentNode: HTMLElement): void {
    let searchObj = new Search(SEARCH_HIT_ATTR, this.astItems, this.astSections, this.params.searchParams);

    let searchNode = Util.dom.createNode('input', { class: 'search', placeholder: 'Search...' });
    parentNode.appendChild(searchNode);

    onDelegated<HTMLInputElement>(this.selectionContainer, 'input', 'input.search', (input) => {
      searchObj.search(input.value);
    });
  }

  createSelectAllButtons (parentNode: HTMLElement): void {
    let selectAllNode = Util.dom.createNode('span', { class: 'select-all', text: this.params.selectAllText });
    let unselectAllNode = Util.dom.createNode('span', { class: 'unselect-all', text: this.params.unselectAllText });

    let selectAllContainer = Util.dom.createNode('div', { class: 'select-all-container' });
    selectAllContainer.appendChild(selectAllNode);
    selectAllContainer.appendChild(unselectAllNode);

    parentNode.appendChild(selectAllContainer);

    onDelegated(this.selectionContainer, 'click', 'span.select-all', () => {
      this.keysToAdd.push(...this.unfilteredNodeIds());
      this.render();
    });

    onDelegated(this.selectionContainer, 'click', 'span.unselect-all', () => {
      this.keysToRemove.push(...this.unfilteredNodeIds());
      this.render();
    });
  }

  unfilteredNodeIds (): number[] {
    let keys: number[] = [];
    for (let key in this.astItems) {
      let astItem = this.astItems[key];
      let node = astItem.node as HTMLElement;
      if (!node.hasAttribute(SEARCH_HIT_ATTR) ||
        node.getAttribute(SEARCH_HIT_ATTR) === 'true') {
        keys.push(astItem.id as number);
      }
    }
    return keys;
  }

  armRemoveSelectedOnClick (): void {
    onDelegated<HTMLElement>(this.selectedContainer, 'click', 'span.remove-selected', (removeSpan) => {
      let key = Util.getKey(removeSpan.parentElement as Element);
      this.keysToRemove.push(key);
      this.render();
    });
  }

  updateSelectedAndOnChange (): void {
    onDelegated<HTMLInputElement>(this.selectionContainer, 'click', 'input.option[type=checkbox]', (checkbox) => {
      let key = Util.getKey(checkbox.parentElement as Element);
      Util.assert(key || key === 0);

      if (checkbox.checked) {
        this.keysToAdd.push(key);
      } else {
        this.keysToRemove.push(key);
      }

      this.render();
    });

    if (this.params.sortable && !this.params.freeze) {
      makeSelectedPanelSortable(this.selectedContainer, (startIndex, endIndex) => {
        Util.array.moveEl(this.selectedKeys, startIndex, endIndex);
        this.render();
      });
    }
  }

  render (noCallbacks?: boolean): void {
    // fix arrays first
    Util.array.uniq(this.keysToAdd);
    Util.array.uniq(this.keysToRemove);

    Util.array.subtract(this.keysToAdd, this.selectedKeys);
    Util.array.intersect(this.keysToRemove, this.selectedKeys);

    // check for max number of selections
    if (Util.isInteger(this.params.maxSelections) && this.params.maxSelections > 0) {
      const currentLength = this.keysToAdd.length - this.keysToRemove.length + this.selectedKeys.length;
      if (currentLength > this.params.maxSelections) {
        let lengthToCut = currentLength - this.params.maxSelections;
        let keysToCut: number[] = [];
        if (lengthToCut > this.selectedKeys.length) {
          keysToCut.push(...this.selectedKeys);
          lengthToCut -= this.selectedKeys.length;
          keysToCut.push(...(this.keysToAdd.splice(0, lengthToCut)));
        } else {
          keysToCut.push(...this.selectedKeys.slice(0, lengthToCut));
        }
        this.keysToRemove.push(...keysToCut);
      }
    }

    // remove items first
    for (let ii = 0; ii < this.keysToRemove.length; ++ii) {
      // remove the selected divs
      let node = this.selectedNodes[this.keysToRemove[ii]];
      if (node) {
        // slightly more verbose than node.remove(), but more browser support
        (node.parentNode as Element).removeChild(node);
        this.selectedNodes[this.keysToRemove[ii]] = null;
      }

      // uncheck these checkboxes (items only have one when !onlyBatchSelection)
      let selectionNode = this.astItems[this.keysToRemove[ii]].node as HTMLElement;
      let selectionInput = selectionNode.getElementsByTagName('INPUT')[0] as HTMLInputElement | undefined;
      if (selectionInput) {
        selectionInput.checked = false;
      }
    }

    Util.array.subtract(this.selectedKeys, this.keysToRemove);

    // now add items; build them off-document so the browser lays out once
    let newSelectedNodes = document.createDocumentFragment();
    for (let jj = 0; jj < this.keysToAdd.length; ++jj) {
      // create selected divs
      let key = this.keysToAdd[jj];
      let astItem = this.astItems[key];

      let selectedNode = Util.dom.createSelected(astItem, this.params.freeze, this.params.showSectionOnSelected);
      this.selectedNodes[astItem.id as number] = selectedNode;
      newSelectedNodes.appendChild(selectedNode);

      // check the checkboxes
      let inputNode = astItem.node as HTMLElement | null;
      if (inputNode) {
        let input = inputNode.getElementsByTagName('INPUT')[0] as HTMLInputElement | undefined;
        if (input) {
          input.checked = true;
        }
      }
    }

    if (newSelectedNodes.childNodes.length) {
      this.selectedContainer.appendChild(newSelectedNodes);
    }

    this.selectedKeys.push(...this.keysToAdd);
    Util.array.uniq(this.selectedKeys);

    // redraw section checkboxes; only selection membership can change them, so
    // a render that only reorders (e.g. sortable) can skip the whole tree walk
    if (this.keysToAdd.length || this.keysToRemove.length) {
      this.redrawSectionCheckboxes();
    }

    // now fix original select
    let originalValsHash: Record<string, boolean> = {};
    // valHash hashes a value to an index
    let valHash: Record<string, number> = {};
    for (let kk = 0; kk < this.selectedKeys.length; ++kk) {
      let value = this.astItems[this.selectedKeys[kk]].value as string;
      originalValsHash[this.selectedKeys[kk]] = true;
      valHash[value] = kk;
    }
    // TODO is there a better way to sort the values other than by HTML?
    // NOTE: the following does not work since duplicate option values are indistinguishable
    // this.selectNode.value = vals;
    let options = Array.from(this.selectNode.querySelectorAll('option')) as HTMLOptionElement[];
    let previousOrder = options.slice();
    options.sort(function (a, b) {
      let aValue = valHash[a.value] || 0;
      let bValue = valHash[b.value] || 0;
      return aValue - bValue;
    });

    let orderChanged = false;
    for (let ii = 0; ii < options.length; ++ii) {
      if (options[ii] !== previousOrder[ii]) {
        orderChanged = true;
        break;
      }
    }
    if (orderChanged) {
      // appending moves the existing nodes, so there is no need to empty first
      let fragment = document.createDocumentFragment();
      for (let ii = 0; ii < options.length; ++ii) {
        fragment.appendChild(options[ii]);
      }
      this.selectNode.appendChild(fragment);
    }

    for (let ii = 0; ii < options.length; ++ii) {
      let option = options[ii];
      let shouldBeSelected = !!originalValsHash[Util.getKey(option)];
      if (option.selected !== shouldBeSelected) {
        option.selected = shouldBeSelected;
      }
    }
    // native change event: listeners bound with addEventListener still fire
    this.selectNode.dispatchEvent(new Event('change', { bubbles: true }));

    if (!noCallbacks && this.params.onChange) {
      let optionsSelected = this.selectedKeys.map((key) => {
        return this.astItems[key] as unknown as TreeMultiselectItem;
      });
      let optionsAdded = this.keysToAdd.map((key) => {
        return this.astItems[key] as unknown as TreeMultiselectItem;
      });
      let optionsRemoved = this.keysToRemove.map((key) => {
        return this.astItems[key] as unknown as TreeMultiselectItem;
      });
      this.params.onChange(optionsSelected, optionsAdded, optionsRemoved);
    }

    this.keysToRemove = [];
    this.keysToAdd = [];
  }
}
