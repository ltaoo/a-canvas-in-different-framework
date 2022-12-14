/**
 * @file 无滚动条的滚动容器
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

import "./index.less";

interface NoScrollBarContainerProps {
  distance?: number;
  height?: number;
  children?: React.ReactNode;
  onLoadMore?: () => Promise<void>;
}
const ScrollView: React.FC<NoScrollBarContainerProps> = (props) => {
  const { distance = 0, height, children, onLoadMore } = props;

  const [watch, setWatch] = useState(false);
  const prevScrollTopRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const handleContainerScroll = useCallback((e: WheelEvent) => {
    if (watch === false) {
      return;
    }
    const { scrollTop, clientHeight, scrollHeight } =
      e.target as HTMLDivElement;
    if (prevScrollTopRef.current - scrollTop > 0) {
      prevScrollTopRef.current = scrollTop;
      return;
    }
    if (scrollTop + clientHeight + distance >= scrollHeight) {
      setWatch(false);
      if (onLoadMoreRef.current) {
        onLoadMoreRef.current().finally(() => {
          setWatch(true);
        });
      }
    }
  }, []);

  useEffect(() => {
    const $container = containerRef.current;
    const $content = contentRef.current;
    function handleResize() {
      console.log("size changed");
    }
    if ($container !== null) {
      $container.addEventListener(
        "scroll",
        handleContainerScroll as EventListener
      );
    }
    if ($content) {
      // const observer = new MutationObserver(function (mutations, observer) {
      //   const rect = $content.getBoundingClientRect();
      // });
      // observer.observe($content, {
      //   childList: true,
      //   subtree: true,
      // });
    }
    return () => {
      if ($container) {
        $container.removeEventListener(
          "scroll",
          handleContainerScroll as EventListener
        );
      }
      if ($content) {
        $content.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="no-scroll-bar-container">
      <div ref={contentRef} className="no-scroll-bar-container__inner">
        {children}
      </div>
    </div>
  );
};

export default ScrollView;
