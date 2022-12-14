/**
 * @file undo redo 实现
 */

import { Domain } from "./base";

/** 支持历史记录管理的画布操作 */
interface CanvasOperator {
  type: CanvasOperationType;
  values: string;
}
export class HistoryManage extends Domain<{
  stacks: CanvasOperator[];
  index: number;
  canUndo: boolean;
  canRedo: boolean;
}> {
  /** 历史栈 */
  get stacks() {
    return this.values.stacks;
  }
  /** 当前下标 */
  get index() {
    return this.values.index;
  }

  constructor(
    params = {
      stacks: [],
      index: -1,
      canUndo: false,
      canRedo: false,
    }
  ) {
    super(params);
  }

  /** 增加一个操作记录 */
  push(operation: CanvasOperator) {
    const { stacks, index } = this.values;
    if (index === stacks.length - 1) {
      this.values.stacks.push(operation);
    } else {
      this.values.stacks = stacks.slice(0, index + 1).concat(operation);
    }
    this.values.index += 1;
    // console.log("[DOMAIN]HistoryManage - push", operation);
    this.addSomeStatus();
    // console.log("[DOMAIN]HistoryManage - push", this.values);
    this.emitValuesChange();
  }
  undo() {
    const { stacks, index, canUndo } = this.values;
    console.log("[DOMAIN]HistoryManage - undo", stacks, index);
    // console.log("[DOMAIN]HistoryManage - undo", canUndo);
    if (!canUndo) {
      return null;
    }
    const operation = stacks[index];
    this.values.index -= 1;
    // console.log("[DOMAIN]HistoryManage - undo", this.stacks);
    this.addSomeStatus();
    this.emitValuesChange();
    // console.log("[DOMAIN]HistoryManage - undo", operation);
    if (operation === undefined) {
      return null;
    }
    return operation;
  }
  redo() {
    const { index, stacks, canRedo } = this.values;
    if (!canRedo) {
      return null;
    }
    const nextIndex = index + 1;
    this.values.index = nextIndex;
    const next = stacks[nextIndex];
    console.log("[DOMAIN]HistoryManage - redo", next);
    this.addSomeStatus();
    this.emitValuesChange();
    if (next === undefined) {
      return null;
    }
    return next;
  }
  addSomeStatus() {
    const { stacks, index } = this.values;
    this.values = {
      stacks,
      index,
      canUndo: index >= 0,
      canRedo: index < stacks.length - 1,
    };
  }
}

export enum CanvasOperationType {
  /** 添加物体 */
  AddThing,
  /** 删除物体 */
  DelThing,
  /** 移动 */
  Drag,
  /** 缩放 */
  Resize,
  /** 旋转 */
  Rotate,
}
