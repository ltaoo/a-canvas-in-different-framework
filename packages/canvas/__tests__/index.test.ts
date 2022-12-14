import { expect, test } from "vitest";

import { CanvasDomain, CanvasThingTypes } from "../index";

test("should work as expected", () => {
  expect(Math.sqrt(4)).toBe(2);
});

// 改变物体层级关系
test("up things as expected", () => {
  const store = new CanvasDomain();
  store.addThing({
    type: CanvasThingTypes.Text,
    data: {
      placeholder: "test1",
    },
  });
  store.addThing({
    type: CanvasThingTypes.Text,
    data: {
      placeholder: "test2",
    },
  });
  store.addThing({
    type: CanvasThingTypes.Text,
    data: {
      placeholder: "test3",
    },
  });
  const { things } = store.values;
  expect(things.length).toBe(3);
  expect(things[0].rect.client.index).toBe(0);
  expect(things[1].rect.client.index).toBe(1);
  expect(things[2].rect.client.index).toBe(2);
  // 将第一个的层级往上提
  store.upThings([things[0].id]);
  const { things: nextThings } = store.values;
  // console.log(nextThings);
  expect(nextThings[0].rect.client.index).toBe(1);
  expect(nextThings[1].rect.client.index).toBe(0);
  expect(nextThings[2].rect.client.index).toBe(2);
});
