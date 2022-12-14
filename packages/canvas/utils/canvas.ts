import { CanvasThingShape, RectShape } from "../types/canvas";
import { createEmptyRectShape } from "./index";

import { CanvasDomain } from "../index";

/**
 * 根据多个矩形盒子，计算能包裹这些盒子的盒子尺寸、位置信息
 */
export function calcGroupClientFromRects(contents: CanvasThingShape[]) {
  let client = createEmptyRectShape();
  if (contents.length === 0) {
    return client;
  }
  if (contents.length === 1) {
    return contents[0].rect.client;
  }
  client = contents[0].rect.client;
  for (let i = 0; i < contents.length; i += 1) {
    const { rect } = contents[i];
    const { left, top, bottom, right } = rect.client;
    console.log("[UTILS]calcGroupClientFromRects - content rect top", top);
    if (client.left > left) {
      client.left = left;
    }
    if (client.right < right) {
      client.right = right;
    }
    if (client.top > top) {
      client.top = top;
    }
    if (client.bottom < bottom) {
      client.bottom = bottom;
    }
    //     console.log("[UTILS]calcGroupClientFromRects - wrap rect", client.top);
  }
  //   console.log("[UTILS]calcGroupClientFromRects - top", client.top);
  client.width = Math.abs(client.right - client.left);
  client.height = Math.abs(client.bottom - client.top);
  client.center = {
    x: client.left + client.width / 2,
    y: client.top + client.height / 2,
  };
  //   console.log("[UTILS]calcGroupClientFromRects - result", client);
  return client;
}

/**
 * 计算一个有旋转角度的矩形盒子的外边框尺寸、位置信息
 */
function calcRectClientHasRotateAngle(rect: RectShape) {
  const { angle, left, right, top, bottom } = rect;
  if ([0, 90, 180, 270, 360].includes(angle)) {
    return {
      ...rect,
    };
  }
}

/**
 * 以不同的父容器计算一个 rect 的位置、尺寸信息
 */
export function calcRectClientWithDifferentParent(
  rect: RectShape,
  parent1: RectShape
) {
  const { left, top } = rect;
  const { left: p2Left, top: p2Top } = parent1;
  const relativeLeft = left - p2Left;
  const relativeTop = top - p2Top;

  return {
    ...rect,
    left: relativeLeft,
    top: relativeTop,
  };
}
