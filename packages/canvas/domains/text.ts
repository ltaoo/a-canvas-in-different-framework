import React from "react";

import { CanvasThingTypes } from "../constants";
// import { FontStyle } from "@/types";

import { Domain } from "./base";

interface TextDomainValues {
  /** 文字内容 */
  value: string;
  /** 样式 */
  style?: React.CSSProperties;
  /** 字体族名称 */
  name?: string;
  /** 非系统字体，额外的字体文件链接地址 */
  url?: string;
  /** 是否正在编辑 */
  editing?: boolean;
}
const defaultValues = {
  value: "Placeholder",
  style: {},
};
export default class TextDomain extends Domain<TextDomainValues> {
  values: TextDomainValues = { ...defaultValues };

  constructor(options: TextDomain["values"]) {
    const { url } = options;
    const values = {
      ...options,
      type: CanvasThingTypes.Text,
      editing: false,
    };
    if (url) {
      // values.fontFileUrl = url;
    }
    // values.fontFamily = `${name}, cursive`;
    super(values);
    this.values = values;
    // const defaultStyle: FontStyle = {};
    // const { type, placeholder, style } = params;
    // this.values.value = placeholder;
    // this.values.style = style;
    // this.values.type = type;
  }

  get value() {
    return this.values.value;
  }

  setValue(nextValue: string = "") {
    this.values.value = nextValue;
    this.emitValuesChange();
  }

  toJSON() {
    const { value, url, name, style } = this.values;
    return {
      type: CanvasThingTypes.Text,
      value,
      url,
      name,
      style,
    };
  }
  toValues(nextValues: TextDomain["values"]) {
    this.values = { ...nextValues };
    this.emitValuesChange();
  }
}
