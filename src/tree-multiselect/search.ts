import * as Util from './utility/index.js';

import type Item from './ast/item.js';
import type Section from './ast/section.js';
import type { TreeMultiselectSearchParam } from './types.js';

const MAX_SAMPLE_SIZE = 3;

export default class Search {
  searchHitAttr: string;
  // key: at most three-letter combination, value: array of data-key
  index: Map<string, number[]>;

  // key: data-key, value: DOM node
  astItems: Record<string, Item>;

  astSections: Record<string, Section>;

  searchParams!: TreeMultiselectSearchParam[];

  constructor (searchHitAttr: string, astItems: Record<string, Item>, astSections: Record<string, Section>, searchParams: TreeMultiselectSearchParam[]) {
    this.searchHitAttr = searchHitAttr;
    this.index = new Map();

    this.astItems = astItems;

    this.astSections = astSections;

    this.setSearchParams(searchParams);

    this.buildIndex();
  }

  setSearchParams (searchParams: TreeMultiselectSearchParam[]): void {
    Util.assert(Array.isArray(searchParams));

    let allowedParams: Record<string, boolean> = {
      value: true,
      text: true,
      description: true,
      section: true
    };

    this.searchParams = [];
    for (let ii = 0; ii < searchParams.length; ++ii) {
      if (allowedParams[searchParams[ii]]) {
        this.searchParams.push(searchParams[ii]);
      }
    }
  }

  buildIndex (): void {
    // trigrams
    for (let astItemKey in this.astItems) {
      let astItem = this.astItems[astItemKey];
      for (let ii = 0; ii < this.searchParams.length; ++ii) {
        let searchWord = astItem[this.searchParams[ii]] as unknown;
        if (!searchWord && searchWord !== 0) {
          continue;
        }

        let words = String(searchWord).toLowerCase().split(' ');
        for (let jj = 0; jj < words.length; ++jj) {
          this._addToIndex(words[jj], astItem.id as number);
        }
      }
    }
  }

  _addToIndex (key: string, id: number): void {
    for (let sampleSize = 1; sampleSize <= MAX_SAMPLE_SIZE; ++sampleSize) {
      for (let startOffset = 0; startOffset < key.length - sampleSize + 1; ++startOffset) {
        let minikey = key.substring(startOffset, startOffset + sampleSize);

        let ids = this.index.get(minikey);
        if (!ids) {
          ids = [];
          this.index.set(minikey, ids);
        }

        // don't duplicate
        // this takes advantage of the fact that the minikeys with same id's are added sequentially
        let length = ids.length;
        if (length === 0 || ids[length - 1] !== id) {
          ids.push(id);
        }
      }
    }
  }

  search (value: string): void {
    value = value.trim();

    if (!value) {
      for (let id in this.astItems) {
        this.astItems[id].removeSearchHitMarker();
      }
      for (let id in this.astSections) {
        this.astSections[id].removeSearchHitMarker();
      }
      return;
    }

    value = value.toLowerCase();

    let searchWords = value.split(' ').filter(word => word);
    let searchChunks: number[][] = [];
    for (let ii = 0; ii < searchWords.length; ++ii) {
      let chunks = splitWord(searchWords[ii]);
      for (let jj = 0; jj < chunks.length; ++jj) {
        searchChunks.push(this.index.get(chunks[jj]) || []);
      }
    }

    let matchedNodeIds = Util.array.intersectMany(searchChunks);

    // now we have id's that match search query
    this.handleNodeVisibilities(matchedNodeIds);
  }

  handleNodeVisibilities (shownNodeIds: number[]): void {
    let shownNodeIdsSet = new Set(shownNodeIds);
    let sectionsToNotHide = new Set<number>();
    for (let ii = 0; ii < shownNodeIds.length; ++ii) {
      let node = this.astItems[shownNodeIds[ii]].node as HTMLElement;

      // now search for parent sections
      node = node.parentElement as HTMLElement;
      while (node && !node.classList.contains('tree-multiselect')) {
        if (node.classList.contains('section')) {
          let key = Util.getKey(node);
          Util.assert(key || key === 0);
          if (sectionsToNotHide.has(key)) {
            break;
          } else {
            sectionsToNotHide.add(key);
          }
        }
        node = node.parentElement as HTMLElement;
      }
    }

    // hide selections
    for (let id in this.astItems) {
      let astItem = this.astItems[id];
      astItem.addSearchHitMarker(shownNodeIdsSet.has(astItem.id as number));
    }
    for (let id in this.astSections) {
      let astSection = this.astSections[id];
      astSection.addSearchHitMarker(sectionsToNotHide.has(astSection.id as number));
    }
  }
}

// split word into three letter (or less) pieces
function splitWord (word: string): string[] {
  Util.assert(word);

  if (word.length < MAX_SAMPLE_SIZE) {
    return [word];
  }

  let chunks: string[] = [];
  for (let ii = 0; ii < word.length - MAX_SAMPLE_SIZE + 1; ++ii) {
    chunks.push(word.substring(ii, ii + MAX_SAMPLE_SIZE));
  }
  return chunks;
}
