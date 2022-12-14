import React from "react";
// import html2canvas from "html2canvas";

import {
  BoxSize,
  SideSize,
  CanvasThingShape,
  Position,
  Size,
  RectShape,
  LineShape,
} from "../types/canvas";
import {
  CanvasThingTypes,
  Side,
  ALL_SLIDES,
  LineDirectionTypes,
  RectLineTypes,
} from "../constants";

import TransformRect from "../domains/rect";

export { math } from "./math";

/**
 * 计算？
 * @deprecated
 * @param {number} distanceX - 水平方向上移动的距离
 * @param {number} distanceY  - 垂直方向上移动的距离
 */
export function getLength(distanceX: number, distanceY: number) {
  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

export function getAngle(
  { x: x1, y: y1 }: { x: number; y: number },
  { x: x2, y: y2 }: { x: number; y: number }
) {
  const dot = x1 * x2 + y1 * y2;
  const det = x1 * y2 - y1 * x2;
  const angle = (Math.atan2(det, dot) / Math.PI) * 180;
  return (angle + 360) % 360;
}

/**
 * 角度转弧度？
 * @param {number} deg - 角度
 */
export function degToRadian(deg: number) {
  return (deg * Math.PI) / 180;
}

function cos(deg: number) {
  return Math.cos(degToRadian(deg));
}
function sin(deg: number) {
  return Math.sin(degToRadian(deg));
}

/**
 *
 * @param {number} width
 * @param {number} deltaW
 * @param {number} minWidth
 */
function getAbsolutelyDistanceAtX(
  width: number,
  deltaW: number,
  minWidth: number
) {
  const expectedWidth = width + deltaW;
  if (expectedWidth > minWidth) {
    width = expectedWidth;
  } else {
    deltaW = minWidth - width;
    width = minWidth;
  }
  return { width, deltaW };
}

function setHeightAndDeltaH(height: number, deltaH: number, minHeight: number) {
  const expectedHeight = height + deltaH;
  if (expectedHeight > minHeight) {
    height = expectedHeight;
  } else {
    deltaH = minHeight - height;
    height = minHeight;
  }
  return { height, deltaH };
}

/**
 * 根据鼠标位置、方向等，计算盒子大小、位置和角度
 */
export function getNewStyle(
  /** 移动方向 */
  type: string,
  /** 矩形信息 */
  rect: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    angle: number;
  },
  /** 水平方向上移动的距离 */
  deltaW: number,
  /** 垂直方向上移动的距离 */
  deltaH: number,
  /** 缩放比例 */
  ratio: number | boolean | undefined,
  /** 最小宽度 */
  minWidth: number = 1,
  /** 最小高度 */
  minHeight: number = 1
) {
  let { width, height, centerX, centerY, angle: rotateAngle } = rect;
  const widthFlag = width < 0 ? -1 : 1;
  const heightFlag = height < 0 ? -1 : 1;
  width = Math.abs(width);
  height = Math.abs(height);
  switch (type) {
    case "e": {
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      // 盒子实际宽度
      width = widthAndDeltaW.width;
      // 相对初始宽度的宽度，可能为负数
      deltaW = widthAndDeltaW.deltaW;
      // console.log("[]widthAndDeltaW", width, deltaW);
      if (ratio && typeof ratio === "number") {
        deltaH = deltaW / ratio;
        height = width / ratio;
        // 左上角固定
        centerX +=
          (deltaW / 2) * cos(rotateAngle) - (deltaH / 2) * sin(rotateAngle);
        centerY +=
          (deltaW / 2) * sin(rotateAngle) + (deltaH / 2) * cos(rotateAngle);
      } else {
        // 左边固定
        // console.log("[]cos(rotateAngle)", cos(rotateAngle));
        // 如果往右边移动了 10，那么中心点就往右边移动了 10/2
        centerX += (deltaW / 2) * cos(rotateAngle);
        centerY += (deltaW / 2) * sin(rotateAngle);
      }
      break;
    }
    case "tr": {
      deltaH = -deltaH;
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      width = widthAndDeltaW.width;
      deltaW = widthAndDeltaW.deltaW;
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        deltaW = deltaH * ratio;
        width = height * ratio;
      }
      centerX +=
        (deltaW / 2) * cos(rotateAngle) + (deltaH / 2) * sin(rotateAngle);
      centerY +=
        (deltaW / 2) * sin(rotateAngle) - (deltaH / 2) * cos(rotateAngle);
      break;
    }
    case "br": {
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      width = widthAndDeltaW.width;
      deltaW = widthAndDeltaW.deltaW;
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        deltaW = deltaH * ratio;
        width = height * ratio;
      }
      centerX +=
        (deltaW / 2) * cos(rotateAngle) - (deltaH / 2) * sin(rotateAngle);
      centerY +=
        (deltaW / 2) * sin(rotateAngle) + (deltaH / 2) * cos(rotateAngle);
      break;
    }
    case "s": {
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        deltaW = deltaH * ratio;
        width = height * ratio;
        // 左上角固定
        centerX +=
          (deltaW / 2) * cos(rotateAngle) - (deltaH / 2) * sin(rotateAngle);
        centerY +=
          (deltaW / 2) * sin(rotateAngle) + (deltaH / 2) * cos(rotateAngle);
      } else {
        // 上边固定
        centerX -= (deltaH / 2) * sin(rotateAngle);
        centerY += (deltaH / 2) * cos(rotateAngle);
      }
      break;
    }
    case "bl": {
      deltaW = -deltaW;
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      width = widthAndDeltaW.width;
      deltaW = widthAndDeltaW.deltaW;
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        height = width / ratio;
        deltaH = deltaW / ratio;
      }
      centerX -=
        (deltaW / 2) * cos(rotateAngle) + (deltaH / 2) * sin(rotateAngle);
      centerY -=
        (deltaW / 2) * sin(rotateAngle) - (deltaH / 2) * cos(rotateAngle);
      break;
    }
    case "w": {
      // console.log("[UTIL]getNewStyle - l", deltaW);
      deltaW = -deltaW;
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      width = widthAndDeltaW.width;
      deltaW = widthAndDeltaW.deltaW;
      // console.log("[UTIL]getNewStyle - l", deltaW);
      if (ratio && typeof ratio === "number") {
        height = width / ratio;
        deltaH = deltaW / ratio;
        // 右上角固定
        centerX -=
          (deltaW / 2) * cos(rotateAngle) + (deltaH / 2) * sin(rotateAngle);
        centerY -=
          (deltaW / 2) * sin(rotateAngle) - (deltaH / 2) * cos(rotateAngle);
      } else {
        // 右边固定
        centerX -= (deltaW / 2) * cos(rotateAngle);
        centerY -= (deltaW / 2) * sin(rotateAngle);
      }
      // console.log("[UTIL]getNewStyle - l", centerX);
      break;
    }
    case "tl": {
      deltaW = -deltaW;
      deltaH = -deltaH;
      const widthAndDeltaW = getAbsolutelyDistanceAtX(width, deltaW, minWidth);
      width = widthAndDeltaW.width;
      deltaW = widthAndDeltaW.deltaW;
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        width = height * ratio;
        deltaW = deltaH * ratio;
      }
      centerX -=
        (deltaW / 2) * cos(rotateAngle) - (deltaH / 2) * sin(rotateAngle);
      centerY -=
        (deltaW / 2) * sin(rotateAngle) + (deltaH / 2) * cos(rotateAngle);
      break;
    }
    case "n": {
      deltaH = -deltaH;
      const heightAndDeltaH = setHeightAndDeltaH(height, deltaH, minHeight);
      height = heightAndDeltaH.height;
      deltaH = heightAndDeltaH.deltaH;
      if (ratio && typeof ratio === "number") {
        width = height * ratio;
        deltaW = deltaH * ratio;
        // 左下角固定
        centerX +=
          (deltaW / 2) * cos(rotateAngle) + (deltaH / 2) * sin(rotateAngle);
        centerY +=
          (deltaW / 2) * sin(rotateAngle) - (deltaH / 2) * cos(rotateAngle);
      } else {
        centerX += (deltaH / 2) * sin(rotateAngle);
        centerY -= (deltaH / 2) * cos(rotateAngle);
      }
      break;
    }
  }

  return {
    position: {
      centerX,
      centerY,
    },
    size: {
      width: width * widthFlag,
      height: height * heightFlag,
    },
  };
}

