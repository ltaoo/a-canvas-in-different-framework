import { useCallback, useEffect, useState } from "react";
import { navigateToUrl } from "rich";
import { PATHNAME_BASE } from "./constants";

function App() {
  const [mainVisible, setMainVisible] = useState(true);

  const goto = (url: string) => {
    setMainVisible(false);
    navigateToUrl(url);
  };
  const showMainPage = useCallback(() => {
    navigateToUrl(`${PATHNAME_BASE}/`);
    setMainVisible(true);
  }, []);

  useEffect(() => {
    const { pathname } = window.location;
    if (pathname === `${PATHNAME_BASE}/`) {
      return;
    }
    goto(pathname);
  }, []);

  return (
    <div>
      <div className="page__header">
        <h2>一个可以在任何框架都能使用的画布功能</h2>
        <div className="buttons">
          <div
            className="button"
            onClick={() => {
              showMainPage();
            }}
          >
            main
          </div>
          <div
            className="button"
            onClick={() => {
              goto(`${PATHNAME_BASE}/react`);
            }}
          >
            react example
          </div>
          <div
            className="button"
            onClick={() => {
              goto(`${PATHNAME_BASE}/vue`);
            }}
          >
            vue example
          </div>
          <div
            className="button"
            onClick={() => {
              goto(`${PATHNAME_BASE}/vanilla`);
            }}
          >
            vanilla example
          </div>
        </div>
      </div>
      {!mainVisible && <div id="root"></div>}
      {mainVisible && (
        <section className="page__article">
          <h3>概述</h3>
          <p>
            在
            <a
              href="https://zhuanlan.zhihu.com/p/589768794"
              rel="noopener noreferrer"
              target="_blank"
            >
              《如何写视图无关的前端代码》
            </a>
            一文中，我提到实现业务逻辑时将实现与视图严格分离，也许仍有许多人觉得只有和后端接口有关的「业务逻辑」才能这样做，但实际上所有代码都是可以的。
          </p>
          <p>
            本项目就是如此，一个和页面 `DOM`
            操作息息相关的功能，也可以做到完全的分离，使其适用于任何框架，甚至是任何端，只要能运行
            `JavaScript`。
          </p>
          <p>点击上方按钮，可切换至对应框架。</p>
          <p>
            所有框架功能都是相同的，只是 `React`
            实现了更多的视图部分，对接了更多的状态展示与能力。
          </p>
          <p>
            本项目仅做演示，具体的实现还有许多可优化的方向。抛砖引玉，给大家另一个写代码的思路与方向。
          </p>
          <h3>目前实现的功能</h3>
          <ul>
            <li>新增文本、图片</li>
            <li>修改文本、图片内容（目前仅 React 实现了视图）</li>
            <li>移动、缩放、旋转内容</li>
            <li>参考线吸附</li>
            <li>框选</li>
            <li>撤销与重做（仅支持新增、删除、移动缩放等操作）</li>
            <li>内容层级调整</li>
          </ul>
          <h3>各端核心代码</h3>
          <h4>React</h4>
          <pre>
            {`
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
`}
          </pre>
          <h4>Vue</h4>
          <pre>
            {`
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
`}
          </pre>
          <h4>原生 JavaScript</h4>
          <p>
            原生部分由于自己实现 `DOM`
            对比等逻辑代码量比较多，这里就不贴了，但核心逻辑是一样的，监听来自业务层的状态变化，决定要如何渲染视图。
          </p>
        </section>
      )}
    </div>
  );
}

export default App;
