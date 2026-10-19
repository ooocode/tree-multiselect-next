export type NodeProps = Record<string, string | number | boolean | undefined> & {
  text?: string;
};

export interface SelectionAstNode {
  treeId?: number;
  id?: number;
  value?: string;
  text?: string | null;
  description?: string | null;
  initialIndex?: number | null;
  disabled?: boolean;
}

export interface SelectedAstNode {
  id?: number;
  value?: string;
  text?: string | null;
  section?: string | null;
  disabled?: boolean;
}

export interface SectionAstNode {
  id?: number;
  name?: string;
}

export function createNode (tag: string, props?: NodeProps): HTMLElement {
  var node = document.createElement(tag);

  if (props) {
    for (var key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key) && key !== 'text') {
        node.setAttribute(key, String(props[key]));
      }
    }
    if (props.text) {
      node.textContent = props.text;
    }
  }
  return node;
}

export function createSelection (astItem: SelectionAstNode, createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement {
  var props: NodeProps = {
    class: 'item',
    'data-key': astItem.id as number,
    'data-value': astItem.value as string
  };
  var hasDescription = !!astItem.description;
  if (hasDescription) {
    props['data-description'] = astItem.description as string;
  }
  if (astItem.initialIndex) {
    props['data-index'] = astItem.initialIndex;
  }
  var selectionNode = createNode('div', props);

  if (hasDescription) {
    var popup = createNode('span', { class: 'description', text: '?' });
    selectionNode.appendChild(popup);
  }
  if (!createCheckboxes) {
    // textContent does not force a layout the way innerText does
    selectionNode.textContent = (astItem.text || astItem.value) as string;
  } else {
    var optionLabelCheckboxId = `treemultiselect-${astItem.treeId}-${astItem.id}`;
    var inputCheckboxProps: NodeProps = {
      class: 'option',
      type: 'checkbox',
      id: optionLabelCheckboxId
    };
    if (disableCheckboxes || astItem.disabled) {
      inputCheckboxProps.disabled = true;
    }
    var inputCheckbox = createNode('input', inputCheckboxProps);
    // prepend child
    selectionNode.insertBefore(inputCheckbox, selectionNode.firstChild);

    var labelProps: NodeProps = {
      class: astItem.disabled ? 'disabled' : '',
      for: optionLabelCheckboxId,
      text: astItem.text || astItem.value
    };
    var label = createNode('label', labelProps);
    selectionNode.appendChild(label);
  }

  return selectionNode;
}

export function createSelected (astItem: SelectedAstNode, disableRemoval: boolean, showSectionOnSelected: boolean): HTMLElement {
  var node = createNode('div', {
    class: 'item',
    'data-key': astItem.id as number,
    'data-value': astItem.value as string,
    text: astItem.text || ''
  });

  if (!disableRemoval && !astItem.disabled) {
    var removalSpan = createNode('span', { class: 'remove-selected', text: '×' });
    node.insertBefore(removalSpan, node.firstChild);
  }

  if (showSectionOnSelected) {
    var sectionSpan = createNode('span', { class: 'section-name', text: astItem.section || '' });
    node.appendChild(sectionSpan);
  }

  return node;
}

export function createSection (astSection: SectionAstNode, createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement {
  var sectionNode = createNode('div', { class: 'section', 'data-key': astSection.id as number });

  var titleNode = createNode('div', { class: 'title', text: astSection.name });
  if (createCheckboxes) {
    var checkboxProps: NodeProps = {
      class: 'section',
      type: 'checkbox'
    };
    if (disableCheckboxes) {
      checkboxProps.disabled = true;
    }
    var checkboxNode = createNode('input', checkboxProps);
    titleNode.insertBefore(checkboxNode, titleNode.firstChild);
  }
  sectionNode.appendChild(titleNode);
  return sectionNode;
}