const cursorDirectionArray = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
export type CursorTypePrefix =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";
const cursorMap: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 4,
  6: 4,
  7: 5,
  8: 6,
  9: 6,
  10: 7,
  11: 8,
};
const cursorStartMap: Record<CursorTypePrefix, number> = {
  n: 0,
  ne: 1,
  e: 2,
  se: 3,
  s: 4,
  sw: 5,
  w: 6,
  nw: 7,
};

/**
 * 获取移动方向（知道移动方向就知道光标要张什么样了）
 * @param {number} rotateAngle - 当前旋转的角度
 * @param {string} d - 光标??
 * @returns 光标的类型
 */
export function getCursor(rotateAngle: number, d: CursorTypePrefix) {
  const increment = cursorMap[Math.floor(rotateAngle / 30)];
  const index = cursorStartMap[d];
  const newIndex = (index + increment) % 8;
  return cursorDirectionArray[newIndex];
}

/**
 * 根据矩形的中心点、宽高和旋转角度，计算出盒子水平方向与垂直方向的距离、宽高和旋转角度
 * @deprecated
 */
export function centerToTL({
  centerX,
  centerY,
  width,
  height,
  rotateAngle,
}: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotateAngle: number;
}) {
  return {
    top: centerY - height / 2,
    left: centerX - width / 2,
    width,
    height,
    rotateAngle,
  };
}

