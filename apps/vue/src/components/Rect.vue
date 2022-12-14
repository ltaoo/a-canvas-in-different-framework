<script lang="ts">
import { RectShape } from "canvas-sdk";
import { CursorTypePrefix, getCursor } from "canvas-sdk/utils";

// const cursor = `${getCursor(angle + parentRotateAngle, d)}-resize`;
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
export default {
  props: ["rect", "selected"],
  data() {
    return {
      /** 尺寸位置信息 */
      client: this.$props.rect?.client,
      /** 可改变尺寸的方向 */
      directions: "n,s,e,w,ne,nw,se,sw".split(",").map((direction) => {
        const d = direction as CursorTypePrefix;
        const cursor = `${getCursor(this.$props.rect.client.angle, d)}-resize`;
        return {
          type: d,
          cursor,
          class: `${zoomableMap[d]} resizable-handler square`,
        };
      }),
    };
  },
  computed: {
    cursor() {
      return this.client;
    },
  },
  mounted() {
    //     console.log(this.$props.rect);
    const { rect } = this.$props;
    rect.addListener((nextValues: RectShape) => {
      //       console.log("[COMPONENT]Rect - listener", nextValues);
      this.client = nextValues;
    });
    console.log(rect);
  },
  methods: {
    handleMousedown(e: MouseEvent) {
      //       const { id, rect } = thing;
      const rect = this.$props.rect;
      //       console.log("[PAGE]Design - handleMousedown", id);
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
        rect.drag({
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
    },
    startResize(event: MouseEvent, cursor: string) {
      if (event.button !== 0) {
        return;
      }
      const instance = this.$props.rect;
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
      const onMove = (e: MouseEvent) => {
        // patch: fix windows press win key during mouseup issue
        e.stopImmediatePropagation();
        const { clientX, clientY } = e;
        const isShiftKey = e.shiftKey;
        const rect = instance.resize({
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
        instance.endResize();
      };
      document.addEventListener("mouseup", onUp);
    },
  },
};
</script>

<template>
  <div
    :class="{ rect: true, bordered: selected }"
    :style="{
      zIndex: client.index,
      left: `${client.left}px`,
      top: `${client.top}px`,
      width: `${client.width}px`,
      height: `${client.height}px`,
    }"
    @mousedown="handleMousedown"
  >
    <slot></slot>
    <template
      v-if="selected"
      v-for="direction in directions"
      :key="direction.type"
    >
      <div
        :style="{ cursor: direction.cursor }"
        :class="direction.class"
        @mousedown="startResize($event, direction.cursor)"
      ></div>
    </template>
  </div>
</template>

<style scoped lang="less">
.rect {
  position: absolute;
  border: 1px solid transparent;

  &.bordered {
    border: 1px solid #eb5648;
  }

  .square {
    position: absolute;
    width: 7px;
    height: 7px;
    background: white;
    border: 1px solid #eb5648;
    border-radius: 1px;
  }
  .resizable-handler {
    position: absolute;
    cursor: pointer;
    z-index: 102;
    // left-top
    &.tl {
      left: -8px;
      top: -8px;
    }
    // right-top
    &.tr {
      right: -8px;
      top: -8px;
    }
    // bottom-left
    &.bl {
      left: -8px;
      bottom: -8px;
    }
    // bottom-right
    &.br {
      right: -8px;
      bottom: -8px;
    }
    // top
    &.n {
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
    }
    // bottom
    &.s {
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
    }
    // right
    &.e {
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
    }
    // left
    &.w {
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .rotate {
    position: absolute;
    left: 50%;
    top: -32px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
    cursor: pointer;
    transform: translateX(-50%);
  }
}
</style>
