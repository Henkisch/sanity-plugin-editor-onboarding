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