export function tLToCenter({
  top,
  left,
  width,
  height,
  rotateAngle,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  rotateAngle: number;
}) {
  return {
    position: {
      centerX: left + width / 2,
      centerY: top + height / 2,
    },
    size: {
      width,
      height,
    },
    transform: {
      rotateAngle,
    },
  };
}

/**
 *  计算相同比例下的长宽高
 */
export function computeRelativeSize(
  originalSize: BoxSize,
  targetLength: number
) {
  const { length, width, height } = originalSize;

  const targetWidth = (width / length) * targetLength;
  const targetHeight = (height / length) * targetLength;

  return {
    length: targetLength,
    width: targetWidth,
    height: targetHeight,
  };
}

interface SidesSize {
  top: SideSize;
  bottom: SideSize;
  left: SideSize;
  right: SideSize;
  front: SideSize;
  back: SideSize;
}

export function computeSideSize(
  length: number,
  width: number,
  height: number
): SidesSize {
  const topSide = {
    width: length,
    height: width,
  };
  const bottomSide = {
    // width: length + 4,
    width: length,
    height: width,
  };
  const leftSide = {
    width,
    height,
  };
  const frontSide = {
    width: length,
    height,
  };
  return {
    top: topSide,
    bottom: bottomSide,
    left: leftSide,
    right: leftSide,
    front: frontSide,
    back: frontSide,
  };
}

function topAndBottom(boxSize: BoxSize): SideSize {
  return {
    width: boxSize.length,
    height: boxSize.width,
  };
}
function leftAndRight(boxSize: BoxSize): SideSize {
  return {
    width: boxSize.width,
    height: boxSize.height,
  };
}
function frontAndBack(boxSize: BoxSize): SideSize {
  return {
    width: boxSize.length,
    height: boxSize.height,
  };
}
function bottomSide(boxSize: BoxSize): SideSize {
  const PAGE_THICKNESS = 4;
  return {
    width: boxSize.length + PAGE_THICKNESS * 2,
    height: boxSize.width,
  };
}

const SIDE_COMPUTER = {
  // [Side.Top]: topAndBottom,
  // [Side.Bottom]: bottomSide,
  // [Side.Left]: leftAndRight,
  // [Side.Right]: leftAndRight,
  [Side.Front]: frontAndBack,
  [Side.Back]: frontAndBack,
};

/**
 *  根据盒子长宽高计算指定面宽高
 */
export function computeSingleSideSize(size: BoxSize, side: Side): SideSize {
  return SIDE_COMPUTER[side](size);
}

