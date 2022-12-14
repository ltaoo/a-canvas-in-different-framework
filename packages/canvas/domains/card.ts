/** 暴露指定位数小数点 */
function round(num: number, fix = 3) {
  return parseFloat(num.toFixed(fix));
}
/**  */
function clamp(num: number, min = -20, max = 20) {
  return Math.min(Math.max(num, min), max);
}

function _typeof(obj: unknown) {
  return (
    (_typeof =
      "function" === typeof Symbol && "symbol" === typeof Symbol.iterator
        ? function (obj) {
            return typeof obj;
          }
        : function (obj) {
            return obj &&
              "function" === typeof Symbol &&
              obj.constructor === Symbol &&
              obj !== Symbol.prototype
              ? "symbol"
              : typeof obj;
          }),
    _typeof(obj)
  );
}
function noop() {}
function subscribe(store) {
  if (store === null) {
    return noop;
  }
  var _len = arguments.length;
  var callbacks = [];
  var _key = 1;
  for (; _key < _len; _key++) {
    callbacks[_key - 1] = arguments[_key];
  }
  var unsub = store.subscribe.apply(store, callbacks);
  return unsub.unsubscribe
    ? function () {
        return unsub.unsubscribe();
      }
    : unsub;
}
function run(fn) {
  return fn();
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function get_store_value(store) {
  var value;
  subscribe(store, function (_) {
    return (value = _);
  })();
  return value;
}

// const is_client = typeof window !== 'undefined';
function now() {
  return Date.now();
}
function raf(cb) {
  Date.requestAnimationFrame(cb);
}
// used internally for testing
var tasks = [];
function run_tasks(now) {
  // console.log('[]run_tasks');
  tasks.forEach(function (task) {
    if (!task.c(now)) {
      var index = tasks.indexOf(task);
      tasks = tasks.slice(0, index).concat(tasks.slice(index + 1));
      task.f();
    }
  });
  if (tasks.length !== 0) raf(run_tasks);
}
function loop(runner) {
  // console.log('[]loop');
  var task;
  if (tasks.length === 0) {
    raf(run_tasks);
  }
  return {
    // 添加任务？
    promise: function (fulfill) {
      task = {
        c: runner,
        f: fulfill,
      };
      tasks.push(task);
    },
    abort: function abort() {
      var index = tasks.indexOf(task);
      tasks = tasks.slice(0, index).concat(tasks.slice(index + 1));
      // tasks.delete(task);
    },
  };
}

/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */

function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number") {
    // @ts-ignore
    const delta = target_value - current_value;
    // @ts-ignore
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
    const spring = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring - damper) * ctx.inv_mass;
    const d = (velocity + acceleration) * ctx.dt;
    if (
      Math.abs(d) < ctx.opts.precision &&
      Math.abs(delta) < ctx.opts.precision
    ) {
      return target_value; // settled
    } else {
      ctx.settled = false; // signal loop to keep ticking
      // @ts-ignore
      return current_value + d;
    }
  } else if (_typeof(current_value) === "array") {
    // @ts-ignore
    return current_value.map((_, i) =>
      tick_spring(ctx, last_value[i], current_value[i], target_value[i])
    );
  } else if (typeof current_value === "object") {
    var next_value = {};
    var keys = ["x", "y"];
    for (let i = 0; i < keys.length; i += 1) {
      var k = keys[i];
      next_value[k] = tick_spring(
        ctx,
        last_value[k],
        current_value[k],
        target_value[k]
      );
    }
    return next_value;
  } else {
    // throw new Error(`Cannot spring ${typeof current_value} values`);
    return "error";
  }
}

/**
 * 动画缓动函数？
 */
