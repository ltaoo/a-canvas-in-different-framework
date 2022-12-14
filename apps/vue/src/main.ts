import { createApp } from "vue";

import DesignPage from "./pages/design.vue";

import "./global.less";

const appName = "vue";
((global) => {
  // @ts-ignore
  global[appName] = {
    bootstrap: () => {
      // console.log(`${appName} bootstrap`);
      return Promise.resolve();
    },
    mount: () => {
      // console.log(`${appName} mount`);
      //       return render();
      createApp(DesignPage).mount("#root");
      return Promise.resolve();
    },
    unmount: () => {
      // console.log(`${appName} unmount`);
      return Promise.resolve();
    },
  };
  // @ts-ignore
  // console.log("[ROOT]vue - initial", global.__RICH__);
  // @ts-ignore
  if (global.__RICH__) {
    // @ts-ignore
    global[appName].mount();
    return;
  }
  // @ts-ignore
  global[appName].mount();
})(window);