/** 根据文字配置计算文字样式 */
export function computeStyleByFontStyle(
  fontStyle: Record<string, unknown>,
  originalStyle: React.CSSProperties
) {
  const nextStyle: React.CSSProperties = {
    ...originalStyle,
  };
  if (fontStyle.leftAlign) {
    nextStyle.textAlign = "left";
  }
  if (fontStyle.centerAlign) {
    nextStyle.textAlign = "center";
  }
  if (fontStyle.rightAlign) {
    nextStyle.textAlign = "right";
  }
  // if (fontStyle.fontSize !== undefined && fontStyle.fontSize !== 0) {
  //   nextStyle.fontSize = originalStyle.fontSize + fontStyle.fontSize;
  // }
  if (fontStyle.underline) {
    nextStyle.textDecoration = "underline";
  } else {
    nextStyle.textDecoration = "unset";
  }
  if (fontStyle.bold) {
    nextStyle.fontWeight = "bold";
  } else {
    nextStyle.fontWeight = "normal";
  }
  if (fontStyle.italics) {
    nextStyle.fontStyle = "italic";
  } else {
    nextStyle.fontStyle = "unset";
  }
  // if (fontStyle.color) {
  //   nextStyle.color = fontStyle.color;
  // }
  return nextStyle;
}

export function updateContent(
  nextContent: CanvasThingShape,
  contents: Array<CanvasThingShape>
) {
  const changedContentIndex = contents.findIndex(
    (c) => c.id === nextContent.id
  );
  if (changedContentIndex === -1) {
    return contents;
  }
  return [
    ...contents.slice(0, changedContentIndex),
    nextContent,
    ...contents.slice(changedContentIndex + 1, contents.length),
  ];
}

/**
 * 粘贴事件获取图片
 * @param event
 */
// function readImageFromPaste(event: ClipboardEvent) {
//   return new Promise((resolve, reject) => {
//     const { clipboardData } = event;
//     if (clipboardData === null) {
//       reject();
//       return;
//     }
//     const { items } = clipboardData;
//     const files = Array.from(items)
//       .filter((item) => {
//         return item.type.includes("image");
//       })
//       .map((item) => {
//         const blob = item.getAsFile();
//         return blob;
//       })
//       .filter(Boolean);
//     const latestImageBlob = files[0];

//     if (latestImageBlob === null) {
//       reject();
//       return;
//     }

//     const reader = new FileReader();
//     reader.readAsDataURL(latestImageBlob);
//     reader.onloadend = () => {
//       const base64data = reader.result;
//       resolve(base64data);
//       // this.addImageContent(base64data as string);
//     };
//   });
// }

/** 从画布内容上过滤出文字内容 */
function filterTextContentFromContents(contents: Array<CanvasThingShape>) {
  return contents.filter(
    (content: CanvasThingShape) => content.type === CanvasThingTypes.Text
  );
}
/**
 * 过滤掉重复的字体
 */
// function filterDuplicateFont(fonts: CanvasThingShape[]) {
//   const filtered = fonts
//     .map((font) => {
//       if (font.type === CanvasThingTypes.Text) {
//         return {
//           [font.data.name]: font,
//         };
//       }
//       return font;
//     })
//     .reduce((prev, next) => {
//       return {
//         ...prev,
//         ...next,
//       };
//     }, {});
//   return Object.values(filtered);
// }

/** 从文字 font-family 属性值获取字体族名称 */
// function getFontFamily(content: CanvasThingShape) {
//   if (content.style && content.style.fontFamily) {
//     return content.style.fontFamily.split(",")[0];
//   }
//   return "cursive";
// }
// export function findFontFilesFromCanvasContents(
//   canvases: Record<string, CanvasThingShape[]>
// ) {
//   const fonts = Object.keys(canvases)
//     .map((side) => {
//       const contents = canvases[side];
//       return filterTextContentFromContents(contents);
//     })
//     .reduce((prev, next) => prev.concat(next), [])
//     .filter((font) => {
//       const { type } = font;
//       if (type === CanvasThingTypes.Text && !!font.data.fontFileUrl) {
//         return true;
//       }
//       return false;
//     })
//     .map((content) => {
//       const { type, data } = content;
//       if (type === CanvasThingTypes.Text) {
//         return { url: data.fontFileUrl, name: getFontFamily(content) };
//       }
//       return content;
//     });
//   // @ts-ignore
//   return filterDuplicateFont(fonts);
// }

