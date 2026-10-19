import jQuery from 'jquery';
import 'tree-multiselect-next';

const trees = jQuery('select').treeMultiselect({
  searchable: true,
  maxSelections: 3,
  onChange: (all, added, removed) => {
    const first: string = all[0].text;
    const section: string | null = removed[0].section;
    void first;
    void section;
    void added;
  }
});

const handle = trees[0];
handle.reload();
handle.remove();
