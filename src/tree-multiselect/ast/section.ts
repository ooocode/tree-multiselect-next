import * as AstCommon from './common.js';

import * as Util from '../utility/index.js';

import type Item from './item.js';

export interface SectionOptions {
  treeId?: number;
  id?: number;
  name?: string;
}

export default class Section {
  treeId: number | undefined;
  id: number | undefined;
  name: string | undefined;
  items: (Item | Section)[];

  node: HTMLElement | null;

  constructor (obj?: SectionOptions) {
    obj = obj || {};

    this.treeId = obj.treeId;
    this.id = obj.id;
    this.name = obj.name;
    this.items = [];

    this.node = null;
  }

  isSection (): true {
    return true;
  }

  isItem (): false {
    return false;
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
      this.node = Util.dom.createSection(this, createCheckboxes, disableCheckboxes);
    }
    return this.node;
  }
}
