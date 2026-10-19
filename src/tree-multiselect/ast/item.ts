import * as AstCommon from './common.js';

import * as Util from '../utility/index.js';

export interface ItemOptions {
  treeId?: number;
  id?: number;
  value?: string;
  text?: string | null;
  description?: string | null;
  initialIndex?: string | null;
  section?: string | null;
  disabled?: boolean;
  selected?: boolean;
}

export default class Item {
  treeId: number | undefined;
  id: number | undefined;
  value: string | undefined;
  text: string | null | undefined;
  description: string | null | undefined;
  initialIndex: number | null;
  section: string | null | undefined;
  disabled: boolean | undefined;
  selected: boolean | undefined;

  node: HTMLElement | null;

  constructor (obj?: ItemOptions) {
    obj = obj || {};

    this.treeId = obj.treeId;
    this.id = obj.id;
    this.value = obj.value;
    this.text = obj.text;
    this.description = obj.description;
    this.initialIndex = obj.initialIndex ? parseInt(obj.initialIndex) : null;
    this.section = obj.section;
    this.disabled = obj.disabled;
    this.selected = obj.selected;

    this.node = null;
  }

  isSection (): false {
    return false;
  }

  isItem (): true {
    return true;
  }

  addSearchHitMarker (isSearchHit: boolean): void {
    AstCommon.addSearchHitMarker(this.node, isSearchHit);
  }

  removeSearchHitMarker (isSearchHit?: boolean): void {
    void isSearchHit;
    AstCommon.removeSearchHitMarker(this.node);
  }

  isNotSearchHit (): boolean {
    return AstCommon.isNotSearchHit(this.node);
  }

  render (createCheckboxes: boolean, disableCheckboxes: boolean): HTMLElement {
    if (!this.node) {
      this.node = Util.dom.createSelection(this, createCheckboxes, disableCheckboxes);
    }
    return this.node;
  }
}
