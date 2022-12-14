/**
 * 是否点击了非指定元素
 */
export function isClickAway(event: MouseEvent, elms: HTMLElement[]) {}

export function listen<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  $node: Window | Document | HTMLElement = document,
  once?: boolean
) {
  // @ts-ignore
  const wrapHandler = (...args) => {
    // @ts-ignore
    handler(...args);
    if (once) {
      $node.removeEventListener(eventName, wrapHandler);
    }
  };
  $node.addEventListener(eventName, wrapHandler);
  return () => {
    $node.removeEventListener(eventName, wrapHandler);
  };
}
