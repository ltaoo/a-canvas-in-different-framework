/**
 * @file 画布领域
 */
import { Directions, LineDirectionTypes } from "./constants";
import {
  CanvasThingShape,
  LineShape,
  MaterialContent,
  Position,
  RectShape,
  Size,
} from "./types/canvas";
import { CanvasThingTypes } from "./constants";
import {
  checkInSelectionRange,
  createEmptyRectShape,
  findNearbyLinesAtRect,
  getLinesFromRect,
  uuidFactory,
} from "./utils";
import { calcGroupClientFromRects } from "./utils/canvas";

import { applyMixins, Domain } from "./domains/base";
import TransformRect from "./domains/rect";
import TextDomain from "./domains/text";
import ImageDomain from "./domains/image";
import { HistoryManage, CanvasOperationType } from "./domains/history";

export * from "./types/canvas";
export * from "./types";

export * from "./constants";

type CanvasThingId = number;
const uuid = uuidFactory();

export class CanvasDomain extends Domain<{
  things: CanvasThingShape[];
  background?: string;
}> {
  /** 画布尺寸、位置信息 */
  client: null | {
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } = null;
  /** 光标位置 */
  cursor: Position = { x: 0, y: 0 };
  /**
   * z-index 最大值
   * @private
   */
  private maxIndex = -1;
  /** 画布上所有内容 */
  get things() {
    return this.values.things;
  }
  /** 当前选中的内容 id 列表 */
  curThingIds: CanvasThingId[] = [];
  /** 选中的内容 id 列表 */
  selectedThingIds: CanvasThingId[] = [];
  /** 画布上的辅助线 */
  lines: LineShape[] = [];
  /**
   * 是否正在框选
   * @private
   */
  private isRangeSelecting = false;
  /** 范围选择框 */
  rangeSelection: RectShape | null = null;
  /**
   * 是否正在拖动
   * @private
   */
  private isDraggingRect = false;
  /**
   * 正在拖动中的 rect
   * @private
   */
  private draggingRect: TransformRect | null = null;
  private isResizingRect = false;
  private isRotatingRect = false;
  private isPressing = false;
  /** 是否支持吸附 */
  enableAttach = true;
  /**
   * 刚调用完 addContent 创建的 content id，在 100 毫秒后会重置为 null
   * 该值是为了方便做链式调用
   * @private
   */
  private _thingIdJustAdded: null | CanvasThingId = null;
  /**
   * 开始框选时的鼠标位置
   * @private
   */
  private _rangeStartPosition: null | Position = null;
  /**
   * 开始拖动时的位置
   * @private
   */
  private _dragStartPos: null | Position = null;
  /** 操作历史管理 */
  history = new HistoryManage();
  /**
   * @todo 移除
   */
  elm: HTMLElement | null = null;

  constructor(
    options: CanvasDomain["values"] = {
      things: [],
      background: "",
    }
  ) {
    super(options);
    this.history.addListener((nextHistory) => {
      this.emitter.emit("history", nextHistory);
    });
  }
  /** @deprecated */
  saveCardElm(elm: HTMLElement) {
    this.elm = elm;
  }
  /**
   * 更新画布尺寸信息
   */
  setCanvasClient(client: CanvasDomain["client"]) {
    this.client = client;
  }
  /** 开启支持吸附其他内容 */
  enableAttachOtherRect() {
    this.enableAttach = true;
  }
  /** 关闭支持吸附其他内容 */
  disableAttachOtherRect() {
    this.enableAttach = false;
  }
  /** 开始拖动时的回调 */
  onRectStartDrag() {
    this._dragStartPos = {
      ...this.cursor,
    };
  }
  private getIndex() {
    // console.log("[DOMAIN]Canvas - getIndex", this.maxIndex);
    this.maxIndex += 1;
    return this.maxIndex;
  }
  /**
   * 向画布上添加物体
   */
  addThing(
    material: MaterialContent,
    moreOptions?: Partial<{
      client: Partial<RectShape>;
      id: number;
      skipHistory: boolean;
    }>
  ) {
    const { type, data } = material;
    const { client = {}, id: prevId, skipHistory = false } = moreOptions || {};
    let inner: null | unknown = null;
    if (type === CanvasThingTypes.Text) {
      const { placeholder, name = "微软雅黑", url } = data;
      inner = new TextDomain({
        value: placeholder,
        name,
        url,
      });
    }
    if (type === CanvasThingTypes.Image) {
      const { url } = data;
      inner = new ImageDomain({
        url,
      });
    }
    // console.log("[DOMAIN]Canvas - addContent", inner);
    if (inner === null) {
      console.warn(
        `[WARING]unknown type [${type}], please check arguments and try again.`
      );
      return this;
    }
    const id = prevId !== undefined ? prevId : uuid();
    const index = client?.index !== undefined ? client.index : this.getIndex();
    // console.log("[DOMAIN]Canvas - addContent index is", index, type);
    const wrap = new TransformRect(createEmptyRectShape({ ...client, index }), {
      onStartDrag: () => {
        this.draggingRect = wrap;
        this.onRectStartDrag();
        console.log("[DOMAIN]Canvas - start drag");
      },
      onDrag: (curRect, pos) => {
        this.isDraggingRect = true;
        const [nextRect, lines] = this.checkAttachLinesBeforeDrag(curRect);
        this.lines = lines;
        this.emitter.emit("updateLines", lines);
        const otherThings = this.findThingsByIds(
          this.selectedThingIds.filter((i) => i !== id)
        );
        if (otherThings.length !== 0) {
          // console.log("[DOMAIN]Canvas - onDrag", otherContents);
          for (let i = 0; i < otherThings.length; i += 1) {
            const c = otherThings[i];
            c.rect.setPosition({
              x: c.rect.client.left + pos.x,
              y: c.rect.client.top + pos.y,
            });
          }
        }
        // console.log("[DOMAIN]Canvas - onDrag", otherContents);
        if (lines.length !== 0 && this.enableAttach) {
          return nextRect;
        }
        return curRect;
      },
      onEndDrag: (result) => {
        console.log("[DOMAIN]canvas - onEndDrag", result.diff);
        this.draggingRect = null;
        this.emitter.emit("updateLines", []);
        this.history.push({
          type: CanvasOperationType.Drag,
          values: JSON.stringify({
            id,
            diff: result.diff,
          }),
        });
      },
      onResize: () => {
        this.isResizingRect = true;
      },
      onEndResize: (result) => {
        this.isResizingRect = false;
        this.history.push({
          type: CanvasOperationType.Resize,
          values: JSON.stringify({
            id,
            diff: result.diff,
          }),
        });
      },
      onRotate: () => {
        this.isRotatingRect = true;
      },
      onEndRotate: (result) => {
        this.isRotatingRect = false;
        this.history.push({
          type: CanvasOperationType.Rotate,
          values: JSON.stringify({
            id,
            diff: result.diff,
          }),
        });
      },
      onStartPress: () => {
        this.isPressing = true;
      },
      onEndPress: () => {
        this.isPressing = false;
      },
    });
    const thing = {
      id,
      type,
      data: inner,
      rect: wrap,
    } as CanvasThingShape;
    this._thingIdJustAdded = thing.id;
    setTimeout(() => {
      this._thingIdJustAdded = null;
    }, 100);
    // console.log("[DOMAIN]Canvas - addContent success", thing.id);
    this.appendContent(thing);
    if (skipHistory) {
      return this;
    }
    setTimeout(() => {
      // console.log(buildThingOperationPayload(thing));
      this.history.push({
        type: CanvasOperationType.AddThing,
        values: JSON.stringify(buildThingOperationPayload(thing)),
      });
    }, 0);
    return this;
  }
  /** 撤销操作 */
  undo() {
    const canceledOperation = this.history.undo();
    if (canceledOperation === null) {
      return;
    }
    // this.toValues(curValues.values);
    const { type, values } = canceledOperation;
    // console.log("[DOMAIN]Canvas - undo", canceledOperation.values);
    if (type === CanvasOperationType.AddThing) {
      const { id } = JSON.parse(values) as {
        id: number;
      };
      this.removeThing(id, { skipHistory: true });
      // setTimeout(() => {
      //   console.log("[DOMAIN]Canvas - undo add thing", this.selectedThingIds);
      // }, 1000);
    }
    if (type === CanvasOperationType.DelThing) {
      const deletedThings = JSON.parse(values) as {
        id: number;
        material: MaterialContent;
        client: RectShape;
      }[];
      for (let i = 0; i < deletedThings.length; i += 1) {
        const { id, material, client } = deletedThings[i];
        this.addThing(material, {
          id,
          client,
          skipHistory: true,
        });
      }
    }
    if (
      [
        CanvasOperationType.Drag,
        CanvasOperationType.Resize,
        CanvasOperationType.Rotate,
      ].includes(type)
    ) {
      const { id, diff } = JSON.parse(values) as {
        id: number;
        diff: RectShape;
      };
      const c = this.findThingById(id);
      if (c === null) {
        return;
      }
      const {
        rect: { client },
      } = c;
      if (type === CanvasOperationType.Drag) {
        const newPosition = {
          x: client.left - diff.left,
          y: client.top - diff.top,
        };
        // console.log("[DOMAIN]Canvas - undo position", newPosition);
        this.setPosition(newPosition, id);
      }
      if (type === CanvasOperationType.Resize) {
        const newWidthAndHeight = {
          width: client.width - diff.width,
          height: client.height - diff.height,
        };
        // console.log("[DOMAIN]Canvas - undo position", newPosition);
        this.setSize(newWidthAndHeight, id);
      }
      if (type === CanvasOperationType.Rotate) {
        const newAngle = client.angle - diff.angle;
        // console.log("[DOMAIN]Canvas - undo position", newPosition);
        this.setAngle(newAngle, id);
      }
    }
  }
  /** 重做操作 */
  redo() {
    const operation = this.history.redo();
    if (operation === null) {
      return;
    }
    // this.toValues(curValues.values);
    const { type, values } = operation;
    if (type === CanvasOperationType.AddThing) {
      const { id, material, client } = JSON.parse(values) as {
        id: number;
        material: MaterialContent;
        client: RectShape;
      };
      // console.log("[DOMAIN]Canvas - redo", operation.values);
      this.addThing(material, {
        id,
        client,
        skipHistory: true,
      });
      // setTimeout(() => {
      //   console.log("[DOMAIN]Canvas - redo add thing", id);
      // }, 1000);
    }
    if (type === CanvasOperationType.DelThing) {
      const ids = JSON.parse(values) as {
        id: number;
      }[];
      for (let i = 0; i < ids.length; i += 1) {
        const { id } = ids[i];
        this.removeThing(id, { skipHistory: true });
      }
    }
    // console.log("[DOMAIN]Canvas - redo position", type);
    if (
      [
        CanvasOperationType.Drag,
        CanvasOperationType.Resize,
        CanvasOperationType.Rotate,
      ].includes(type)
    ) {
      const { id, diff } = JSON.parse(values) as {
        id: number;
        diff: RectShape;
      };
      const c = this.findThingById(id);
      if (c === null) {
        return;
      }
      const {
        rect: { client },
      } = c;
      if (type === CanvasOperationType.Drag) {
        const newPosition = {
          x: client.left + diff.left,
          y: client.top + diff.top,
        };
        // console.log("[DOMAIN]Canvas - undo position", newPosition);
        this.setPosition(newPosition, id);
      }
      if (type === CanvasOperationType.Resize) {
        const newWidthAndHeight = {
          width: client.width + diff.width,
          height: client.height + diff.height,
        };
        console.log("[DOMAIN]Canvas - undo resize", client.width, diff.width);
        this.setSize(newWidthAndHeight, id);
      }
      if (type === CanvasOperationType.Rotate) {
        const newAngle = client.angle + diff.angle;
        // console.log("[DOMAIN]Canvas - undo position", newPosition);
        this.setAngle(newAngle, id);
      }
    }
  }
  /**
   * 更新指定内容
   */
  updateContent(nextContent: CanvasThingShape) {
    const { id } = nextContent;
    const index = this.values.things.findIndex((c) => c.id === id);
    if (index === -1) {
      return;
    }
    this.values.things = [
      ...this.values.things.slice(0, index),
      nextContent,
      ...this.values.things.slice(index + 1),
    ];
    this.emitValuesChange();
  }
  /**
   * 往画布上追加内容(所有添加内容的方法最终都要调用该方法)
   */
  appendContent(content: CanvasThingShape) {
    this.values.things = this.values.things.concat(content);
    this.emitValuesChange();
  }
  /** 设置指定内容尺寸 */
  setSize(size: Size, id?: CanvasThingId) {
    const content = this.findThingById(id);
    if (content === null) {
      return this;
    }
    const { id: contentId, rect } = content;
    rect.setSize(size);
    return this;
  }
  setPosition(pos: Position, id?: CanvasThingId) {
    const content = this.findThingById(id);
    if (content === null) {
      return this;
    }
    const { rect } = content;
    rect.setPosition(pos);
    return this;
  }
  setAngle(angle: number, id?: CanvasThingId) {
    const content = this.findThingById(id);
    if (content === null) {
      return this;
    }
    const { rect } = content;
    rect.setAngle(angle);
    return this;
  }
  /**
   * 设置指定内容 z-index
   */
  setIndex(index: number, id?: CanvasThingId) {
    const thing = this.findThingById(id);
    // console.log("[DOMAIN]Canvas - setIndex", id, index);
    if (thing === null) {
      return this;
    }
    const { rect } = thing;
    rect.setIndex(index);
    return this;
  }
  /**
   * 将当前选中的内容 z-index 设为最大值
   */
  topSelectedThings() {
    // console.log("[DOMAIN]Canvas - addSelectedContentIndex");
    if (this.selectedThingIds.length === 0) {
      return;
    }
    this.topThings(this.selectedThingIds);
  }
  /** 将指定内容置顶 */
  topThings(ids: CanvasThingId[]) {
    const matchedThings = this.findThingsByIds(ids);
    const otherThings = this.things.filter((c) => {
      return !ids.includes(c.id);
    });
    let otherContentsMaxIndex = 0;
    otherThings.forEach((content) => {
      otherContentsMaxIndex += 1;
      this.setIndex(otherContentsMaxIndex, content.id);
    });
    matchedThings.forEach((content) => {
      otherContentsMaxIndex += 1;
      this.setIndex(otherContentsMaxIndex, content.id);
    });
    this.emitValuesChange();
  }
  /**
   * 将当前选中的多个内容 z-index + n
   * @todo 优化无效操作，如已经处于最顶层，仍继续 +n
   */
  upSelectedThings(n = 1) {
    // console.log("[DOMAIN]Canvas - addSelectedContentIndex");
    if (this.selectedThingIds.length === 0) {
      return;
    }
    this.upThings(this.selectedThingIds);
  }
  upThings(ids: CanvasThingId[], n = 1) {
    const matchedContents = this.findThingsByIds(ids);
    // console.log("[COMPONENT]Canvas - upSelectedContents");
    let startIndex = 0;
    let endIndex = 0;
    if (matchedContents.length === 1) {
      const matchedContent = matchedContents[0];
      startIndex = matchedContent.rect.client.index;
      endIndex = matchedContent.rect.client.index;
      // 比如 0,1,2 要将 0 的层级 +1，那么就要将 0,1 重新排序
      // console.log("[COMPONENT]Canvas - upThing", matchedContent.data, startIndex, endIndex);
    } else {
      endIndex = Math.max.apply(
        matchedContents.map((c) => c.rect.client.index)
      );
      startIndex = Math.min.apply(
        matchedContents.map((c) => c.rect.client.index)
      );
    }
    const sortedContents = this.things.sort((a, b) => {
      return a.rect.client.index - b.rect.client.index;
    });
    // 比如 0,1,2,3,4,5,6，要将 2,4 层级 + 1，那么就要将 2,3,4,5 重新排序；层级 + 2，就要将 2,3,4,5,6 重新排序，所以是 endIndex + n + 1。+1 是因为左开右闭，要包含右边这个
    const middleThingsWithoutSelectedThings = sortedContents
      .slice(startIndex, endIndex + n + 1)
      .filter((c) => !ids.includes(c.id));
    // const prevContents = this.contents.slice(0, matchedContentsMinIndex);
    let index = startIndex;
    // const sortedMatchedContents = matchedContents.sort(
    //   (a, b) => a.rect.client.index - b.rect.client.index
    // );
    // console.log(
    //   "[COMPONENT]Canvas - upSelectedContents",
    //   middleContentsWithoutSelectedContents,
    //   sortedMatchedContents
    // );
    middleThingsWithoutSelectedThings.forEach((content) => {
      this.setIndex(index, content.id);
      index += 1;
    });
    matchedContents.forEach((content) => {
      this.setIndex(index, content.id);
      index += 1;
    });
    this.emitValuesChange();
  }
  /** 组合指定 rect */
  groupSelectedContents(ids: CanvasThingId[]) {
    // const matchedContents = this.findContentsByIds(ids);
    // const groupRect = calcGroupClientFromRects(matchedContents);
    // const rect = new TransformRect(groupRect, {
    //   onStartDrag: () => {
    //     this.draggingRect = rect;
    //   },
    //   onDrag: (curRect) => {
    //     this.isDraggingRect = true;
    //     const [nextRect, lines] = this.checkAttachLinesBeforeDrag(curRect);
    //     this.lines = lines;
    //     this.emitter.emit("updateLines", lines);
    //     if (lines.length !== 0 && this.enableAttach) {
    //       return nextRect;
    //     }
    //     return curRect;
    //   },
    //   onEndDrag: () => {
    //     this.draggingRect = null;
    //     console.log(this.values);
    //     this.emitter.emit("updateLines", []);
    //   },
    // });
    // const group = {
    //   id: uuid(),
    //   type: CanvasThingTypes.Group,
    //   rect,
    //   data: matchedContents,
    // } as CanvasThingShape;
    // console.log("[DOMAIN]Canvas - groupSelectedContents", groupRect);
    // this.appendContent(group);
    // this.selectContent(group.id);
  }
  /** 将指定组合分解为单独 rect */
  ungroupSelectedContents() {}
  /**
   * 移除指定内容
   * @param {number | CanvasThingShape} thing 要移除的物体对象或者 id
   * @param {object} options
   * @param {boolean} options.wait 是否不触发状态变更，目前用于同时移除多个时，不会调用多次，而是等待都移除后，发出一次状态变更事件
   * @param {boolean} options.skipHistory 是否跳过记录历史
   */
  removeThing(
    thing: CanvasThingShape | CanvasThingId,
    options: Partial<{
      wait: boolean;
      skipHistory: boolean;
    }> = {}
  ) {
    const { things } = this.values;
    const { wait, skipHistory } = options;
    let id = thing;
    if (typeof thing !== "number") {
      id = thing.id;
    }
    const removedThing = this.findThingById(id as CanvasThingId);
    if (!removedThing) {
      return;
    }
    const nextThings = things.filter(
      (content: CanvasThingShape) => content.id !== id
    );
    this.values.things = nextThings;
    if (wait) {
      return;
    }
    if (!skipHistory) {
      this.history.push({
        type: CanvasOperationType.DelThing,
        values: JSON.stringify(buildThingOperationPayload(removedThing)),
      });
    }
    this.emitValuesChange();
  }
  /**
   * 移除选中的内容
   */
  removeSelectedThings() {
    if (this.selectedThingIds.length === 0) {
      return;
    }
    const ids = [...this.selectedThingIds];
    console.log("[DOMAIN]Canvas - removeSelectedThings");
    this.history.push({
      type: CanvasOperationType.DelThing,
      values: JSON.stringify(
        ids
          .map((id) => {
            const thing = this.findThingById(id);
            return thing;
          })
          .map((thing) => {
            if (thing) {
              return buildThingOperationPayload(thing);
            }
            return null;
          })
          .filter(Boolean)
      ),
    });
    this.selectedThingIds.forEach((id) => {
      this.removeThing(id, {
        wait: true,
        skipHistory: true,
      });
    });
    this.emitValuesChange();
  }
  /**
   * 更新背景
   */
  updateBackground(background: string) {}
  /**
   * 选中画布上的单个内容
   */
  selectThing(id: CanvasThingId) {
    // console.log("[DOMAIN]Canvas - selectThing", id);
    if (this.selectedThingIds.length === 1 && this.selectedThingIds[0] === id) {
      return;
    }
    this.selectedThingIds = [id];
    this.emitter.emit("selectContent", this.selectedThingIds);
  }
  appendSelectThing(id: CanvasThingId) {
    // console.log("[DOMAIN]Canvas - append selected content", id);
    if (this.selectedThingIds.includes(id)) {
      return;
    }
    this.selectedThingIds = this.selectedThingIds.concat(id);
    this.emitter.emit("selectContent", this.selectedThingIds);
  }
  /**
   * 选中画布上的多个内容
   */
  selectThings(ids: CanvasThingId[]) {
    // console.log("[DOMAIN]Canvas - selectThings", this.selectedThingIds, ids);
    if (isSameAry(this.selectedThingIds, ids)) {
      return;
    }
    this.selectedThingIds = ids;
    this.emitter.emit("selectContent", this.selectedThingIds);
  }
  /**
   * 清除选中的所有内容
   */
  clearSelectedThings() {
    console.log("[DOMAIN]Canvas - clearSelectedContent", this.isPressing);
    if (this.isRangeSelecting) {
      return;
    }
    if (this.isPressing) {
      return;
    }
    if (this.selectedThingIds.length === 0) {
      return;
    }
    this.selectedThingIds = [];
    this.emitter.emit("selectContent", this.selectedThingIds);
  }
  clearAllThings() {
    this.values.things = [];
    this.emitValuesChange();
  }
  /** 在指定方向上根据 step 移动选中的内容 */
  moveThingsByStepInDirection(direction: Directions, step = 1) {
    if (this.selectedThingIds.length === 0) {
      return;
    }
    const contents = this.findThingsByIds(this.selectedThingIds);
    for (let i = 0; i < contents.length; i += 1) {
      const { rect } = contents[i];
      const { left, top } = rect.client;
      if (direction === Directions.Left) {
        rect.setPosition({
          x: left - step,
          y: top,
        });
      }
      if (direction === Directions.Top) {
        rect.setPosition({
          x: left,
          y: top - step,
        });
      }
      if (direction === Directions.Right) {
        rect.setPosition({
          x: left + step,
          y: top,
        });
      }
      if (direction === Directions.Bottom) {
        rect.setPosition({
          x: left,
          y: top + step,
        });
      }
    }
  }
  moveSelectedContentTogether(pos: Position, contents: CanvasThingShape[]) {
    // if (this._dragStartPos === null) {
    //   return this;
    // }
    // if (contents.length === 0) {
    //   return this;
    // }
    // console.log("[DOMAIN]Canvas - moveSelectedContentTogether", contents);
    // for (let i = 0; i < contents.length; i += 1) {
    //   const { rect } = contents[i];
    //   const deltaX = pos.x - this._dragStartPos.x;
    //   const deltaY = pos.y - this._dragStartPos.y;
    //   this._dragStartPos = {
    //     x: pos.x,
    //     y: pos.y,
    //   };
    //   rect.setPosition({
    //     x: rect.client.left + deltaX,
    //     y: rect.client.top + deltaY,
    //   });
    // }
  }
  /**
   * 移动指定内容到指定位置
   */
  moveThingTo(
    position: Partial<{ x: number; y: number }> = {},
    id?: CanvasThingId
  ) {
    const content = this.findThingById(id);
    if (content === null) {
      return this;
    }
    // console.log('[DOMAIN]Canvas - moveContentTo', rect.rect);
    const { x, y } = position;
    content.rect.setPosition({
      x: x !== undefined ? x : content.rect.client.left,
      y: y !== undefined ? y : content.rect.client.top,
    });
    return this;
  }

  /** 更新光标位置 */
  setCursorPosition(pos: Position) {
    this.cursor = pos;
  }
  /**
   * 开始框选
   */
  startRangeSelect(pos: Position) {
    console.log("[DOMAIN]Canvas - startRangeSelect", this.isPressing);
    if (this.isPressing) {
      return;
    }
    // console.log("[DOMAIN]Canvas - startRangeSelect", pos);
    this._rangeStartPosition = pos;
  }
  /**
   * 框选
   */
  rangeSelect(pos: Position) {
    const { x, y } = pos;
    if (this._rangeStartPosition === null) {
      return;
    }
    if (this.isPressing) {
      return;
    }
    // console.log("[DOMAIN]Canvas - rangeSelect", x, y);
    if (this.isRangeSelecting === false) {
      // @todo 可以判断下移动的距离，如果小于某个阈值，就不算
      this.isRangeSelecting = true;
    }
    if (this.client === null) {
      const errMsg =
        "[DOMAIN]Canvas - rangeSelect 请先调用 updateBoundingClientRect 更新画布尺寸、位置信息";
      console.warn(errMsg);
      return this;
    }
    const rectInfo = this.client;
    const parentRect = {
      left: rectInfo.left,
      top: rectInfo.top,
    };
    const startPos = this._rangeStartPosition;
    const payload = Object.assign(createEmptyRectShape(), {
      left: x > startPos.x ? startPos.x - parentRect.left : x - parentRect.left,
      top: y > startPos.y ? startPos.y - parentRect.top : y - parentRect.top,
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });
    this.rangeSelection = payload;
    this.emitter.emit("updateRangeSelection", payload);
    const { things } = this.values;
    const selectedThings = checkInSelectionRange(payload, things);
    // console.log("[DOMAIN]Canvas - rangeSelect", selectedContents);
    // @todo 其实这里也可以给外部决定哪些能「选中」
    this.selectThings(selectedThings.map((content) => content.id));
  }
  /**
   * 结束框选
   */
  endRangeSelect() {
    if (this.isRangeSelecting === false) {
      return;
    }
    // console.log("[DOMAIN]Canvas - endRangeSelect");
    this.isRangeSelecting = false;
    const emptyRect = createEmptyRectShape();
    this.rangeSelection = emptyRect;
    this.emitter.emit("updateRangeSelection", emptyRect);
  }
  /**
   * 检查是否有靠近可以吸附的线条
   */
  checkAttachLinesBeforeDrag(curRect: RectShape): [RectShape, LineShape[]] {
    const { things: contents } = this.values;
    const rectLines: LineShape[] = [];
    // const rectLines = contents
    //   .filter((content) => {
    //     if (content.rect !== rect) {
    //       return true;
    //     }
    //     return false;
    //   })
    //   .map((content) => content.rect.client)
    //   .map((rect) => {
    //     const lines = getLinesFromRect(rect);
    //     return lines;
    //   })
    //   .reduce((total, cur) => total.concat(cur), []);
    if (this.client === null) {
      return [curRect, []];
    }
    const { width, height } = this.client;
    // console.log("[COMPONENT]Canvas - canvas horizontal", width / 2);
    const [nextRect, lines] = findNearbyLinesAtRect(
      curRect,
      rectLines.concat([
        {
          type: LineDirectionTypes.Horizontal,
          // y: canvasInfoRef.current.top + height / 2,
          origin: 0,
          y: height / 2,
          length: width,
        },
        {
          type: LineDirectionTypes.Vertical,
          // x: canvasInfoRef.current.left + width / 2,
          origin: 0,
          x: width / 2,
          length: height,
        },
      ])
    );
    // console.log("[CORE]Canvas - checkAttachLinesBeforeDrag");
    return [nextRect, lines];
  }

  /** ---------------- content logic ------------------ */

  /** 设置物体内容 */
  setThingContent(
    content: Partial<{
      value: string;
      url: string;
    }>,
    id?: CanvasThingId
  ) {
    const thing = this.findThingById(id);
    if (thing === null) {
      return this;
    }
    const { type, data } = thing;
    if (type === CanvasThingTypes.Text) {
      data.setValue(content.value);
    }
    // this.values.things = [...this.values.things];
    // this.emitValuesChange();
    return this;
  }
  /** 获取指定物体 id 或上一次刚添加的内容 */
  getThingId(id?: CanvasThingId) {
    if (id !== undefined) {
      return id;
    }
    if (this._thingIdJustAdded !== null) {
      return this._thingIdJustAdded;
    }
    return null;
  }
  /** 根据指定 id 找到对应内容 */
  findThingById(id?: CanvasThingId) {
    const cid = this.getThingId(id);
    if (cid === null) {
      return null;
    }
    const content = this.values.things.find((c) => c.id === cid);
    if (content === undefined) {
      return null;
    }
    return content;
  }
  /** 根据指定 id 找到对应内容 */
  findThingsByIds(ids: CanvasThingId[]) {
    return this.things.filter((thing) => {
      if (ids.includes(thing.id)) {
        return true;
      }
      return false;
    });
  }

  plugins: Record<string, unknown> = {};
  registerPlugin(name: string, plugin: unknown) {
    this.plugins[name] = plugin;
  }

  /** 添加选中内容时的监听 */
  addSelectedListener(listener: (ids: number[]) => void) {
    // @ts-ignore
    this.emitter.on("selectContent", (selectedContentIds: number[]) => {
      listener(selectedContentIds);
    });
  }
  /** 添加引导线改变时的回调 */
  addLinesListener(listener: (lines: LineShape[]) => void) {
    // @ts-ignore
    this.emitter.on("updateLines", (lines: LineShape[]) => {
      listener(lines);
    });
  }
  addRangeSelectionListener(listener: (rangeSelection: RectShape) => void) {
    // @ts-ignore
    this.emitter.on("updateRangeSelection", (rangeSelection: RectShape) => {
      listener(rangeSelection);
    });
  }
  addHistoryListener(listener: (history: HistoryManage["values"]) => void) {
    // @ts-ignore
    this.emitter.on("history", (nextHistory: HistoryManage["values"]) => {
      listener(nextHistory);
    });
  }
  toJSON() {
    const { background, things } = this.values;
    return JSON.stringify({
      background,
      contents: things.map((content) => {
        const { id, type, data, rect } = content;
        return {
          id,
          type,
          data: data.toJSON(),
          rect: rect.toJSON(),
        };
      }),
    });
  }
  emitValuesChange() {
    if (this.values === undefined) {
      return;
    }
    for (let i = 0; i < this.listeners.length; i += 1) {
      const listener = this.listeners[i];
      listener({ ...this.values });
    }
  }
  get [Symbol.toStringTag]() {
    return "Canvas";
  }
}

function buildThingOperationPayload(thing: CanvasThingShape) {
  const { id, type, data, rect } = thing;
  return {
    id,
    material: (() => {
      if (type === CanvasThingTypes.Text) {
        return {
          type: CanvasThingTypes.Text,
          data: {
            placeholder: data.values.value,
            name: data.values.name,
            url: data.values.url,
          },
        };
      }
      if (type === CanvasThingTypes.Image) {
        return {
          type: CanvasThingTypes.Image,
          data: {
            url: data.values.url,
          },
        };
      }
    })(),
    client: rect.client,
  };
}

function isSameAry(arr1: number[], arr2: number[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  const sort1 = arr1.sort();
  const sort2 = arr2.sort();
  let sameValueCount = 0;
  for (let i = 0; i < arr1.length; i += 1) {
    const v1 = sort1[i];
    const v2 = sort2[i];
    if (v1 === v2) {
      sameValueCount += 1;
    }
  }
  if (sameValueCount === arr1.length) {
    return true;
  }
  return false;
}
