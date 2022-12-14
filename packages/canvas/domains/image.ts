import { CanvasThingTypes } from "../constants";

import { Domain } from "./base";

interface ImageDomainValues {
  url: string;
}

export default class ImageDomain extends Domain<ImageDomainValues> {
  constructor(options: ImageDomainValues) {
    const { url } = options;
    const values = {
      url,
    };
    super(values);
  }

  get url() {
    return this.values.url;
  }

  setUrl(nextUrl: string) {
    this.values.url = nextUrl;
    this.emitValuesChange();
  }

  toJSON() {
    return {
      type: CanvasThingTypes.Image,
      url: this.url,
    };
  }
  toValues(nextValues: ImageDomain["values"]) {
    this.values = { ...nextValues };
    this.emitValuesChange();
  }
}
