import jQuery from 'jquery';

// jQuery UI's sortable widget is itself a jQuery plugin, so the widget
// integration lives behind this one function.
export function makeSelectedPanelSortable (
  selectedContainer: HTMLElement,
  onReorder: (startIndex: number, endIndex: number) => void
): void {
  let startIndex: number | null = null;
  let endIndex: number | null = null;

  jQuery(selectedContainer).sortable({
    start: function (event, ui) {
      startIndex = indexOfElement(ui.item[0]);
    },

    stop: function (event, ui) {
      endIndex = indexOfElement(ui.item[0]);
      if (startIndex === endIndex) {
        return;
      }
      onReorder(startIndex as number, endIndex as number);
    }
  });
}

// same as jQuery's .index(): position among the parent's element children
function indexOfElement (element: HTMLElement): number {
  let parentNode = element.parentElement;
  return parentNode ? Array.prototype.indexOf.call(parentNode.children, element) : -1;
}
