import {
  LineDirectionTypes,
  RectLineTypes,
  CanvasThingTypes,
  Side,
} from "../constants";
import TransformRect from "../domains/rect";

/** 解包 */
export type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: any[]) => infer U
  ? U
  : T extends Promise<infer U>
  ? U
  : T;

/** 根据 type 推断不同 data 值的对象 */
export type MutableRecord<U> = {
  [SubType in keyof U]: {
    type: SubType;
    data: U[SubType];
  };
}[keyof U];

/** 根据 type 推断不同 key 的对象 */
export type MutableRecord2<U> = {
  [SubType in keyof U]: {
    type: SubType;
  } & U[SubType];
}[keyof U];

interface BoxStyle {
  width: number;
  height: number;
  left: number;
  top: number;
}
export interface FontStyle {
  fontSize?: number;
  lineHeight?: string;
}
export interface ImageStyle extends BoxStyle {}

// export interface Text extends CanvasContent {
//   value: string;
//   style: FontStyle;
//   fontFileUrl: string;
// }

// export interface Image extends CanvasContent {
//   url: string;
//   style: ImageStyle;
// }

// export interface ImageInterface extends CanvasContent {
//   url: string;
// }

export interface Materials {
  // [Side.Top]: string;
  // [Side.Bottom]: string;
  // [Side.Left]: string;
  // [Side.Right]: string;
  [Side.Front]: string;
  [Side.Back]: string;
}

// export type Material = {
//   [K in keyof type Side]: string;
// }
export interface TemplateResponse {
  id: string;
  project_name?: string;
  model_no: string;
  image: string;
  images?: Array<string>;
  length: number;
  width: number;
  height: number;

  purpose?: string;
  content?: string;
}
export interface ProjectResponse {
  project_name: string;
  images: Array<string> | null;
  width: number;
  length: number;
  background: string;
  create_time: string;
  design_data: string;
}

export interface BoxData {
  Border: Array<number>;
  Rel: Array<string>;
  Planes: Array<PlaneData>;
}
export type FoldLineData = [number, number, number, number, Array<number>];
export interface PlaneData {
  Vertices: Array<number>;
  Faces: Array<number>;
  //   FoldLine?: FoldLine;
  FoldLine: unknown;

  CutlinesToDraw: Array<number>;
  FoldlinesToDraw: Array<number>;
}

/**
 * 字体族
 */
export interface FontFamilyItem {
  id: number;
  /**
   * 内容类型
   */
  type: CanvasThingTypes.Text;
  /**
   * 名称
   */
  name: string;
  /**
   * 示例文案
   */
  example: string;
  /**
   * 字体地址
   */
  url: string;
}

export interface SearchParams {
  keyword?: string;
  page: number;
  pageSize?: number;
}
/**
 * 画布内容
 */
export interface ICanvasContent {
  /**
   * id
   */
  id: number;
  /**
   * 内容类型
   */
  type: CanvasThingTypes;
  /**
   * 内容位置
   */
  position: {
    x: number;
    y: number;
  };
  /**
   * 内容大小
   */
  size?: {
    w: number;
    h: number;
  };
}
export interface ProjectCanvases {
  // [Side.Top]: Array<ICanvasContent>;
  // [Side.Bottom]: Array<ICanvasContent>;
  // [Side.Left]: Array<ICanvasContent>;
  // [Side.Right]: Array<ICanvasContent>;
  [Side.Front]: Array<ICanvasContent>;
  [Side.Back]: Array<ICanvasContent>;
}

export interface TemplateSearchParams extends SearchParams {}

export interface GlobalState {
  loading: any;
  template: any;
  project: any;
  auth: any;
  design: any;
}

export interface ProjectSearchParams {
  cate_id: string;
  project_name: string;
  currentPage: number;
  pageSize: number;
}