export function findMaxUuidOfContents(contents: Array<CanvasThingShape>) {
  return Math.max.apply(
    null,
    contents.map((content) => {
      return content.id;
    })
  );
}

export function findMaxUuidOfCanvases(
  canvases: Record<string, CanvasThingShape[]>
) {
  return Math.max.apply(
    null,
    Object.keys(canvases).map((side) => {
      const contents = canvases[side];

      const max = findMaxUuidOfContents(contents);

      return max;
    })
  );
}

/**
 * 获取数组中最大值减最小值
 */
export function getLengthByMaxSubMinInArray(arr: number[]) {
  const num = arr.sort((a, b) => a - b);
  return num[num.length - 1] - num[0];
}

/**
 * 检查是否在选择框框选范围内容
 */
export function checkInSelectionRange(
  selection: RectShape,
  contents: CanvasThingShape[]
) {
  const mergedContents = [];
  for (let i = 0; i < contents.length; i += 1) {
    const content = contents[i];
    const isMerge = checkRectIsMerge(content.rect.client, selection);
    if (isMerge) {
      mergedContents.push(content);
    }
  }
  return mergedContents;
}

/**
 * 检查两个矩形是否相交
 */
export function checkRectIsMerge(rect1: RectShape, rect2: RectShape) {
  const { left: x1, top: y2, width: width1, height: height1 } = rect1;
  const x2 = x1 + width1;
  const y1 = y2 + height1;
  const { left: x3, top: y4, width: width2, height: height2 } = rect2;
  const x4 = x3 + width2;
  const y3 = y4 + height2;
  // 其实就是先看两个矩形的左边，哪个在中间，然后在中间的这条边，必须位于两个矩形的右边中，靠近左边的边的左边
  // 垂直方向上同理
  return (
    Math.max(x1, x3) <= Math.min(x2, x4) && Math.max(y2, y4) <= Math.min(y1, y3)
  );
}
/** 从指定 rect 拿到该矩形所有线 */
export function getLinesFromRect(rect: RectShape) {
  const { left, right, bottom, top, center, width, height } = rect;
  const rectLines: LineShape[] = [
    {
      type: LineDirectionTypes.Horizontal,
      origin: left,
      y: top,
      length: width,
      typeAtRect: RectLineTypes.Top,
    },
    {
      type: LineDirectionTypes.Horizontal,
      origin: left,
      y: center.y,
      length: width,
      typeAtRect: RectLineTypes.HorizontalCenter,
    },
    {
      type: LineDirectionTypes.Horizontal,
      y: bottom,
      origin: left,
      length: width,
      typeAtRect: RectLineTypes.Bottom,
    },
    {
      type: LineDirectionTypes.Vertical,
      origin: top,
      x: left,
      length: height,
      typeAtRect: RectLineTypes.Left,
    },
    {
      type: LineDirectionTypes.Vertical,
      origin: top,
      x: center.x,
      length: height,
      typeAtRect: RectLineTypes.VerticalCenter,
    },
    {
      type: LineDirectionTypes.Vertical,
      origin: top,
      x: right,
      length: height,
      typeAtRect: RectLineTypes.Right,
    },
  ];
  return rectLines;
}

/**
 * 检查矩形是否靠近指定线条
 */
