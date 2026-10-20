import type { TreeMultiselectHandle, TreeMultiselectOptions } from './tree-multiselect/types.js';

// jQuery and every plugin module need a DOM. Loading them conditionally keeps
// `import 'tree-multiselect-next'` safe in SSR (Next.js prerendering, Remix,
// etc.), where there is no `document`. The top-level await guarantees that
// `$.fn.treeMultiselect` is registered before the importing module continues.
if (typeof document !== 'undefined') {
  const [{ default: jQuery }, { default: treeMultiselect }] = await Promise.all([
    import('jquery'),
    import('./tree-multiselect/main.js')
  ]);

  jQuery.fn.treeMultiselect = treeMultiselect;
}

declare global {
  interface JQuery {
    treeMultiselect (options?: TreeMultiselectOptions): JQuery<TreeMultiselectHandle>;
  }
}

export type { TreeMultiselectOptions, TreeMultiselectItem, TreeMultiselectHandle } from './tree-multiselect/types.js';
