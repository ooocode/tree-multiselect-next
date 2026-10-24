import { treeMultiselect } from 'tree-multiselect-next';

import type { TreeMultiselectHandle, TreeMultiselectOptions } from 'tree-multiselect-next';

const options: TreeMultiselectOptions = {
  searchable: true,
  maxSelections: 3,
  onChange: (all, added, removed) => {
    const first: string = all[0].text;
    const section: string | null = removed[0].section;
    void first;
    void section;
    void added;
  }
};

const handles: TreeMultiselectHandle[] = treeMultiselect(
  document.querySelectorAll<HTMLSelectElement>('select'),
  options
);

const single: TreeMultiselectHandle[] = treeMultiselect(document.createElement('select'));

single[0].reload();
handles[0].remove();
