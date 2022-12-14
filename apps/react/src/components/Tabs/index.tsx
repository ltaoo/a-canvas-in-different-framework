import { useState } from "react";

import cx from "classnames";

import "./index.less";

interface IProps {
  tabs: {
    title: string;
    content: React.ReactNode;
  }[];
}
const Tabs: React.FC<IProps> = (props) => {
  const { tabs } = props;

  const [current, setCurrent] = useState(0);

  return (
    <div className="tabs">
      <div className="tabs__header">
        {tabs.map((tab, index) => {
          const { title, content } = tab;
          return (
            <div
              key={title}
              className={cx("tab", {
                "tab--active": current === index,
              })}
              onClick={() => {
                setCurrent(index);
              }}
            >
              <div className="tab__title">{title}</div>
            </div>
          );
        })}
      </div>
      <div className="tabs__content">
        {tabs.map((tab, index) => {
          const { title, content } = tab;
          if (current === index) {
            return (
              <div key={title} className="tab__content">
                {content}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Tabs;
