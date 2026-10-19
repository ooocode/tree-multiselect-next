import jQuery from 'jquery';

// The plugin's event surface stays on jQuery delegation, unlike the rest of the
// internals which are plain DOM:
//   * jQuery 4 delivers a synthetic checkbox/radio click by dispatching a real
//     native click and then stopping its propagation at the target, so a native
//     delegated listener never sees $checkbox.click();
//   * .trigger("input")/mouseenter() never dispatch native events at all.
// Binding with jQuery delegation keeps both real user events and
// jQuery-triggered ones working, which the tests and existing users rely on.
export function onDelegated<T extends Element> (
  root: HTMLElement,
  eventType: string,
  selector: string,
  handler: (target: T, event: JQuery.TriggeredEvent) => void
): void {
  jQuery(root).on(eventType, selector, function (this: Element, event: JQuery.TriggeredEvent) {
    handler(this as T, event);
  });
}