export function findNearbyLinesAtRect(
  rect: RectShape,
  lines: LineShape[],
  options: {
    threshold?: number;
  } = {}
): [RectShape, LineShape[]] {
  const rectLines = getLinesFromRect(rect);
  const result: LineShape[] = [];
  const nextRect = { ...rect };
  for (let i = 0; i < rectLines.length; i += 1) {
    const rectLine = rectLines[i];
    for (let j = 0; j < lines.length; j += 1) {
      const line = lines[j];
      if (checkTowLinesIsNear(rectLine, line, options)) {
        result.push(line);
        const rectLineType = rectLine.typeAtRect;
        if (
          rectLineType === RectLineTypes.Top &&
          line.type === LineDirectionTypes.Horizontal
        ) {
          nextRect.top = line.y;
        }
        if (
          rectLineType === RectLineTypes.HorizontalCenter &&
          line.type === LineDirectionTypes.Horizontal
        ) {
          nextRect.top = line.y - nextRect.height / 2;
        }
        if (
          rectLineType === RectLineTypes.Bottom &&
          line.type === LineDirectionTypes.Horizontal
        ) {
          nextRect.top = line.y - nextRect.height;
        }
        if (
          rectLineType === RectLineTypes.Left &&
          line.type === LineDirectionTypes.Vertical
        ) {
          nextRect.left = line.x;
        }
        if (
          rectLineType === RectLineTypes.VerticalCenter &&
          line.type === LineDirectionTypes.Vertical
        ) {
          nextRect.left = line.x - nextRect.width / 2;
        }
        if (
          rectLineType === RectLineTypes.Right &&
          line.type === LineDirectionTypes.Vertical
        ) {
          // console.log("[UTILS]findNearbyLinesAtRect - rect right line");
          nextRect.left = line.x - nextRect.width;
        }
      }
    }
  }
  return [nextRect, result];
}

/**
 * 检查两根线是否靠近
 */
function checkTowLinesIsNear(
  line1: LineShape,
  line2: LineShape,
  options: Partial<{
    threshold: number;
  }> = {}
) {
  const { type: type1 } = line1;
  const { type: type2 } = line2;
  const { threshold = 10 } = options;
  if (type1 !== type2) {
    return false;
  }
  if (
    type1 === LineDirectionTypes.Horizontal &&
    type2 === LineDirectionTypes.Horizontal
  ) {
    const v1 = line1.y;
    const v2 = line2.y;
    if (Math.abs(v1 - v2) < threshold) {
      return true;
    }
    return false;
  }
  if (
    type1 === LineDirectionTypes.Vertical &&
    type2 === LineDirectionTypes.Vertical
  ) {
    const v1 = line1.x;
    const v2 = line2.x;
    if (Math.abs(v1 - v2) < threshold) {
      return true;
    }
    return false;
  }
  return false;
}

/** 返回一个空 rect */
export function createEmptyRectShape(rect: Partial<RectShape> = {}) {
  return Object.assign(
    {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      angle: 0,
      center: {
        x: 0,
        y: 0,
      },
      index: 0,
    },
    rect
  ) as RectShape;
}

/**
 * uuid 工厂函数
 */
export function uuidFactory() {
  let _uuid = -1;
  return function uuid() {
    // console.log("[UTILS]uuid", _uuid);
    _uuid += 1;
    return _uuid;
  };
  // function setUuid(nextUuid: number) {
  //   _uuid = nextUuid;
  //   return _uuid;
  // }
}

/**
 * 粘贴事件获取图片
 * @param event
 */
// export function readImageFromPaste(event: ClipboardEvent) {
//   return new Promise((resolve, reject) => {
//     const { clipboardData } = event;
//     if (clipboardData === null) {
//       reject();
//       return;
//     }
//     const { items } = clipboardData;
//     const files = Array.from(items)
//       .filter((item) => {
//         return item.type.includes("image");
//       })
//       .map((item) => {
//         const blob = item.getAsFile();
//         return blob;
//       })
//       .filter(Boolean);
//     const latestImageBlob = files[0];

//     if (latestImageBlob === null) {
//       reject();
//       return;
//     }

//     const reader = new FileReader();
//     reader.readAsDataURL(latestImageBlob);
//     reader.onloadend = () => {
//       const base64data = reader.result;
//       resolve(base64data);
//       // this.addImageContent(base64data as string);
//     };
//   });
// }

/**
 * 加载一张图片
 */
// export function loadImage(url: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const img = document.createElement("img");
//     img.setAttribute("crossOrigin", "Anonymous");
//     img.src = url;
//     img.width = 0;
//     img.height = 0;
//     document.body.appendChild(img);
//     img.onload = () => {
//       document.body.removeChild(img);
//       resolve(img);
//     };
//     img.onerror = (error) => {
//       document.body.removeChild(img);
//       reject(error);
//     };
//   });
// }
