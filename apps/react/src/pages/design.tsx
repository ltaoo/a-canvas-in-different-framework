/**
 * @file 设计页面
 */
import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import { CanvasDomain, CanvasThingTypes, LineDirectionTypes } from "canvas-sdk";
import { listen } from "utils/dom";
import { getWidthAndHeight } from "utils";

import { pressingKeys, registerHotkeys } from "../hotkeys";
import Rect from "../components/Rect";
import {
  IconImage,
  IconFont,
  IconUndo,
  IconRedo,
  IconDeliveryAdd,
  IconStackedMove,
  IconRotateClockwise,
  IconFitToWidth,
  IconArrowUp,
  IconRowDelete,
} from "../components/icons";
import ScrollView from "../components/ScrollView";
import { CanvasOperationType } from "canvas-sdk/domains/history";
import Tabs from "../components/Tabs";
import ImageInRect from "../components/Image";
import TextInRect from "../components/Text";
import TextSettingsPanel from "../components/TextSettingsPanel";
import ImageUpload from "../components/ImageUpload";
import ImageSettingsPanel from "../components/ImageSettingPanel";
import Button from "../components/Button";

import "./index.less";

const store = new CanvasDomain();

const DesignPage = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
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
    // 监听历史记录
    store.addHistoryListener((nextHistory) => {
      setHistory(nextHistory);
    });
    const $canvas = canvasRef.current;
    if ($canvas === null) {
      return;
    }
    const unregisterHotkeys = registerHotkeys(store);
    const cursorPositionListen = listen(
      "mousemove",
      ({ clientX, clientY }) => {
        store.setCursorPosition({
          x: clientX,
          y: clientY,
        });
      },
      $canvas
    );
    const rangeSelectListen = listen(
      "mousedown",
      ({ clientX, clientY }) => {
        let selecting = true;
        let invokedStartRangeSelect = false;
        let initial = { clientX, clientY };
        const moveHandler = (event: MouseEvent) => {
          const { clientX, clientY } = event;
          if (selecting === false) {
            return;
          }
          if (!invokedStartRangeSelect) {
            store.startRangeSelect({
              x: initial.clientX,
              y: initial.clientY,
            });
            invokedStartRangeSelect = true;
          }
          store.rangeSelect({
            x: clientX,
            y: clientY,
          });
        };
        const unlisten3 = listen("mousemove", moveHandler);
        const upHandler = () => {
          selecting = false;
          invokedStartRangeSelect = false;
          console.log("end select");
          store.endRangeSelect();
          unlisten3();
        };
        listen("mouseup", upHandler, document, true);
      },
      $canvas
    );
    const unlisten5 = listen(
      "resize",
      () => {
        store.setCanvasClient($canvas.getBoundingClientRect());
      },
      window
    );
    store.setCanvasClient($canvas.getBoundingClientRect());

    return () => {
      cursorPositionListen();
      rangeSelectListen();
      unlisten5();
      unregisterHotkeys();
    };
  }, []);

  const { things: things } = values;

  // console.log("[PAGE]Design - render");

  return (
    <div className="page">
      <div className="page__content">
        <div className="tools flex">
          <div className="flex left">
            <img
              className="logo--react"
              src="https://reactjs.org/favicon.ico"
              alt="react"
            />
            <div className="btns history">
              <div
                className={cx("btn btn--icon", {
                  "btn--disabled": !history.canUndo,
                })}
                onClick={() => {
                  store.undo();
                }}
              >
                <IconUndo className="btn__icon" />
              </div>
              <div
                className={cx("btn btn--icon", {
                  "btn--disabled": !history.canRedo,
                })}
                onClick={() => {
                  store.redo();
                }}
              >
                <IconRedo className="btn__icon" />
              </div>
            </div>
          </div>
          <div className="btns operation">
            <div
              className="btn btn--icon"
              onClick={() => {
                store
                  .addThing({
                    type: CanvasThingTypes.Text,
                    data: {
                      placeholder: "请编辑文本",
                    },
                  })
                  .setPosition({
                    x: 100,
                    y: 120,
                  })
                  .setSize({
                    width: 120,
                    height: 24,
                  });
              }}
            >
              <IconFont className="btn__icon" />
            </div>
            <ImageUpload
              onChange={async (url, detail) => {
                store
                  .addThing({
                    type: CanvasThingTypes.Image,
                    data: {
                      url,
                    },
                  })
                  .setPosition({
                    x: 100,
                    y: 120,
                  })
                  .setSize(
                    getWidthAndHeight(
                      {
                        width: detail.width,
                        height: detail.height,
                      },
                      { maxWidth: 360 }
                    )
                  );
              }}
            >
              <div className="btn btn--icon">
                <IconImage className="btn__icon" />
              </div>
            </ImageUpload>
          </div>
          <div className="btns"></div>
        </div>
        <div
          className="canvas"
          ref={canvasRef}
          onMouseUp={() => {
            store.clearSelectedThings();
          }}
        >
          {things.map((content) => {
            const { id, type, data, rect } = content;
            return (
              <div key={id}>
                <Rect
                  instance={rect}
                  rotatable={selectedContentIds.includes(id)}
                  zoomable={
                    selectedContentIds.includes(id)
                      ? "n, w, s, e, nw, ne, se, sw"
                      : ""
                  }
                  draggable
                  onMouseDown={() => {
                    // console.log("[PAGE]DesignPage - onMouseDown");
                    const curThing = store.findThingById(id);
                    if (curThing && curThing.rect.locking) {
                      return;
                    }
                    if (pressingKeys.hasShift) {
                      store.appendSelectThing(id);
                      return;
                    }
                    if (store.selectedThingIds.length > 1) {
                      return;
                    }
                    store.selectThing(id);
                  }}
                >
                  {(() => {
                    if (type === CanvasThingTypes.Image) {
                      return (
                        <ImageInRect
                          className="canvas__image"
                          instance={data}
                        />
                      );
                    }
                    if (type === CanvasThingTypes.Text) {
                      return <TextInRect instance={data} />;
                    }
                    return null;
                  })()}
                </Rect>
              </div>
            );
          })}
          {rangeSelection && (
            <div className="canvas__range-selection" style={rangeSelection} />
          )}
          {(() => {
            const commonStyle: React.CSSProperties = {
              position: "absolute",
              zIndex: 101,
              backgroundColor: "#ff00cc",
            };
            return (
              <>
                {lines.map((line, i) => {
                  const { type, length, origin } = line;
                  if (type === LineDirectionTypes.Horizontal) {
                    return (
                      <span
                        key={i}
                        style={{
                          top: line.y,
                          left: origin,
                          width: length,
                          height: 1,
                          ...commonStyle,
                        }}
                      />
                    );
                  }
                  if (type === LineDirectionTypes.Vertical) {
                    return (
                      <span
                        key={i}
                        style={{
                          left: line.x,
                          top: origin,
                          height: length,
                          width: 1,
                          ...commonStyle,
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </>
            );
          })()}
        </div>
      </div>
      <div className="page__extra">
        <div className="settings">
          <Tabs
            tabs={[
              {
                title: "属性设置",
                content: (
                  <div>
                    {(() => {
                      // console.log("[PAGE]DesignPage - render setting panel");
                      if (selectedContentIds.length === 0) {
                        return <div className="">请先选择内容</div>;
                      }
                      const settings: React.ReactNode[] = [];
                      if (selectedContentIds.length === 1) {
                        const matchedThing = store.findThingById(
                          selectedContentIds[0]
                        );
                        // console.log("[PAGE]DesignPage - render setting panel");
                        if (matchedThing !== null) {
                          const { type, data } = matchedThing;
                          if (type === CanvasThingTypes.Text) {
                            settings.push(
                              <TextSettingsPanel
                                key="text-setting"
                                instance={data}
                              />
                            );
                          }
                          if (type === CanvasThingTypes.Image) {
                            settings.push(
                              <ImageSettingsPanel
                                key="image-setting"
                                instance={data}
                              />
                            );
                          }
                        }
                      }
                      return settings;
                    })()}
                  </div>
                ),
              },
              {
                title: "图层",
                content: (
                  <ScrollView distance={100}>
                    <div className="settings layers">
                      {[...things]
                        .sort((thing1, thing2) => {
                          return (
                            thing2.rect.client.index - thing1.rect.client.index
                          );
                        })
                        .map((thing) => {
                          const { id, type, data, rect } = thing;
                          return (
                            <div
                              key={id}
                              className={cx("layer", {
                                "layer--active":
                                  selectedContentIds.includes(id),
                              })}
                              onClick={() => {
                                store.selectThing(id);
                              }}
                            >
                              <div className="layer__content flex">
                                <div className="layer__title">
                                  {(() => {
                                    if (type === CanvasThingTypes.Text) {
                                      return "文字";
                                    }
                                    if (type === CanvasThingTypes.Image) {
                                      return "图片";
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div className="btns">
                                  <Button
                                    icon={<IconArrowUp />}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      store.upThings([id]);
                                    }}
                                  ></Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollView>
                ),
              },
              {
                title: "历史记录",
                content: (
                  <ScrollView distance={100}>
                    <div className="setting history">
                      {[...history.stacks].reverse().map((stack, index) => {
                        const { type } = stack;
                        const id = index;
                        if (type === CanvasOperationType.AddThing) {
                          return (
                            <div
                              key={id}
                              className={cx("history__card", {
                                "history--active": index === history.index,
                              })}
                            >
                              <IconDeliveryAdd className="history__icon" />
                              <div>新增物体</div>
                            </div>
                          );
                        }
                        if (type === CanvasOperationType.DelThing) {
                          return (
                            <div
                              key={id}
                              className={cx("history__card", {
                                "history--active": index === history.index,
                              })}
                            >
                              <IconRowDelete className="history__icon" />
                              <div>删除物体</div>
                            </div>
                          );
                        }
                        if (type === CanvasOperationType.Drag) {
                          return (
                            <div
                              key={id}
                              className={cx("history__card", {
                                "history--active": index === history.index,
                              })}
                            >
                              <IconStackedMove className="history__icon" />
                              <div>移动</div>
                            </div>
                          );
                        }
                        if (type === CanvasOperationType.Resize) {
                          return (
                            <div
                              key={id}
                              className={cx("history__card", {
                                "history--active": index === history.index,
                              })}
                            >
                              <IconFitToWidth className="history__icon" />
                              <div>改变大小</div>
                            </div>
                          );
                        }
                        if (type === CanvasOperationType.Rotate) {
                          return (
                            <div
                              key={id}
                              className={cx("history__card", {
                                "history--active": index === history.index,
                              })}
                            >
                              <IconRotateClockwise className="history__icon" />
                              <div>旋转</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </ScrollView>
                ),
              },
            ]}
          ></Tabs>
        </div>
      </div>
    </div>
  );
};

export default DesignPage;
