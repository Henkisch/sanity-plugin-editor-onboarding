/**
 * jsdom has no ResizeObserver, and the plugin uses one to keep the spotlight on
 * a target that changes size. A stub is enough: the tests here assert on target
 * resolution, not on live re-measurement, which only a real browser can show.
 */
class StubResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= StubResizeObserver

/**
 * jsdom has no `matchMedia`, and both the popover and the scroll-into-view
 * effect ask it whether the user prefers reduced motion. Answering "no" is
 * right for a test: the reduced-motion paths only swap a smooth scroll for an
 * instant one and drop a transition, neither of which these tests assert on.
 */
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia

/**
 * jsdom implements no scrolling at all, so `scrollIntoView` is absent rather
 * than inert. The provider calls it on every target it resolves; without this
 * the call throws, `TourErrorBoundary` catches it, and the tour tears itself
 * down mid-test — which reads as a missing element, not as a crash.
 */
Element.prototype.scrollIntoView ??= function scrollIntoView(): void {}
