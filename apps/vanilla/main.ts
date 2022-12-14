import { main } from "./run";

import "./index.less";

const render = () => {
  const $container = document.querySelector("#root");
  if ($container === null) {
    return;
  }
  $container.innerHTML = `
<div class="page">
  <div class="page__content">
    <div class="tools flex">
      <div class="flex left">
        <img class="logo--vanilla" src="https://plainjs.com/apple-touch-icon-60x60.png" alt="vanilla" />
        <div class="btns history">
          <div id="btn-history-undo" class="btn btn--icon">
            <svg width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M20 10H7.815l3.587-3.586L10 5l-6 6l6 6l1.402-1.415L7.818 12H20a6 6 0 0 1 0 12h-8v2h8a8 8 0 0 0 0-16Z"/></svg>
          </div>
          <div id="btn-history-redo" class="btn btn--icon">
            <svg width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M12 10h12.185l-3.587-3.586L22 5l6 6l-6 6l-1.402-1.415L24.182 12H12a6 6 0 0 0 0 12h8v2h-8a8 8 0 0 1 0-16Z"/></svg>
          </div>
        </div>
      </div>
      <div class="btns">
        <div id="btn-add-text" class="btn btn--icon">
          <svg width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M25 12h-5v2h5a1 1 0 0 1 1 1v2h-4a3.003 3.003 0 0 0-3 3v1a3.003 3.003 0 0 0 3 3h6v-9a3.003 3.003 0 0 0-3-3zm-3 10a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h4v3zm-6 2h2L12 7h-2L4 24h2l1.694-5h6.613zm-7.629-7l2.497-7.371h.266L13.63 17z"/></svg>
        </div>
        <div id="btn-add-image" class="btn btn--icon">
          <svg width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M19 14a3 3 0 1 0-3-3a3 3 0 0 0 3 3Zm0-4a1 1 0 1 1-1 1a1 1 0 0 1 1-1Z"/><path fill="currentColor" d="M26 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 22H6v-6l5-5l5.59 5.59a2 2 0 0 0 2.82 0L21 19l5 5Zm0-4.83l-3.59-3.59a2 2 0 0 0-2.82 0L18 19.17l-5.59-5.59a2 2 0 0 0-2.82 0L6 17.17V6h20Z"/></svg>
          <input id="input-image" class="btn__input" type="file" accept=".png,.jpg,.jpeg" />
        </div>
      </div>
      <div class="btns"></div>
    </div>
    <div id="canvas" class="canvas">
      <div id="range" class="canvas__range-selection"></div>
    </div>
  </div>
</div>
`;
  main();
  return Promise.resolve();
};

const appName = "vanilla";
((global) => {
  // @ts-ignore
  global[appName] = {
    bootstrap: () => {
      // console.log(`${appName} bootstrap`);
      return Promise.resolve();
    },
    mount: () => {
      // console.log(`${appName} mount`);
      return render();
    },
    unmount: () => {
      // console.log(`${appName} unmount`);
      return Promise.resolve();
    },
  };
  // @ts-ignore
  // console.log("[ROOT]vanilla - initial", global.__RICH__);
  // @ts-ignore
  if (global.__RICH__) {
    // @ts-ignore
    global[appName].mount();
    return;
  }
  // @ts-ignore
  global[appName].mount();
})(window);
