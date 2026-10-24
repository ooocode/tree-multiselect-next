// One delegated listener per event type keeps the event wiring in a single
// place. Selectors are matched with Element.closest(), and the event only
// reaches the handler when the match lives inside the root.
export function onDelegated<T extends Element> (
  root: HTMLElement,
  eventType: string,
  selector: string,
  handler: (target: T, event: Event) => void
): void {
  root.addEventListener(eventType, (event) => {
    let eventTarget = event.target;
    if (!(eventTarget instanceof Element)) {
      return;
    }

    let match = eventTarget.closest(selector);
    if (match && root.contains(match)) {
      handler(match as T, event);
    }
  });
}
