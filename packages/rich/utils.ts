export function loadJs(src: string, cb: Function) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;

    document.documentElement.appendChild(script);

    script.onload = () => {
      if (cb) {
        cb(null);
      }
      resolve(script);
    };
    script.onerror = (error) => {
      if (cb) {
        cb(error, null);
      }
      reject();
    };
  });
}

export function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head!.appendChild(script);
  });
}
