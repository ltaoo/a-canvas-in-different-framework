<script lang="ts">
import {
  CanvasDomain,
  CanvasThingShape,
  CanvasThingTypes,
  LineDirectionTypes,
} from "canvas-sdk";
import { getWidthAndHeight } from "utils";
import { listen } from "utils/dom";

import { registerHotkeys } from "./hotkeys";
import IconUndo from "../components/icons/undo.vue";
import IconRedo from "../components/icons/redo.vue";
import IconImage from "../components/icons/image.vue";
import IconFont from "../components/icons/font.vue";
import Rect from "../components/Rect.vue";

const store = new CanvasDomain();

export default {
  components: { Rect, IconUndo, IconRedo, IconImage, IconFont },
  data() {
    return {
      store,
      things: store.values.things,
      selectedIds: store.selectedThingIds,
      range: store.rangeSelection,
      lines: store.lines,
      CanvasThingTypes,
      LineDirectionTypes,
    };
  },
  unregisterHotkeys: null,
  mounted() {
    // @ts-ignore
    this.unregisterHotkeys = registerHotkeys(store);
    store.addListener((nextValues) => {
      console.log("[PAGE]design - listener", nextValues);
      this.$data.things = nextValues.things;
      this.$forceUpdate();
    });
    store.addSelectedListener((nextSelectedIds) => {
      // console.log("[PAGE]design - listener", nextValues);
      this.$data.selectedIds = nextSelectedIds;
    });
    store.addRangeSelectionListener((nextRange) => {
      // console.log("[PAGE]design - listener", nextRange);
      this.$data.range = { ...nextRange };
      this.$forceUpdate();
    });
    store.addLinesListener((nextLines) => {
      // console.log("[PAGE]design - listen lines", nextLines);
      this.$data.lines = nextLines;
      this.$forceUpdate();
    });
    const $canvas = this.$refs.$canvas as HTMLDivElement;
    store.setCanvasClient($canvas.getBoundingClientRect());
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
          store.endRangeSelect();
          unlisten3();
        };
        listen("mouseup", upHandler, document, true);
      },
      $canvas
    );
  },
  unmounted() {
    // @ts-ignore
    if (this.unregisterHotkeys) {
      // @ts-ignore
      this.unregisterHotkeys();
    }
  },
  methods: {
    addTextThing() {
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
    },
    addImageThing(event: { target: { files: File[] } }) {
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
    },
    handleMousedown(thing: CanvasThingShape) {
      const { id } = thing;
      const curThing = store.findThingById(id);
      console.log(curThing);
      if (curThing && curThing.rect.locking) {
        return;
      }
      if (store.selectedThingIds.length > 1) {
        return;
      }
      store.selectThing(id);
    },
    handleCanvasMouseup() {
      store.clearSelectedThings();
    },
    handleMouseup() {
      console.log("[PAGE]Design - handleMouseup");
    },
  },
};
</script>

<template>
  <div class="page">
    <div class="page__content">
      <div class="tools flex">
        <div class="flex left">
          <img class="logo--vue" src="https://vuejs.org/logo.svg" alt="vue" />
          <div class="btns history">
            <div class="btn btn--icon" @click="store.undo">
              <IconUndo class="btn__icon" />
            </div>
            <div class="btn btn--icon" @click="store.redo">
              <IconRedo class="btn__icon" />
            </div>
          </div>
        </div>
        <div class="btns">
          <div class="btn btn--icon" v-bind:onClick="addTextThing">
            <IconFont class="btn__icon" />
          </div>
          <div class="btn btn--icon">
            <IconImage class="btn__icon" />
            <input
              class="btn__input"
              type="file"
              accept=".png,.jpg,.jpeg"
              @input="addImageThing"
            />
          </div>
        </div>
        <div class="btns">
          <div></div>
        </div>
      </div>
      <div ref="$canvas" class="canvas" @mouseup="handleCanvasMouseup">
        <template v-for="thing in things">
          <Rect
            :id="thing.id"
            :rect="thing.rect"
            :selected="selectedIds.includes(thing.id)"
            @mousedown="handleMousedown(thing)"
          >
            <div v-if="thing.type === CanvasThingTypes.Text" class="text">
              {{ thing.data.values.value }}
            </div>
            <img
              v-if="thing.type === CanvasThingTypes.Image"
              class="canvas__image"
              :src="thing.data.values.url"
            />
          </Rect>
        </template>
        <div
          class="canvas__range-selection"
          :style="{
            left: `${range?.left}px`,
            top: `${range?.top}px`,
            width: `${range?.width}px`,
            height: `${range?.height}px`,
          }"
        ></div>
        <template v-for="line in lines">
          <span
            v-if="line.type === LineDirectionTypes.Horizontal"
            class="line"
            :style="{
              top: `${line.y}px`,
              left: `${line.origin}px`,
              width: `${line.length}px`,
              height: '1px',
            }"
          ></span>
          <span
            v-if="line.type === LineDirectionTypes.Vertical"
            class="line"
            :style="{
              left: `${line.x}px`,
              top: `${line.origin}px`,
              height: `${line.length}px`,
              width: '1px',
            }"
          ></span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
body {
  margin: 0;
}

.page {
  display: flex;
  width: 100vw;
  height: 100vh;

  &__content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  &__extra {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 360px;
    border-left: 1px solid #eee;
    background-color: #fff;
  }
}

.logo--vue {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.settings {
  height: 100%;
}

.tools {
  position: relative;
  border-bottom: 1px solid #eee;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 10px;
  font-size: 13px;
  user-select: none;
}
.canvas {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  user-select: none;
  overflow: hidden;
  background-color: #f9f9f9;

  &__image {
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
  }
  &__range-selection {
    position: absolute;
    z-index: 999;
    border: 1px solid blue;
    background-color: aqua;
    opacity: 0.4;
  }
}

.btns {
  display: flex;
  align-items: center;
}
.btn {
  z-index: 1;
  position: relative;
  margin-right: 8px;
  color: #080808;
  cursor: pointer;

  &:last-child {
    margin-right: 0;
  }
  &--icon {
    padding: 8px;
    border-radius: 4px;

    &:hover {
      background-color: #ececec;
    }
  }
  &--disabled {
    color: #999;
    cursor: not-allowed;
  }

  &__icon {
    font-size: 24px;
  }
  &__input {
    z-index: 0;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
}

.history {
  color: #999;

  &--active {
    color: #080809;
  }

  &__card {
    display: flex;
    align-items: center;
    padding: 12px 0;
  }
  &__icon {
    margin-right: 8px;
    font-size: 24px;
  }
}

.layer {
  padding: 12px 24px;
  margin-bottom: 8px;
  cursor: pointer;

  &:last-child {
    margin-bottom: 0;
  }

  &--active {
    background-color: #999;
  }
}

.line {
  position: absolute;
  z-index: 101;
  background-color: #ff00cc;
}

.flex {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .left {
    justify-content: flex-start;
  }
}
</style>
