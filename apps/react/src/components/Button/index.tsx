import cx from "classnames";
import React from "react";

import "./index.less";

interface IProps {
  icon: React.ReactElement;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}
const Button: React.FC<IProps> = (props) => {
  const { icon, disabled, onClick } = props;
  return (
    <div
      className={cx("btn btn--icon", {
        "btn--disabled": disabled,
      })}
      onClick={onClick}
    >
      {React.cloneElement(icon, {
        className: "btn__icon",
      })}
    </div>
  );
};

export default Button;
