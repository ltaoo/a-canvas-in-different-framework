/**
 * @file 可拖动、缩放、旋转的盒子领域
 */

import { Position, RectShape, Size } from "../types/canvas";
import {
  createEmptyRectShape,
  degToRadian,
  getAngle,
  getNewStyle,
  uuidFactory,
} from "../utils";

import { Domain } from "./base";

const uuid = uuidFactory();

export default class TransformRect extends Domain<RectShape> {
  id: number;
  /** 是否按下状态 */
  isPressing = false;
  /** 是否正在拖动 */
  isDragging = false;
  /** 是否正在缩放 */
  isResizing = false;
  /** 是否正在旋转 */
  isRotating = false;
  /** 是否锁定 */
  locking = false;
  node: null | HTMLElement = null;
  /** 容器尺寸、位置信息 */
  client: RectShape = createEmptyRectShape();
  /** 开始变换前的位置(用于计算变换的差异值，移动了多少、旋转了多少等) */
  tmpClient: RectShape = createEmptyRectShape();
  /** 临时容器 */
  tmpRect: null | TransformRect["client"] = null;
  /** 变形的额外参数 */
  options: Partial<{
    /** 缩放比例 */
    ratio: number;
    /** 最小宽度 */
    minWidth: number;
    /** 最小高度 */
    minHeight: number;
    /** 开始拖动时的回调 */
    onStartDrag?: (ins: TransformRect) => void;
    /**
     * 拖动时的回调，返回值会作为真正要移动的位置
     */
    onDrag?: (rect: RectShape, pos: Position) => RectShape;
    /**
     * 结束拖动时的回调
     * @param {object} result
     * @param {object} result.diff 从拖动开始到结束，变换的差异值
     */
    onEndDrag?: (result: { diff: RectShape }) => void;
    onStartResize?: () => void;
    onResize?: () => void;
    onEndResize?: (result: { diff: RectShape }) => void;
    onStartRotate?: () => void;
    onRotate?: () => void;
    onEndRotate?: (result: { diff: RectShape }) => void;
    onStartPress?: () => void;
    onEndPress?: () => void;
  }>;
  /** 矩形左上角水平方向初始值 */
  initialX = 0;
  /** 矩形左上角垂直方向初始值 */
  initialY = 0;
  /** 缩放方向 */
  resizeType?: string;
  /** 是否等比缩放 */
  resizeIsShift = false;
  /** 旋转起始向量 */
  rotateStartVector = {
    x: 0,
    y: 0,
  };
  /** 旋转中心点 */
  rotateCenter = {
    x: 0,
    y: 0,
  };

  private invokedDragStart = false;

