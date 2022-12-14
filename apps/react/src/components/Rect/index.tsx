/**
 * @file 可变形（旋转、移动、缩放）的盒子
 */
import React, { useCallback, useEffect, useReducer, useRef } from "react";
import cx from "classnames";
import { RectShape } from "canvas-sdk";
import TransformRect from "canvas-sdk/domains/rect";
import {
  createEmptyRectShape,
  CursorTypePrefix,
  getCursor,
} from "canvas-sdk/utils";

import "./index.less";

const zoomableMap: Record<CursorTypePrefix, string> = {
  n: "n",
  s: "s",
  e: "e",
  w: "w",
  ne: "tr",
  nw: "tl",
  se: "br",
  sw: "bl",
};

const initialState = createEmptyRectShape();
function reducer(
  state: typeof initialState,
  action: { type: string; payload: RectShape }
) {
  const { type, payload } = action;
  if (type === "setClient") {
    return { ...state, ...payload };
  }
  return state;
}

export interface IRectProps {
  /** 样式 */
  style?: React.CSSProperties;
  /** 容器实例 */
  instance: TransformRect;
  /** 是否可缩放，可缩放的方向 */
  zoomable?: string;
  /** 是否可旋转 */
  rotatable?: boolean;
  /** 是否可拖动 */
  draggable?: boolean;
  /** 父级旋转的角度 */
  parentRotateAngle?: number;
  /** 内容 */
  children?: React.ReactNode;
  /** 开始缩放时的回调 */
  onResizeStart?: () => void;
  /** 正在缩放时的回调 */
  onResize?: (rect: RectShape) => void;
  /** 结束缩放时的回调 */
  onResizeEnd?: () => void;
  /** 开始旋转时的回调 */
  onRotateStart?: () => void;
  /** 选中中的回调 */
  onRotate?: (rect: RectShape) => void;
  /** 结束选中时的回调 */
  onRotateEnd?: () => void;
  /** 开始拖动时的回调 */
  onDragStart?: () => void;
  /** 正在拖动中的回调 */
  onDrag?: (rect: RectShape) => RectShape;
  /** 结束拖动时的回调 */
  onDragEnd?: () => void;
  /** 点击时的回调 */
  onClick?: () => void;
  /** 鼠标按下时的回调 */
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
}
const Rect: React.FC<IRectProps> = (props) => {
  const {
    instance,
    rotatable,
    zoomable,
    draggable,
    parentRotateAngle = 0,
    children,
    onDragStart,
    onDrag,
    onDragEnd,
    onRotateStart,
    onRotate,
    onResizeEnd,
    onResizeStart,
    onResize,
    onRotateEnd,
    onMouseDown,
    onClick,
  } = props;

  // console.log('[COMPONENT]ResizeAndDrag - render', zoomable);

  const $rectRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const [{ width, height, top, left, angle, index }, dispatch] = useReducer(
    reducer,
    {
      ...instance.client,
    }
  );

  useEffect(() => {
    if ($rectRef.current !== null) {
      instance.bindNode($rectRef.current);
    }
    instance.addListener((nextRect) => {
      // console.log("[COMPONENT]Rect - addListener", nextRect.index);
      dispatch({
        type: "setClient",
        payload: nextRect,
      });
    });
  }, []);

  const directions = zoomable
    ? (zoomable
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d) as CursorTypePrefix[])
    : [];

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      // console.log("[COMPONENT]Rect - startDrag", draggable);
      e.stopPropagation();
      let isMouseDown = true;
      let { clientX: startX, clientY: startY } = e;
      if (!draggable) {
        return;
      }
      instance.startDrag({
        x: startX,
        y: startY,
      });
      if (onMouseDown) {
        onMouseDown(e);
      }
      if (onDragStart) {
        onDragStart();
      }
      const onMove = (event: MouseEvent) => {
        // patch: fix windows press win key during mouseup issue
        if (!isMouseDown) {
          return;
        }
        event.stopImmediatePropagation();
        const { clientX, clientY } = event;
        const result = instance.drag({
          x: clientX,
          y: clientY,
        });
        if (onDrag) {
          onDrag(result);
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (!isMouseDown) {
          return;
        }
        isMouseDown = false;
        instance.endDrag();
        if (onDragEnd) {
          onDragEnd();
        }
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [draggable, onMouseDown, onDragStart, onDrag, onDragEnd]
  );

  const startRotate = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (event.button !== 0) {
        return;
      }
      if ($rectRef.current === null) {
        return;
      }
      const { clientX, clientY } = event;
      const rect = $rectRef.current.getBoundingClientRect();
      instance.startRotate({
        x: clientX,
        y: clientY,
        // @todo left、top、width 和 height 起始都是用来算旋转的中心点的，中心点并不一定是卡片中心，所以完全可以传 center 参数，而不是 left、top 这些参数
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
      if (onRotateStart) {
        onRotateStart();
      }
      isMouseDownRef.current = true;
      const onMove = (e: MouseEvent) => {
        // patch: fix windows press win key during mouseup issue
        if (!isMouseDownRef.current) {
          return;
        }
        e.stopImmediatePropagation();
        const { clientX, clientY } = e;
        const rect = instance.rotate({ x: clientX, y: clientY });
        if (onRotate) {
          onRotate(rect);
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (!isMouseDownRef.current) {
          return;
        }
        isMouseDownRef.current = false;
        instance.endRotate();
        if (onRotateEnd) {
          onRotateEnd();
        }
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [onRotateStart, onRotate, onRotateEnd]
  );

  const startResize = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement, MouseEvent>,
      cursor: Required<React.CSSProperties>["cursor"]
    ) => {
      if (event.button !== 0) {
        return;
      }
      document.body.style.cursor = cursor;
      const { clientX: startX, clientY: startY } = event;
      /** t r b l tr bl tl br */
      // @ts-ignore
      const directionType = event.target.getAttribute("class").split(" ")[0];
      instance.startResize({
        x: startX,
        y: startY,
        type: directionType,
        isShift: event.shiftKey,
      });
      if (onResizeStart) {
        onResizeStart();
      }
      isMouseDownRef.current = true;
      const onMove = (e: MouseEvent) => {
        // patch: fix windows press win key during mouseup issue
        if (!isMouseDownRef.current) {
          return;
        }
        e.stopImmediatePropagation();
        const { clientX, clientY } = e;
        const isShiftKey = e.shiftKey;
        const rect = instance.resize({
          x: clientX,
          y: clientY,
          isShift: isShiftKey,
        });
        if (onResize) {
          onResize(rect);
        }
      };
      document.addEventListener("mousemove", onMove);
      const onUp = () => {
        document.body.style.cursor = "auto";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (!isMouseDownRef.current) return;
        isMouseDownRef.current = false;
        instance.endResize();
        if (onResizeEnd) {
          onResizeEnd();
        }
      };
      document.addEventListener("mouseup", onUp);
    },
    [onResizeStart, onResize, onResizeEnd]
  );

  const style = (() => {
    const result = {
      ...(props.style || {}),
    } as React.CSSProperties;

    if (angle) {
      result.transform = `rotate(${angle}deg)`;
    }
    result.zIndex = index;
    result.left = left;
    result.top = top;
    result.width = Math.abs(width);
    result.height = Math.abs(height);
    return result;
  })();

  // console.log("[COMPONENT]Rect - render", style);

  return (
    <div
      ref={$rectRef}
      className={cx("rect", {
        bordered: zoomable,
      })}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        if (onClick) {
          onClick();
        }
      }}
      onMouseDown={startDrag}
    >
      {children}
      {rotatable && (
        <div className="rotate" onMouseDown={startRotate}>
          <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10.536 3.464A5 5 0 1 0 11 10l1.424 1.425a7 7 0 1 1-.475-9.374L13.659.34A.2.2 0 0 1 14 .483V5.5a.5.5 0 0 1-.5.5H8.483a.2.2 0 0 1-.142-.341l2.195-2.195z"
              fill="#eb5648"
              fillRule="nonzero"
            />
          </svg>
        </div>
      )}
      {directions.map((d) => {
        const cursor = `${getCursor(angle + parentRotateAngle, d)}-resize`;
        return (
          <div
            key={d}
            style={{ cursor }}
            className={`${zoomableMap[d]} resizable-handler square`}
            onMouseDown={(e) => startResize(e, cursor)}
          />
        );
      })}
    </div>
  );
};

export default React.memo(Rect, (prevProps, props) => {
  if (prevProps.draggable !== props.draggable) {
    return false;
  }
  if (prevProps.rotatable !== props.rotatable) {
    return false;
  }
  if (prevProps.zoomable !== props.zoomable) {
    return false;
  }
  if (prevProps.instance !== props.instance) {
    return false;
  }
  return true;
});
// export default Rect;
