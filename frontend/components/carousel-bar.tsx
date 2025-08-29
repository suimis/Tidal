'use client';

// @ts-expect-error - Package has type issues
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { useRef } from 'react';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll'; // 新增扩展导入

interface CarouselItem {
  describe: string;
  content: string;
}

interface Props {
  data: CarouselItem[];
  speed?: number;
  handleSubmit?: (message: string) => void;
}

export default function CarouselBar({ data, handleSubmit, speed = 1 }: Props) {
  const splideRef = useRef<unknown>(null);

  const submitForm = (message: string) => {
    handleSubmit?.(message);
  };

  return (
    <div className="w-full overflow-hidden relative my-2">
      <Splide
        ref={splideRef}
        options={{
          type: 'loop',
          drag: false, // 禁用拖拽避免冲突
          arrows: false,
          pagination: false,
          focus: 'center', // 提升循环流畅度
          gap: '1rem',
          autoWidth: true, // 根据内容自动宽度
          autoScroll: {
            speed: speed, // 滚动速度（每秒钟移动像素）
            pauseOnHover: true,
            pauseOnFocus: false,
            autoStart: true, // 必须开启自动开始
            rewind: false, // 禁用倒带效果
          },
          classes: {
            track: '!overflow-visible', // 必须可见
          },
          // 自动计算克隆数量
          cloneStatus: false,
          cloneOverflow: true,
        }}
        extensions={{ AutoScroll }} // 注册扩展
      >
        {/* 修改数据渲染逻辑 */}
        {data.map((x, idx) => (
          <SplideSlide
            key={`${x.describe}-${idx}`}
            className="!w-auto"
            onClick={() => submitForm(x.content)}
          >
            <div className="relative ring-1 ring-neutral-400/30 px-1 py-1 cursor-pointer rounded-xl bg-neutral-400/20 text-xs duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 dark:bg-neutral-600/10">
              <span className="block px-1 text-[0.9em] text-neutral-400 dark:text-neutral-500">
                {x.describe}
              </span>
              <span className="block max-w-sm px-1 font-medium text-neutral-500 dark:text-gray-100">
                {x.content.length > 30
                  ? `${x.content.substring(0, 30)}...`
                  : x.content}
              </span>
            </div>
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
}