  constructor(
    rect: TransformRect["client"],
    options: TransformRect["options"] = {}
  ) {
    super(rect);
    this.id = uuid();
    this.client = rect;
    this.options = options;
  }
  /** 绑定一个平台节点 */
  bindNode(node: HTMLDivElement) {
    this.node = node;
  }
  /** 开始拖动 */
  startDrag(pos: Position) {
    const { onStartPress } = this.options;
    if (onStartPress) {
      onStartPress();
    }
    if (this.locking) {
      return this.client;
    }
    this.tmpClient = { ...this.client };
    // console.log("[DOMAIN]RectAnimationStore - start drag", this.tmpClient.left);
    const { x, y } = pos;
    this.isPressing = true;
    this.initialX = x;
    this.initialY = y;
    this.invokedDragStart = false;
  }
  /** 拖动 */
  drag(
    pos: Position & {
      /** 可拖动的角度 */
      enabledAngle?: number;
    }
  ) {
    // console.log("[DOMAIN]TransformRect - drag");
    if (this.locking) {
      return this.client;
    }
    const { onStartDrag } = this.options;
    if (!this.invokedDragStart && onStartDrag) {
      this.invokedDragStart = true;
      onStartDrag(this);
    }
    this.isDragging = true;
    const { x, y, enabledAngle } = pos;
    const deltaX = x - this.initialX;
    const deltaY = y - this.initialY;
    // console.log("[DOMAIN]RectAnimationStore - drag", this.rect.left);
    const { width, height, left, top, angle } = this.client;
    const targetRect = this.completeRect({
      width,
      height,
      left:
        left +
        (() => {
          // @todo 支持锁定某个角度拖动
          if (enabledAngle === undefined) {
            return deltaX;
          }
          return 0;
        })(),
      top: top + deltaY,
      angle,
    });
    this.setPosition({
      x: targetRect.left,
      y: targetRect.top,
      wait: true,
    });
    this.initialX = x;
    this.initialY = y;
    const { onDrag } = this.options;
    if (onDrag) {
      const updatedRect = onDrag(targetRect, {
        x: deltaX,
        y: deltaY,
      });
      // console.log("[DOMAIN]TransformRect - drop");
      this.setPositionButNotUpdateClient({
        x: updatedRect.left,
        y: updatedRect.top,
      });
      return updatedRect;
    }
    this.setPosition({
      x: targetRect.left,
      y: targetRect.top,
    });
    // console.log("[DOMAIN]RectAnimationStore - drop", this.rect);
    return targetRect;
  }
  /** 结束拖动 */
  endDrag() {
    const { onEndDrag, onEndPress } = this.options;
    this.isPressing = false;
    if (onEndPress) {
      onEndPress();
    }
    this.initialX = 0;
    this.initialY = 0;
    this.client = { ...this.values };
    // console.log("[DOMAIN]TransformRect - end drag prepare compare");
    const diff = this.compare(this.client, this.tmpClient);
    this.tmpRect = { ...this.client };
    if (this.isDragging === false) {
      return;
    }
    this.isDragging = false;
    if (onEndDrag) {
      onEndDrag({
        diff,
      });
    }
  }
  startResize(options: {
    x: number;
    y: number;
    type: string;
    isShift: boolean;
  }) {
    const { onStartPress } = this.options;
    if (onStartPress) {
      onStartPress();
    }
    //     console.log("[DOMAIN]RectAnimation - start resize", this.rect);
    const { x, y, type, isShift } = options;
    this.isPressing = true;
    this.tmpClient = { ...this.client };
    this.initialX = x;
    this.initialY = y;
    this.resizeType = type;
    this.resizeIsShift = isShift;
  }
  resize(options: { x: number; y: number; isShift: boolean }) {
    //     console.log("[DOMAIN]RectAnimation - resize");
    if (!this.isPressing) {
      return this.client;
    }
    if (this.resizeType === undefined) {
      return this.client;
    }
    this.isResizing = true;
    const { x, y, isShift } = options;
    this.resizeIsShift = isShift;
    /** 水平方向上移动的距离 */
    const deltaX = x - this.initialX;
    // console.log("[]deltaX", deltaX);
    /** 垂直方向上移动的距离 */
    const deltaY = y - this.initialY;
    /** 角度值？https://www.jianshu.com/p/9817e267925a */
    const alpha = Math.atan2(deltaY, deltaX);
    /** 直角三角形中，a2 + b2 = c2，由于移动的鼠标点总可以和原点画直角三角形，所以 deltaL 就是鼠标距离原点的距离 */
    const deltaL = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const length = deltaL;
    // @todo
    const parentRotateAngle = 0;
    const beta = alpha - degToRadian(this.client.angle + parentRotateAngle);
    // console.log("[]beta", beta, degToRadian(rotateAngle + parentRotateAngle));
    // length 是三角形斜边，乘以 Math.cos(beta) 就能知道在水平方向上移动的距离
    const deltaW = length * Math.cos(beta);
    // console.log("deltaW", deltaW);
    // 同理，deltaH 就是在垂直方向上移动的距离
    const deltaH = length * Math.sin(beta);
    const ratio =
      this.resizeIsShift && !this.options.ratio
        ? this.client.width / this.client.height
        : this.options.ratio;
    //     console.log("[DOMAIN]RectAnimation - result", this.rect);
    const { position, size } = getNewStyle(
      this.resizeType,
      {
        width: this.client.width,
        height: this.client.height,
        angle: this.client.angle,
        centerX: this.client.left + this.client.width / 2,
        centerY: this.client.top + this.client.height / 2,
      },
      deltaW,
      deltaH,
      ratio,
      this.options.minWidth,
      this.options.minHeight
    );
    // console.log("[DOMAIN]RectAnimation - result", position, size);
    const result = {
      top: position.centerY - size.height / 2,
      left: position.centerX - size.width / 2,
      width: size.width,
      height: size.height,
      angle: this.client.angle,
      index: this.client.index,
    };
    // console.log("[DOMAIN]RectAnimation - result", result);
    this.tmpRect = this.completeRect({ ...result });
    this.values = { ...this.tmpRect };
    this.emitValuesChange();
    return result as TransformRect["client"];
  }
  endResize() {
    const { onEndResize, onEndPress } = this.options;
    this.isPressing = false;
    if (onEndPress) {
      onEndPress();
    }
    this.initialX = 0;
    this.initialY = 0;
    const result = this.tmpRect;
    if (result === null) {
      return;
    }
    this.client = this.completeRect({ ...result });
    this.values = { ...this.client };
    this.emitValuesChange();
    if (this.isResizing === false) {
      return;
    }
    const diff = this.compare(this.client, this.tmpClient);
    this.tmpClient = { ...this.client };
    if (onEndResize) {
      onEndResize({ diff });
    }
  }
  startRotate(options: {
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
  }) {
    const { onStartPress } = this.options;
    if (onStartPress) {
      onStartPress();
    }
    const { x, y, left, top, width, height } = options;
    const center = {
      x: left + width / 2,
      y: top + height / 2,
    };
    const startVector = {
      x: x - center.x,
      y: y - center.y,
    };
    this.rotateStartVector = startVector;
    this.rotateCenter = center;
    this.isPressing = true;
  }
  rotate(options: { x: number; y: number }) {
    if (!this.isPressing) {
      return this.client;
    }
    this.isRotating = true;
    const { x, y } = options;
    const center = this.rotateCenter;
    const rotateVector = {
      x: x - center.x,
      y: y - center.y,
    };
    const relativeAngle = getAngle(this.rotateStartVector, rotateVector);
    const startAngle = this.client.angle;
    let rotateAngle = Math.round(relativeAngle + startAngle);
    if (rotateAngle >= 360) {
      rotateAngle -= 360;
    } else if (rotateAngle < 0) {
      rotateAngle += 360;
    }
    if (rotateAngle > 356 || rotateAngle < 4) {
      rotateAngle = 0;
    } else if (rotateAngle > 86 && rotateAngle < 94) {
      rotateAngle = 90;
    } else if (rotateAngle > 176 && rotateAngle < 184) {
      rotateAngle = 180;
    } else if (rotateAngle > 266 && rotateAngle < 274) {
      rotateAngle = 270;
    }
    this.tmpRect = this.completeRect({
      ...this.client,
      angle: rotateAngle,
    });
    this.values = { ...this.tmpRect };
    this.emitValuesChange();
    return this.tmpRect;
  }
  endRotate() {
    const { onEndRotate, onEndPress } = this.options;
    this.isPressing = false;
    if (onEndPress) {
      onEndPress();
    }
    this.initialX = 0;
    this.initialY = 0;
    if (this.tmpRect === null) {
      return;
    }
    this.client = this.completeRect({ ...this.tmpRect });
    this.values = { ...this.client };
    this.emitValuesChange();
    if (this.isRotating === false) {
      return;
    }
    const diff = this.compare(this.client, this.tmpClient);
    this.tmpClient = { ...this.client };
    if (onEndRotate) {
      onEndRotate({
        diff,
      });
    }
  }

