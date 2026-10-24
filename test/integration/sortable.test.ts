import './common.js';

import { firePointer, midY } from './pointer-events.js';
import { makeSelectedPanelSortable } from '../../src/tree-multiselect/sortable.js';

interface Panel {
  container: HTMLDivElement;
  items: HTMLDivElement[];
}

function createItem (container: HTMLElement, value: string): HTMLDivElement {
  let item = document.createElement('div');
  item.className = 'item';
  item.setAttribute('data-value', value);
  item.textContent = value;
  item.style.boxSizing = 'border-box';
  item.style.height = '20px';
  item.style.lineHeight = '20px';
  item.style.overflow = 'hidden';
  container.appendChild(item);
  return item;
}

function createPanel (count: number): Panel {
  let fixture = document.getElementById('fixture') as HTMLElement;
  let container = document.createElement('div');
  container.className = 'selected';
  container.style.width = '200px';
  fixture.appendChild(container);

  let items: HTMLDivElement[] = [];
  for (let ii = 0; ii < count; ++ii) {
    items.push(createItem(container, String.fromCharCode(65 + ii)));
  }
  return { container, items };
}

function orderOf (container: Element): string[] {
  return Array.from(container.children).map((child) => child.getAttribute('data-value') as string);
}

function nextFrame (): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('selected panel sortable', () => {
  it('moves an item downward and reports its start and end index', () => {
    let { container, items } = createPanel(3);
    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    firePointer('pointerdown', items[0], midY(items[0]));
    let targetY = items[2].getBoundingClientRect().bottom - 1;
    firePointer('pointermove', document, targetY);
    firePointer('pointerup', document, targetY);

    assert.deepEqual(calls, [[0, 2]]);
    assert.deepEqual(orderOf(container), ['B', 'C', 'A']);
  });

  it('moves an item upward and reports its start and end index', () => {
    let { container, items } = createPanel(3);
    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    firePointer('pointerdown', items[2], midY(items[2]));
    let targetY = items[0].getBoundingClientRect().top + 1;
    firePointer('pointermove', document, targetY);
    firePointer('pointerup', document, targetY);

    assert.deepEqual(calls, [[2, 0]]);
    assert.deepEqual(orderOf(container), ['C', 'A', 'B']);
  });

  it('does not report a reorder when the pointer does not move past the threshold', () => {
    let { container, items } = createPanel(3);
    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    let y = midY(items[0]);
    firePointer('pointerdown', items[0], y);
    firePointer('pointermove', document, y + 1);
    firePointer('pointerup', document, y + 1);

    assert.deepEqual(calls, []);
    assert.deepEqual(orderOf(container), ['A', 'B', 'C']);
  });

  it('does not start dragging from the remove button', () => {
    let { container, items } = createPanel(3);
    let removeButton = document.createElement('span');
    removeButton.className = 'remove-selected';
    items[0].insertBefore(removeButton, items[0].firstChild);

    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    firePointer('pointerdown', removeButton, midY(items[0]));
    let targetY = items[2].getBoundingClientRect().bottom - 1;
    firePointer('pointermove', document, targetY);
    firePointer('pointerup', document, targetY);

    assert.deepEqual(calls, []);
    assert.deepEqual(orderOf(container), ['A', 'B', 'C']);
  });

  it('does not report a reorder when the item ends where it started', () => {
    let { container, items } = createPanel(3);
    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    let topY = items[0].getBoundingClientRect().top + 1;
    let bottomY = items[2].getBoundingClientRect().bottom - 1;
    firePointer('pointerdown', items[0], midY(items[0]));
    firePointer('pointermove', document, bottomY);
    firePointer('pointermove', document, topY);
    firePointer('pointerup', document, topY);

    assert.deepEqual(calls, []);
    assert.deepEqual(orderOf(container), ['A', 'B', 'C']);
  });

  it('restores the original order when the drag is cancelled', () => {
    let { container, items } = createPanel(3);
    let calls: Array<[number, number]> = [];
    makeSelectedPanelSortable(container, (startIndex, endIndex) => {
      calls.push([startIndex, endIndex]);
    });

    firePointer('pointerdown', items[0], midY(items[0]));
    firePointer('pointermove', document, items[2].getBoundingClientRect().bottom - 1);
    firePointer('pointercancel', document, items[2].getBoundingClientRect().bottom - 1);

    assert.deepEqual(calls, []);
    assert.deepEqual(orderOf(container), ['A', 'B', 'C']);
  });

  it('keeps the dragged item under the pointer', () => {
    let { container, items } = createPanel(3);
    makeSelectedPanelSortable(container, () => {});

    let startTop = items[0].getBoundingClientRect().top;
    let startY = midY(items[0]);
    firePointer('pointerdown', items[0], startY);
    firePointer('pointermove', document, startY + 15);

    assert.closeTo(items[0].getBoundingClientRect().top, startTop + 15, 1);

    firePointer('pointerup', document, startY + 15);
  });

  it('animates the items that make way when the dragged item changes slots', () => {
    let { container, items } = createPanel(3);
    makeSelectedPanelSortable(container, () => {});

    firePointer('pointerdown', items[0], midY(items[0]));
    let targetY = items[2].getBoundingClientRect().bottom - 1;
    firePointer('pointermove', document, targetY);

    assert.isAbove(items[1].getAnimations().length, 0);
    assert.isAbove(items[2].getAnimations().length, 0);

    firePointer('pointerup', document, targetY);
  });

  it('does not animate when the pointer stays in the current slot', () => {
    let { container, items } = createPanel(3);
    makeSelectedPanelSortable(container, () => {});

    let startY = midY(items[0]);
    firePointer('pointerdown', items[0], startY);
    // Past the drag threshold, but still above the next item's midpoint.
    firePointer('pointermove', document, startY + 10);

    assert.equal(items[1].getAnimations().length, 0);
    assert.equal(items[2].getAnimations().length, 0);

    firePointer('pointerup', document, startY + 10);
  });

  it('skips the reorder animation when reduced motion is preferred', () => {
    let originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query
    })) as unknown as typeof window.matchMedia;

    try {
      let { container, items } = createPanel(3);
      makeSelectedPanelSortable(container, () => {});

      firePointer('pointerdown', items[0], midY(items[0]));
      let targetY = items[2].getBoundingClientRect().bottom - 1;
      firePointer('pointermove', document, targetY);

      assert.equal(items[1].getAnimations().length, 0);
      assert.equal(items[2].getAnimations().length, 0);

      firePointer('pointerup', document, targetY);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('scrolls the panel while dragging near its bottom edge', async () => {
    let { container, items } = createPanel(10);
    container.style.height = '60px';
    container.style.overflow = 'auto';

    makeSelectedPanelSortable(container, () => {});

    firePointer('pointerdown', items[0], midY(items[0]));
    let rect = container.getBoundingClientRect();
    let targetY = rect.bottom - 2;
    firePointer('pointermove', document, targetY);

    assert.equal(container.scrollTop, 0);
    await nextFrame();
    await nextFrame();
    await nextFrame();
    assert.isAbove(container.scrollTop, 0);

    firePointer('pointerup', document, targetY);
  });
});
