/**
 * @file 文字设置面板
 */
import { useEffect, useState } from "react";
import TextDomain from "canvas-sdk/domains/text";

import "./index.less";
import { IconAdd, IconSubtract } from "../icons";
import Button from "../Button";

interface IProps {
  instance: TextDomain;
}
const TextSettingsPanel: React.FC<IProps> = (props) => {
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
          <div className="field__label">内容</div>
          <div className="field__input">
            <textarea
              className="input textarea"
              value={values.value}
              rows={6}
              onChange={(event) => {
                instance.setValue(event.target.value);
              }}
            />
          </div>
        </div>
        {/* <div className="text-settings-panel__field field field--horizontal">
          <div className="field__label">字号</div>
          <div className="field__input">
            <div className="field__btns">
              <div className="field__btn">
                <Button icon={<IconAdd className="field__icon" />} />
              </div>
              <div className="field__btn">
                <Button icon={<IconSubtract className="field__icon" />} />
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default TextSettingsPanel;