  /**
   * 改变 rect 宽高
   */
  setSize(size: Size) {
    const { width, height } = size;
    this.client = this.completeRect({
      ...this.client,
      width,
      height,
    });
    this.values = { ...this.client };
    this.emitValuesChange();
  }
  /**
   * 改变 rect 位置
   * @param {Position} pos - 移动到指定的位置
   * @param {boolean} pos.wait - 是否不执行 emitValuesChange，等待其他地方
   */
  setPosition(
    pos: Position & {
      wait?: boolean;
    }
  ) {
    const { x, y, wait = false } = pos;
    this.client = this.completeRect({
      ...this.client,
      left: x,
      top: y,
    });
    if (wait) {
      return;
    }
    this.values = { ...this.client };
    this.emitValuesChange();
  }
  /**
   * 设置位置，但是不改变 client 信息
   * 如果改变了 client 信息，会导致一直吸附参考线
   * 所以在这里，其实出现了两个 rect，一个暴露给外部渲染的，位置是虚假的（吸附了参考线），另一个是根据鼠标位置移动的真实的（只有位置信息并不保留给外部）
   */
  setPositionButNotUpdateClient(pos: Position) {
    this.values = { ...this.client, left: pos.x, top: pos.y };
    this.emitValuesChange();
  }
  /**
   * 改变旋转的角度
   */
  setAngle(angle: number) {
    this.client = this.completeRect({
      ...this.client,
      angle,
    });
    this.values = { ...this.client };
    this.emitValuesChange();
  }
  setIndex(index: number) {
    this.client = this.completeRect({
      ...this.client,
      index,
    });
    this.values = { ...this.client };
    this.emitValuesChange();
  }

  /**
   * 补全 rect
   * 其实只要 left、top、width、height 和 angle，其他值都是根据这四个值推断出来的，属于「派生值」
   */
  completeRect(partialRect: Partial<TransformRect["client"]>): RectShape {
    const {
      left = 0,
      top = 0,
      width = 0,
      height = 0,
      angle = 0,
      index = 0,
    } = partialRect;
    return Object.assign(
      createEmptyRectShape(),
      { ...this.client },
      {
        left,
        right: left + width,
        top,
        bottom: top + height,
        center: {
          x: left + width / 2,
          y: top + height / 2,
        },
        width,
        height,
        angle,
        index,
      }
    );
  }

  /** 锁定，禁用移动、放大等所有转换操作 */
  lock() {
    this.locking = true;
  }
  /** 锁定，禁用移动、放大等所有转换操作 */
  releaseLock() {
    this.locking = false;
  }

  toJSON() {
    const { left, top, width, height, angle } = this.values;
    return {
      left,
      top,
      width,
      height,
      angle,
    };
  }
  /** 比较两个 rect 形变的差异 */
  compare(curClient: RectShape, prevClient: RectShape) {
    const { left, top, width, height, angle } = curClient;
    const {
      left: prevLeft,
      top: prevTop,
      width: prevWidth,
      height: prevHeight,
      angle: prevAngle,
    } = prevClient;
    return this.completeRect({
      left: left - prevLeft,
      top: top - prevTop,
      width: width - prevWidth,
      height: height - prevHeight,
      angle: angle - prevAngle,
    });
  }

  static toValues(content: {
    left: number;
    top: number;
    width: number;
    height: number;
    angle: number;
  }) {
    const { left, top, width, height, angle } = content;
    return {
      left,
      top,
      width,
      height,
      angle,
    };
  }

  get [Symbol.toStringTag]() {
    return "TransformRect";
  }
}
