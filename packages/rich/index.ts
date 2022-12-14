export * from "./utils";

((global) => {
  // @ts-ignore
  global.__RICH__ = true;
})(window);

export function start() {
  const { pathname } = window.location;
  // console.log(pathname);
  if (!pathname) {
    return;
  }
  navigateToUrl(pathname);
}

interface AppConfig {
  /** 子应用名称 */
  name: string;
  /** 所有静态资源 */
  assets: string[];
  /** 激活规则 */
  activeRule: string;
}
let apps: AppConfig[] = [];
let registerCompleted = false;
let pendingNavigation: string | null = null;
const installedApps: Record<
  string,
  { running: boolean; nodes: HTMLElement[] }
> = {};
// @ts-ignore
window.__RICH_installedApps__ = installedApps;

export function registerMicroApps(configs: AppConfig[]) {
  registerCompleted = true;
  apps = apps.concat(configs);
  if (pendingNavigation === null) {
    return;
  }
  navigateToUrl(pendingNavigation);
  pendingNavigation = null;
}
export function navigateToUrl(url: string) {
  if (!registerCompleted) {
    pendingNavigation = url;
    return;
  }
  window.history.pushState(null, "", url);
  const matchedApp = apps.find((app) => app.activeRule === url);
  if (!matchedApp) {
    return;
  }
  // console.log("[ROOT]rich - navigateToUrl", url, matchedApp);
  const { name, assets } = matchedApp;
  const otherApps = apps.filter((app) => app.name !== name);
  for (let i = 0; i < otherApps.length; i += 1) {
    const { name } = otherApps[i];
    if (!installedApps[name]?.running) {
      continue;
    }
    // console.log("[ROOT]rich - unload inserted nodes", installedApps[name]);
    installedApps[name].nodes.forEach((node) => {
      document.body.removeChild(node);
    });
    installedApps[name].running = false;
    installedApps[name].nodes = [];
  }
  const installedApp = installedApps[name];
  if (installedApp?.running) {
    return;
  }
  installedApps[name] = installedApps[name] || {
    name,
    nodes: [],
    running: true,
  };
  assets.forEach((url) => {
    const type = url.split(".").pop();
    if (type === "js") {
      const node = document.createElement("script");
      node.src = url;
      // script.type = "module";
      window.document.body.appendChild(node);
      installedApps[name].nodes.push(node);
    }
    if (type === "css") {
      const node = document.createElement("link");
      node.rel = "stylesheet";
      node.type = "text/css";
      node.href = url;
      window.document.body.appendChild(node);
      installedApps[name].nodes.push(node);
    }
  });
}
// console.log("add pop state listener");
window.addEventListener("popstate", (event) => {
  console.log(event);
});
