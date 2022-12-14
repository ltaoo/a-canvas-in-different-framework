/**
 * @file 画布上的图片
 */
import { useEffect, useState } from "react";
import ImageDomain from "canvas-sdk/domains/image";

interface IProps {
  className?: string;
  instance: ImageDomain;
}
const ImageInRect: React.FC<IProps> = (props) => {
  const { className, instance } = props;

  const [values, setValues] = useState(instance.values);

  useEffect(() => {
    instance.addListener((nextValues) => {
      setValues(nextValues);
    });
  }, []);

  return <img className={className} src={values.url} />;
};

export default ImageInRect;
