'use client';

import { useState, useRef, useEffect } from 'react';

interface CustomSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export default function CustomSlider({
  min,
  max,
  step,
  value,
  onChange,
  className = '',
}: CustomSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // 计算滑块位置
  const calculatePosition = (clientX: number) => {
    if (!sliderRef.current) return value;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    const newValue = Math.round((percentage * (max - min)) / step) * step + min;
    return Math.max(min, Math.min(max, newValue));
  };

  // 处理鼠标/触摸事件
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    const newValue = calculatePosition(clientX);
    onChange(newValue);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const newValue = calculatePosition(clientX);
    onChange(newValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // 计算滑块thumb位置
  const percentage = ((value - min) / (max - min)) * 100;

  // 生成刻度
  const ticks = [];
  for (let i = min; i <= max; i += 100) {
    ticks.push(i);
  }

  return (
    <div className={`relative w-full h-12 ${className}`}>
      {/* 滑块轨道 */}
      <div
        ref={sliderRef}
        className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full cursor-pointer transform -translate-y-1/2"
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {/* 进度条 */}
        <div
          className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 刻度线 */}
      {ticks.map((tick) => {
        const tickPercentage = ((tick - min) / (max - min)) * 100;
        const isActive = tick <= value;
        return (
          <div
            key={tick}
            className="absolute top-1/2 w-px h-3 bg-neutral-300 dark:bg-neutral-600 transform -translate-y-1/2"
            style={{ left: `${tickPercentage}%` }}
          >
            {/* 刻度数字 */}
            <div
              className={`absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {tick}
            </div>
          </div>
        );
      })}

      {/* 滑块thumb */}
      <div
        ref={thumbRef}
        className={`absolute top-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-sm transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 cursor-grab ${
          isDragging ? 'scale-110 shadow-md' : 'hover:scale-105'
        }`}
        style={{ left: `${percentage}%` }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleStart(e.clientX);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleStart(e.touches[0].clientX);
        }}
      />

      {/* 当前值显示 - 在滑块中间上方 */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 text-base font-bold text-black dark:text-white">
        {value}字
      </div>
    </div>
  );
}
