import { RefObject, useEffect, useRef } from 'react';

export function useScrollToBottom<T extends HTMLElement>(
  shouldScroll = true // 新增控制参数
): [RefObject<T | null>, RefObject<T | null>] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end && shouldScroll) {
      // 添加条件判断
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: 'instant', block: 'end' });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, [shouldScroll]); // 依赖 shouldScroll

  return [containerRef, endRef];
}
