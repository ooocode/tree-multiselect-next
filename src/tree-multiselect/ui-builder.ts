export default class UiBuilder {
  el: HTMLElement;
  treeContainer: HTMLElement;
  selectionContainer: HTMLElement;
  selectedContainer: HTMLElement;

  constructor (el: HTMLElement, hideSidePanel: boolean) {
    let tree = document.createElement('div');
    tree.className = 'tree-multiselect';

    let selections = document.createElement('div');
    selections.className = 'selections';
    if (hideSidePanel) {
      selections.classList.add('no-border');
    }
    tree.appendChild(selections);

    let selected = document.createElement('div');
    selected.className = 'selected';
    if (!hideSidePanel) {
      tree.appendChild(selected);
    }

    this.el = el;
    this.treeContainer = tree;
    this.selectionContainer = selections;
    this.selectedContainer = selected;
  }

  attach (): void {
    let parentNode = this.el.parentNode;
    if (parentNode) {
      parentNode.insertBefore(this.treeContainer, this.el.nextSibling);
    }
  }

  remove (): void {
    this.treeContainer.remove();
  }
}
