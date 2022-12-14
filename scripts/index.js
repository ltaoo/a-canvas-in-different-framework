const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const PATHNAME_BASE = "/a-canvas-in-different-framework";
const apps = [
  {
    name: "vue",
    entry: "./apps/vue",
    activeRule: `${PATHNAME_BASE}/vue`,
  },
  {
    name: "react",
    entry: "./apps/react",
    activeRule: `${PATHNAME_BASE}/react`,
  },
  {
    name: "vanilla",
    entry: "./apps/vanilla",
    activeRule: `${PATHNAME_BASE}/vanilla`,
  },
];
const ASSETS_DIR = "dist/assets";

/** 找到所有静态资源 */
async function findAllAssets() {
  const assetsInApp = [];
  for (let i = 0; i < apps.length; i += 1) {
    const { name, entry, activeRule } = apps[i];
    const assetDir = path.resolve(entry, ASSETS_DIR);
    assetsInApp.push(
      promisify(fs.readdir)(assetDir).then((result) => {
        return {
          name,
          activeRule,
          assets: result.map((filepath) => {
            return {
              path: path.resolve(assetDir, filepath),
              name: filepath,
            };
          }),
        };
      })
    );
  }

  const result = await Promise.all(assetsInApp);
  return result;
}

function createAppPayload(filepath, content) {
  return promisify(fs.writeFile)(filepath, content);
}

(async () => {
  const apps = await findAllAssets();
  const mainProjectAssetsDir = path.resolve("./apps/main", ASSETS_DIR);
  const targetFilepaths = [];
  const payload = [];
  for (let i = 0; i < apps.length; i += 1) {
    const { name, assets, activeRule } = apps[i];
    let copy = [];
    for (let j = 0; j < assets.length; j += 1) {
      const asset = assets[j];
      copy.push({
        from: asset.path,
        to: path.resolve(mainProjectAssetsDir, name, asset.name),
        relative: path.join(
          "/a-canvas-in-different-framework",
          "/assets",
          "/",
          name,
          asset.name
        ),
      });
    }
    targetFilepaths.push(...copy);
    payload.push({
      name,
      activeRule,
      assets: copy.map((c) => c.relative),
    });
    copy = [];
  }
  for (let i = 0; i < targetFilepaths.length; i += 1) {
    const { from, to } = targetFilepaths[i];
    ensure(to);
    fs.copyFileSync(from, to);
  }
  const settingsFilepath = path.resolve(mainProjectAssetsDir, "configure.js");
  ensure(settingsFilepath);
  console.log(settingsFilepath);
  fs.writeFileSync(
    settingsFilepath,
    `if ('__RICH__configure_callback_' in window) {window.__RICH__configure_callback_(${JSON.stringify(
      payload
    )})}`
  );
})();

function ensure(filepath, next = []) {
  const { ext, dir } = path.parse(filepath);
  const isFile = ext !== undefined && ext !== "";
  if (isFile) {
    filepath = dir;
  }
  try {
    fs.accessSync(filepath);
    if (next.length !== 0) {
      const theDirPrepareCreate = next.pop();
      fs.mkdirSync(theDirPrepareCreate);
      ensure(filepath, next);
    }
  } catch {
    const needToCreate = path.dirname(filepath);
    ensure(needToCreate, next.concat(filepath));
  }
}
