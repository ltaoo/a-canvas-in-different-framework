/**
 * @file 画布上的文本
 */
import { useEffect, useState } from "react";
import cx from "classnames";
import TextDomain from "canvas-sdk/domains/text";

import "./index.less";

interface IProps {
  className?: string;
  instance: TextDomain;
}
const TextInRect: React.FC<IProps> = (props) => {
  const { className, instance } = props;

  const [values, setValues] = useState(instance.values);

  useEffect(() => {
    instance.addListener((nextValues) => {
      setValues(nextValues);
    });
  }, []);

  return <div className={cx(className, "text")}>{values.value}</div>;
};

export default TextInRect;
