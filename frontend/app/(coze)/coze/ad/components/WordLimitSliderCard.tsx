'use client';

import { useRef, useEffect } from 'react';
import { LetterText } from 'lucide-react';
import CustomSlider from './CustomSlider';

interface WordLimitSliderCardProps {
  currentValue: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

const presetOptions = [
  { label: '精简', value: 100, color: 'bg-green-500' },
  { label: '适中', value: 300, color: 'bg-blue-500' },
  { label: '冗长', value: 500, color: 'bg-purple-500' },
];

export default function WordLimitSliderCard({
  currentValue,
  onChange,
  onClose,
}: WordLimitSliderCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 点击外部区域关闭卡片
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handlePresetClick = (value: number) => {
    onChange(value);
  };

  return (
    <div
      ref={cardRef}
      className="absolute top-full left-0 mt-2 w-80 p-4 bg-white/70 dark:bg/black/70 border border-neutral-300/70 dark:border-white/30 rounded-2xl shadow-lg z-50"
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
          <LetterText
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          字数限制设置
        </h3>
      </div>

      {/* 滑块区域 */}
      <div className="mb-6">
        <CustomSlider
          min={50}
          max={800}
          step={10}
          value={currentValue}
          onChange={onChange}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>最少 50字</span>
          <span>最多 800字</span>
        </div>
      </div>

      {/* 便捷档位 */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          快速选择
        </div>
        <div className="grid grid-cols-3 gap-3">
          {presetOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handlePresetClick(option.value)}
              title={`${option.label}: ${option.value}字`}
              className={`group cursor-pointer relative px-2 py-1 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                currentValue === option.value
                  ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-black/50 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              {/* 标签 */}
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
