# 一个可以在任何框架都能使用的画布功能

## 概述

在[https://zhuanlan.zhihu.com/p/589768794](《如何写视图无关的前端代码》) 一文中，我提到实现业务逻辑时将实现与视图严格分离，也许仍有许多人觉得只有和后端接口有关的「业务逻辑」才能这样做，但实际上所有代码都是可以的。

本项目就是如此，一个和页面 `DOM` 操作息息相关的功能，也可以做到完全的分离，使其适用于任何框架，甚至是任何端，只要能运行 `JavaScript`。

> 本项目仅做演示，表达的还是业务与视图严格分离的可行性。具体的实现还有许多可优化的方向。抛砖引玉，给大家另一个写代码的思路与方向。

## 目前实现的功能

1. 新增文本、图片
2. 修改文本、图片内容（目前仅 React 实现了视图）
3. 移动、缩放、旋转内容
4. 参考线吸附
5. 框选
6. 撤销与重做（仅支持新增、删除、移动缩放等操作）
7. 内容层级调整

## 各端核心代码

### React

```react
const store = new CanvasDomain();
const Page = () => {
  const [values, setValues] = useState(store.values);
  const [selectedContentIds, setSelectedContentIds] = useState(
    store.selectedThingIds
  );
  const [rangeSelection, setRangeSelection] = useState(store.rangeSelection);
  const [lines, setLines] = useState(store.lines);
  const [history, setHistory] = useState(store.history.values);

  useEffect(() => {
    // 监听物体数量、位置、尺寸等状态改变
    store.addListener((nextValues) => {
      // console.log("[PAGE]DesignPage - on store values change", nextValues);
      setValues(nextValues);
    });
    // 监听选中的内容
    store.addSelectedListener((nextSelectedContent) => {
      setSelectedContentIds(nextSelectedContent);
    });
    // 监听选框
    store.addRangeSelectionListener((nextRangeSelection) => {
      setRangeSelection(nextRangeSelection);
    });
    // 监听辅助线
    store.addLinesListener((nextLines) => {
      setLines(nextLines);
    });
  }, []);

  return (
    <div></div>
  );
}
```

### Vue

```
const store = new CanvasDomain();
export default {
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
  },
}
```

### 原生 JavaScript

原生部分由于自己实现节点对比等逻辑代码量比较多，这里就不贴了，但核心逻辑是一样的，监听来自业务层的状态变化，决定要如何渲染视图。
