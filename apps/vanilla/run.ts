import {
  CanvasDomain,
  CanvasThingShape,
  CanvasThingTypes,
  LineDirectionTypes,
} from "canvas-sdk";
import { CursorTypePrefix, getCursor } from "canvas-sdk/utils";

import { listen } from "utils/dom";
import { getWidthAndHeight } from "utils";

import { registerHotkeys } from "./hotkeys";

const createdThingElements: {
  id: number;
  thing: CanvasThingShape;
  $node: HTMLDivElement;
}[] = [];
const zoomableMap: Record<string, string> = {
  n: "n",
  s: "s",
  e: "e",
  w: "w",
  ne: "tr",
  nw: "tl",
  se: "br",
  sw: "bl",
};

export function main() {
  const $btnAddingText = document.getElementById("btn-add-text");
  const $btnHistoryUndo = document.getElementById("btn-history-undo");
  const $btnHistoryRedo = document.getElementById("btn-history-redo");
  const $inputImage = document.getElementById("input-image");
  const $canvas = document.getElementById("canvas");
  if (!$canvas) {
    return;
  }
  const store = new CanvasDomain();
  store.setCanvasClient($canvas.getBoundingClientRect());
  registerHotkeys(store);
  store.addListener((nextValues) => {
    const { things } = nextValues;
    const nextThingIds = things.map((thing) => thing.id);
    const nextThingIdMap = nextThingIds
      .map((id) => {
        return {
          [id]: true,
        };
      })
      .reduce((obj, cur) => {
        return {
          ...obj,
          ...cur,
        };
      }, []);
    console.log("[PAGE]run - new values things", things);
    for (let i = 0; i < createdThingElements.length; i += 1) {
      const { id, thing, $node } = createdThingElements[i];
      delete nextThingIdMap[id];
      if (nextThingIds.includes(id)) {
        // 已有，看是否更新
        continue;
      }
      // 不在新的列表中，说明是删除
      if (!nextThingIds.includes(id)) {
        createdThingElements.splice(i, 1);
        $canvas.removeChild($node);
      }
    }
    const createdIds = Object.keys(nextThingIdMap).map(Number);
    console.log("[PAGE]run - created ids", createdIds);
    for (let i = 0; i < createdIds.length; i += 1) {
      const createdThingId = createdIds[i];
      const matchedThing = things.find((thing) => thing.id === createdThingId);
      if (!matchedThing) {
        continue;
      }
      const { id, type, data, rect } = matchedThing;
      const {
        client: { width, height, left, top },
      } = rect;
      const $node = document.createElement("div");
      $node.id = `node-${id}`;
      $node.className = "rect";
      if (store.selectedThingIds.includes(id)) {
        enabledTransform(id, matchedThing, $node);
      }
      $node.style.cssText = `width: ${width}px; height: ${height}px; left: ${left}px; top: ${top}px`;
      console.log("[PAGE]run - add new thing");
      rect.addListener((nextRectValues) => {
        $node.style.left = `${nextRectValues.left}px`;
        $node.style.top = `${nextRectValues.top}px`;
        $node.style.width = `${nextRectValues.width}px`;
        $node.style.height = `${nextRectValues.height}px`;
        $node.style.zIndex = String(nextRectValues.index);
      });
      $node.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        let isMouseDown = true;
        let { clientX: startX, clientY: startY } = e;
        //   if (!draggable) {
        //     return;
        //   }
        rect.startDrag({
          x: startX,
          y: startY,
        });
        const onMove = (event: MouseEvent) => {
          // patch: fix windows press win key during mouseup issue
          if (!isMouseDown) {
            return;
          }
          event.stopImmediatePropagation();
          const { clientX, clientY } = event;
          const result = rect.drag({
            x: clientX,
            y: clientY,
          });
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (!isMouseDown) {
            return;
          }
          isMouseDown = false;
          rect.endDrag();
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);

        const curThing = store.findThingById(id);
        console.log(curThing);
        if (curThing && curThing.rect.locking) {
          return;
        }
        if (store.selectedThingIds.length > 1) {
          return;
        }
        store.selectThing(id);
      });
      const $inner = (() => {
        if (type === CanvasThingTypes.Text) {
          const $text = document.createElement("div");
          $text.className = "text";
          $text.innerText = data.values.value;
          return $text;
        }
        if (type === CanvasThingTypes.Image) {
          const $image = document.createElement("img");
          $image.className = "canvas__image";
          $image.src = data.values.url;
          return $image;
        }
        return null;
      })();
      if ($inner) {
        $node.appendChild($inner);
      }
      createdThingElements.push({
        id,
        thing: matchedThing,
        $node,
      });
      $canvas.appendChild($node);
    }
  });
  function enabledTransform(
    id: number,
    thing: CanvasThingShape,
    $node: HTMLDivElement
  ) {
    $node.className = "rect bordered";
    "n,s,e,w,ne,nw,se,sw".split(",").forEach((d) => {
      const $direction = document.createElement("div");
      const nodeId = `node-${id}-square-${d}`;
      const $existingDirection = document.getElementById(nodeId);
      if ($existingDirection) {
        return;
      }
      $direction.id = nodeId;
      const cursor = `${getCursor(0, d as CursorTypePrefix)}-resize`;
      $direction.style.cursor = cursor;
      $direction.className = `${zoomableMap[d]} resizable-handler square`;
      // console.log("append square", $direction);
      $node.appendChild($direction);
      let isMouseDown = false;
      $direction.addEventListener("mousedown", (event) => {
        // onMouseDown={(e) => startResize(e, cursor)}
        if (event.button !== 0) {
          return;
        }
        document.body.style.cursor = cursor;
        const { clientX: startX, clientY: startY } = event;
        /** t r b l tr bl tl br */
        const directionType = zoomableMap[d];
        thing.rect.startResize({
          x: startX,
          y: startY,
          type: directionType,
          isShift: event.shiftKey,
        });
        isMouseDown = true;
        const onMove = (e: MouseEvent) => {
          // patch: fix windows press win key during mouseup issue
          if (!isMouseDown) {
            return;
          }
          e.stopImmediatePropagation();
          const { clientX, clientY } = e;
          const isShiftKey = e.shiftKey;
          const rect = thing.rect.resize({
            x: clientX,
            y: clientY,
            isShift: isShiftKey,
          });
        };
        document.addEventListener("mousemove", onMove);
        const onUp = () => {
          document.body.style.cursor = "auto";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (!isMouseDown) return;
          isMouseDown = false;
          thing.rect.endResize();
        };
        document.addEventListener("mouseup", onUp);
      });
    });
  }
  function disableTransform(
    id: number,
    thing: CanvasThingShape,
    $node: HTMLDivElement
  ) {
    // 重置掉所有可形变的元素
    $node.className = "rect";
    "n,s,e,w,ne,nw,se,sw".split(",").forEach((d) => {
      const nodeId = `node-${id}-square-${d}`;
      const $direction = document.getElementById(nodeId);
      //   console.log("remove square", d, $direction);
      if ($direction) {
        $node.removeChild($direction);
      }
    });
  }
  store.addSelectedListener((nextSelectedThingIds) => {
    // console.log("[PAGE]run - addSelectedListener callback");
    for (let i = 0; i < createdThingElements.length; i += 1) {
      const { id, thing, $node } = createdThingElements[i];
      if (!nextSelectedThingIds.includes(id)) {
        disableTransform(id, thing, $node);
        continue;
      }
      enabledTransform(id, thing, $node);
    }
  });
  store.addRangeSelectionListener((nextRange) => {
    const $range = document.getElementById("range");
    if (!$range) {
      return;
    }
    const { width, height, left, top } = nextRange;
    $range.style.cssText = `width: ${width}px; height: ${height}px; left: ${left}px; top: ${top}px`;
  });
  store.addLinesListener((nextLines) => {
    const $existing1 = document.getElementById("horizontal");
    if ($existing1) {
      $canvas.removeChild($existing1);
    }
    const $existing2 = document.getElementById("vertical");
    if ($existing2) {
      $canvas.removeChild($existing2);
    }
    const $lines: HTMLDivElement[] = [];
    for (let i = 0; i < nextLines.length; i += 1) {
      const line = nextLines[i];
      const { type, length, origin } = line;
      if (type === LineDirectionTypes.Horizontal) {
        const $line = document.createElement("div");
        const $existing01 = document.getElementById("horizontal");
        if (!$existing01) {
          $line.id = "horizontal";
          $line.style.cssText = `position: absolute; z-index: 101; background-color: #ff00cc; top: ${line.y}px; left: ${origin}px; width: ${length}px; height: 1px;`;
          $lines.push($line);
        }
      }
      if (type === LineDirectionTypes.Vertical) {
        const $line = document.createElement("div");
        const $existing02 = document.getElementById("vertical");
        if (!$existing02) {
          $line.id = "vertical";
          $line.style.cssText = `position: absolute; z-index: 101; background-color: #ff00cc; left: ${line.x}px; top: ${origin}px; height: ${length}px; width: 1px;`;
          $lines.push($line);
        }
      }
    }
    for (let i = 0; i < $lines.length; i += 1) {
      $canvas.appendChild($lines[i]);
    }
  });
  listen(
    "mousemove",
    ({ clientX, clientY }) => {
      store.setCursorPosition({
        x: clientX,
        y: clientY,
      });
    },
    $canvas
  );
  listen(
    "mousedown",
    ({ clientX, clientY }) => {
      let selecting = true;
      let invokedStartRangeSelect = false;
      let initial = { clientX, clientY };
      const moveHandler = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        if (selecting === false) {
          return;
        }
        if (!invokedStartRangeSelect) {
          store.startRangeSelect({
            x: initial.clientX,
            y: initial.clientY,
          });
          invokedStartRangeSelect = true;
        }
        store.rangeSelect({
          x: clientX,
          y: clientY,
        });
      };
      const unlisten3 = listen("mousemove", moveHandler);
      const upHandler = () => {
        selecting = false;
        invokedStartRangeSelect = false;
        console.log("end select");
        store.endRangeSelect();
        unlisten3();
      };
      listen("mouseup", upHandler, document, true);
    },
    $canvas
  );
  $canvas.addEventListener("mouseup", () => {
    store.clearSelectedThings();
  });
  if ($btnAddingText) {
    $btnAddingText.addEventListener("click", () => {
      store.addThing(
        {
          type: CanvasThingTypes.Text,
          data: {
            placeholder: "请编辑文本",
          },
        },
        {
          client: {
            left: 120,
            top: 120,
            width: 120,
            height: 24,
          },
        }
      );
    });
  }
  if ($inputImage) {
    $inputImage.addEventListener("change", (event) => {
      // @ts-ignore
      if (event?.target?.files === null) {
        return;
      }
      // @ts-ignore
      const file = event.target.files[0];
      const url = URL.createObjectURL(file);
      const $image = document.createElement("img");
      $image.src = url;
      $image.onload = () => {
        const { naturalHeight: height, naturalWidth: width } = $image;
        store.addThing(
          {
            type: CanvasThingTypes.Image,
            data: {
              url,
            },
          },
          {
            client: {
              left: 120,
              top: 120,
              ...getWidthAndHeight(
                {
                  width,
                  height,
                },
                { maxWidth: 360 }
              ),
            },
          }
        );
      };
    });
  }
  if ($btnHistoryUndo) {
    $btnHistoryUndo.addEventListener("click", () => {
      store.undo();
    });
  }
  if ($btnHistoryRedo) {
    $btnHistoryRedo.addEventListener("click", () => {
      store.redo();
    });
  }
}
