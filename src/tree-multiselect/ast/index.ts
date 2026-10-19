import Item from './item.js';
import Section from './section.js';

import type { ItemOptions } from './item.js';
import type { SectionOptions } from './section.js';

export { Item, Section };

export type { ItemOptions, SectionOptions };

export interface Lookup {
  arr: (Item | Section)[];
  children: Record<string, Lookup>;
}

export function createLookup (arr: (Item | Section)[]): Lookup {
  return {
    arr: arr,
    children: {}
  };
}

export function createSection (obj: SectionOptions): Section {
  return new Section(obj);
}

export function createItem (obj: ItemOptions): Item {
  return new Item(obj);
}
