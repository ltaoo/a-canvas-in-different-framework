/**
 * @file 图片设置面板
 */
import { useEffect, useState } from "react";
import ImageDomain from "canvas-sdk/domains/image";

import ImageUpload from "../ImageUpload";

import "./index.less";

interface IProps {
  instance: ImageDomain;
}
const ImageSettingsPanel: React.FC<IProps> = (props) => {
  const { instance } = props;

  const [values, setValues] = useState(instance.values);

  useEffect(() => {
    instance.addListener((nextValues) => {
      setValues(nextValues);
    });
  }, []);

  return (
    <div className="text-settings-panel">
      <div className="text-settings-panel__fields">
        <div className="text-settings-panel__field field">
          <div className="field__label"></div>
          <div className="field__image">
            <ImageUpload
              onChange={(url) => {
                instance.setUrl(url);
              }}
            >
              <img className="field__preview" src={values.url} />
            </ImageUpload>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSettingsPanel;
