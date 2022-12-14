/**
 * @file 注册快捷键，以及当前正按着什么键
 */
import hotkeys from "hotkeys-js";

import { CanvasDomain, Directions } from "canvas-sdk";

export const pressingKeys: {
  hasShift: boolean;
} = {
  hasShift: false,
};
let unregister: null | (() => void) = null;
export function registerHotkeys(instance: CanvasDomain) {
  if (unregister) {
    return unregister;
  }
  const keydownHandler = (event: KeyboardEvent) => {
    // console.log(event);
    const { key } = event;
    if (key === "Meta") {
      pressingKeys.hasShift = true;
    }
  };
  const keyupHandler = () => {
    if (pressingKeys.hasShift) {
      pressingKeys.hasShift = false;
    }
  };
  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler);
  hotkeys("left", () => {
    instance.moveThingsByStepInDirection(Directions.Left, 5);
  });
  hotkeys("up", () => {
    instance.moveThingsByStepInDirection(Directions.Top, 5);
  });
  hotkeys("down", () => {
    instance.moveThingsByStepInDirection(Directions.Bottom, 5);
  });
  hotkeys("right", () => {
    instance.moveThingsByStepInDirection(Directions.Right, 5);
  });
  hotkeys("backspace", (event, handler) => {
    event.preventDefault();
    console.log("[UTILS]hotkeys - press backspace");
    instance.removeSelectedThings();
  });
  hotkeys("ctrl+up, command+up", (event, handler) => {
    event.preventDefault();
    instance.upSelectedThings();
    // return false;
  });
  // hotkeys("ctrl+left", (event, handler) => {
  //   event.preventDefault();
  //   // frontCanvasInstance.removeCurrentSelectedContents();
  //   alert("Ctrl+ArrowLeft");
  // });
  // hotkeys("g", (event, handler) => {
  //   event.preventDefault();
  //   frontCanvasInstance.groupSelectedContents(
  //     frontCanvasInstance.selectedContentIds
  //   );
  // });
  unregister = () => {
    document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("keyup", keyupHandler);
  };
  return unregister;
}