function spring(value) {
  var opts =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var store = value;
  // var store = writable(value);
  var _opts_stiffness = opts.stiffness,
    stiffness = _opts_stiffness === void 0 ? 0.15 : _opts_stiffness,
    _opts_damping = opts.damping,
    damping = _opts_damping === void 0 ? 0.8 : _opts_damping,
    _opts_precision = opts.precision,
    precision = _opts_precision === void 0 ? 0.01 : _opts_precision;
  var last_time = 0;
  var task;
  var current_token;
  var last_value = value;
  var target_value = value;
  var inv_mass = 1;
  var inv_mass_recovery_rate = 0;
  var cancel_task = false;
  function set(new_value, ccbb) {
    // console.log('[]sprint set');
    var opts =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    target_value = new_value;
    var token = (current_token = {});
    if (
      value === null ||
      opts.hard ||
      (spring.stiffness >= 1 && spring.damping >= 1)
    ) {
      cancel_task = true; // cancel any running animation
      last_time = now();
      last_value = new_value;
      // store.set((value = target_value));
      value = target_value;
      store = value;
      // console.log('update value', value);
      ccbb(store);
    } else if (opts.soft) {
      var rate = opts.soft === true ? 0.5 : +opts.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0; // infinite mass, unaffected by spring forces
    }

    if (!task) {
      last_time = now();
      cancel_task = false;
      // 创建了一个任务，但没有执行
      task = loop(function (now) {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        var ctx = {
          inv_mass: inv_mass,
          opts: spring,
          settled: true,
          dt: ((now - last_time) * 60) / 1000,
        };
        var next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now;
        last_value = value;
        value = next_value;
        store = value;
        // console.log('compute result', JSON.stringify(value));
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    task.promise(function () {
      if (token == current_token) {
        ccbb(store);
      }
    });
  }
  var spring = {
    set: set,
    update: function update(fn, opts) {
      return set(fn(target_value, value), opts);
    },
    subscribe: store.subscribe,
    stiffness: stiffness,
    damping: damping,
    precision: precision,
  };
  return spring;
}

var springR = { stiffness: 0.066, damping: 0.25 };
var springD = { stiffness: 0.033, damping: 0.45 };
var springRotate = spring({ x: 0, y: 0 }, springR);
var springGlare = spring({ x: 50, y: 50, o: 0 }, springR);
var springBackground = spring({ x: 50, y: 50 }, springR);
var springRotateDelta = spring({ x: 0, y: 0 }, springD);
var springTranslate = spring({ x: 0, y: 0 }, springD);
var springScale = spring(1, springD);

// springRotate.subscribe(function (v) {
//     this.setData({
//         springRotate: v
//     });
// });

/**
 * 根据一些参数，计算出样式变量
 * @param springGlare
 * @param springTranslate
 * @param springScale
 * @param springRotate
 * @param springRotateDelta
 * @param springBackground
 * @returns
 */
function computeStyle(
  springGlare,
  springTranslate,
  springScale,
  springRotate,
  springRotateDelta,
  springBackground
) {
  return "\n    --mx: "
    .concat(springGlare.x, "%;\n    --my: ")
    .concat(springGlare.y, "%;\n    --tx: ")
    .concat(springTranslate.x, "px;\n    --ty: ")
    .concat(springTranslate.y, "px;\n    --s: ")
    .concat(springScale, ";\n    --o: ")
    .concat(springGlare.o, ";\n    --rx: ")
    .concat(springRotate.x + springRotateDelta.x, "deg;\n    --ry: ")
    .concat(springRotate.y + springRotateDelta.y, "deg;\n    --pos: ")
    .concat(springBackground.x, "% ")
    .concat(springBackground.y, "%;\n    --posx: ")
    .concat(springBackground.x, "%;\n    --posy: ")
    .concat(springBackground.y, "%;\n    --hyp: ")
    .concat(
      Math.sqrt(
        (springGlare.y - 50) * (springGlare.y - 50) +
          (springGlare.x - 50) * (springGlare.x - 50)
      ) / 50,
      ";\n"
    );
}
function update(v) {
  console.log(v);
}
export function touchstart(event: TouchEvent, ins: unknown) {
  //   Date.requestAnimationFrame = ins.requestAnimationFrame;
  // console.log('----');
  // console.log(ins.requestAnimationFrame);
  // console.log(Date.requestAnimationFrame);
  // console.log('---- end ----');
  // springRotate.subscribe(update);
}

/**
 * 鼠标移动
 */
export function touchmove(event: TouchEvent | MouseEvent, rect: DOMRect) {
  const point = (() => {
    if (event.type === "touchmove") {
      const e = event as TouchEvent;
      const ee = e.touches[0] || e.changedTouches[0];
      return {
        clientX: ee.clientX,
        clientY: ee.clientY,
      };
    }
    const e = event as MouseEvent;
    return {
      clientX: e.clientX,
      clientY: e.clientY,
    };
  })() as {
    clientX: number;
    clientY: number;
  };
  console.log("[CORE]touchmove - point", point);
  //   var rect = ins.getBoundingClientRect();
  const leftTopPoint = {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  };
  // 鼠标/触点 在卡片上位置的百分比
  const percent = {
    x: round((100 / rect.width) * leftTopPoint.x),
    y: round((100 / rect.height) * leftTopPoint.y),
  };
  // 鼠标/触点 在卡片上中间位置
  const center = {
    x: percent.x - 50,
    y: percent.y - 50,
  };
  const springBackground = {
    x: round(50 + percent.x / 4 - 12.5),
    y: round(50 + percent.y / 3 - 16.67),
  };
  const springRotate = {
    x: round(-(center.x / 3.5)),
    y: round(center.y / 2),
  };
  const springScale = 1;
  const springGlare = {
    x: percent.x,
    y: percent.y,
    o: 1,
  };
  const springTranslate = {
    x: 0,
    y: 0,
  };
  const springRotateDelta = {
    x: 0,
    y: 0,
  };
  const styles = computeStyle(
    springGlare,
    springTranslate,
    springScale,
    springRotate,
    springRotateDelta,
    springBackground
  );
  console.log("[CORE]card - touchmove styles result", styles);
  //   ins.callMethod("log", {
  //     x: springRotate.x,
  //   });
  //   ins.setStyle(styles);
  return styles;
}
export function touchend(event: TouchEvent, ins: unknown) {
  console.log("recover");
  var springBackground = {
    x: 0,
    y: 0,
  };
  var springRotate = {
    x: 0,
    y: 0,
  };
  var springScale = 1;
  var springGlare = {
    x: 0,
    y: 0,
    o: 1,
  };
  var springTranslate = {
    x: 0,
    y: 0,
  };
  var springRotateDelta = {
    x: 0,
    y: 0,
  };
  // var styles = computeStyle(springGlare, springTranslate, springScale, springRotate, springRotateDelta, springBackground);
  // ins.setStyle(styles);
}
// export default {
//   touchstart: touchstart,
//   interact: touchmove,
//   touchend: touchend,
// };
