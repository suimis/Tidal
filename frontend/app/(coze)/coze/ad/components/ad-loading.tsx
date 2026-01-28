'use client';

import { useState, useEffect } from 'react';
import { Image, PenTool } from 'lucide-react';

interface AdLoadingComponentProps {
  onCancel: () => void;
  cleanupTimerStates: () => void;
}

const AdLoadingComponent = ({
  onCancel,
  cleanupTimerStates,
}: AdLoadingComponentProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const tips = [
    '正在分析图片特征...',
    '正在生成创意文案...',
    '正在优化表达方式...',
    '即将完成...',
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(tipInterval);
  }, [tips.length]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // 在组件卸载时清理计时器状态
  useEffect(() => {
    return () => {
      cleanupTimerStates();
    };
  }, [cleanupTimerStates]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    // 改进样式：加深背景和边框，添加hover效果
    <div className="p-2 bg-white/70 dark:bg/black/70 z-[90] border border-neutral-300/70 dark:border-white/30 rounded-2xl transition-all duration-200 hover:border-neutral-400/80 dark:hover:border-white/50">
      <div className="text-center space-y-6 p-4">
        {/* 只保留 bouncing dots 动画 */}
        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* 标题和信息 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            生成广告方案中
          </h3>
          <p className="text-sm text-muted-foreground">
            AI正在为您创作独特的广告内容，请稍候片刻...
          </p>
        </div>

        {/* 提示信息 */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
            ⏱️ 已用时 {formatTime(elapsedTime)}
          </div>
          <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
            <Image size={12} />
            分析图片特征
          </div>
          <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1">
            <PenTool size={12} />
            优化文案表达
          </div>
        </div>

        {/* 动态提示文字 */}
        <div className="text-sm text-neutral-500 dark:text-neutral-400 min-h-[1.25rem] transition-opacity duration-300 mb-6">
          {tips[currentTip]}
        </div>

        {/* 取消按钮 - 改进样式 */}
        <button
          onClick={onCancel}
          className="w-full py-3 px-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
        >
          取消任务
        </button>
      </div>
    </div>
  );
};

export default AdLoadingComponent;
