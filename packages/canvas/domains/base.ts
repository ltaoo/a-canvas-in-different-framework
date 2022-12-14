/**
 * 注册的监听器
 * @todo
 * 1、支持在 emitValuesChange 前做一些事情，比如衍生一些状态值
 */
import mitt from "mitt";

export type Listener<T> = (values: T) => void;

export class Domain<T> {
  values: T;
  emitter: ReturnType<typeof mitt>;
  /**
   * 监听列表
   */
  listeners: Listener<T>[] = [];
  /**
   * 错误监听列表
   */
  errorListeners: ((error: unknown) => void)[] = [];

  constructor(values: T) {
    this.values = values;
    this.emitter = mitt();
  }

  /**
   * 注册数据变更监听
   */
  addListener(listener: Listener<T>) {
    // console.log('[]WechatAd - addListener', listener);
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }
  /**
   * 注册错误监听
   */
  addErrorListener(listener: (error: unknown) => void) {
    // console.log('[]WechatAd - addErrorListener', listener);
    if (!this.errorListeners.includes(listener)) {
      this.errorListeners.push(listener);
    }
  }
  /**
   * 广播变更
   */
  emitValuesChange() {
    // console.log("[CORE]emitValuesChange", this.values);
    if (this.values === undefined) {
      return;
    }
    for (let i = 0; i < this.listeners.length; i += 1) {
      const listener = this.listeners[i];
      listener({ ...this.values });
    }
  }
  /**
   * 广播错误
   */
  emitError(error: unknown) {
    for (let i = 0; i < this.errorListeners.length; i += 1) {
      const listener = this.errorListeners[i];
      listener(error);
    }
  }

  get [Symbol.toStringTag]() {
    return "Domain";
  }
}

// This can live anywhere in your codebase:
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}
