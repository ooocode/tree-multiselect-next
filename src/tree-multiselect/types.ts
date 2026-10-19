export type TreeMultiselectSearchParam = 'value' | 'text' | 'description' | 'section';

export interface TreeMultiselectItem {
  text: string;
  value: string;
  initialIndex: number | null;
  section: string | null;
}

export interface TreeMultiselectHandle {
  reload (): void;
  remove (): void;
}

export interface TreeMultiselectOptions {
  allowBatchSelection?: boolean;
  collapsible?: boolean;
  enableSelectAll?: boolean;
  selectAllText?: string;
  unselectAllText?: string;
  freeze?: boolean;
  hideSidePanel?: boolean;
  maxSelections?: number;
  onChange?: ((allSelectedItems: TreeMultiselectItem[], addedItems: TreeMultiselectItem[], removedItems: TreeMultiselectItem[]) => void) | null;
  onlyBatchSelection?: boolean;
  searchable?: boolean;
  searchParams?: TreeMultiselectSearchParam[];
  sectionDelimiter?: string;
  showSectionOnSelected?: boolean;
  sortable?: boolean;
  startCollapsed?: boolean;
}

export type ResolvedTreeMultiselectOptions = Required<TreeMultiselectOptions>;
