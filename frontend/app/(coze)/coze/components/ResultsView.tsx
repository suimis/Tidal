'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Player } from '@lottiefiles/react-lottie-player';

// 清理：不再需要自定义CSS动画样式，已替换为Lottie动画

// 发送状态枚举
type SendStatus = 'idle' | 'sending' | 'success' | 'error';

// Lottie 成功动画组件
const SuccessLottieAnimation = () => (
  <Player
    src="/lotties/Success.json"
    className="w-6 h-6"
    autoplay
    loop={false}
    speed={1}
    keepLastFrame={true}
  />
);

// 动画发送按钮组件
const AnimatedSendButton = ({
  status,
  onClick,
  disabled,
}: {
  status: SendStatus;
  adoptedCount: number;
  onClick: () => void;
  disabled: boolean;
}) => {
  const getButtonContent = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* 旋转的加载器 */}
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-500"></div>
              {/* 脉冲效果 */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-75"></div>
            </div>
            <span className="ml-2">发送中...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center">
            <SuccessLottieAnimation />
            <span className="ml-2">发送成功</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="ml-2">发送失败</span>
          </div>
        );
      default:
        return `发送方案`;
    }
  };

  const getButtonClass = () => {
    const baseClass =
      'bg-green-500 hover:bg-green-600 text-white px-4 py-3 font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]';

    switch (status) {
      case 'sending':
        return `${baseClass} bg-blue-500 hover:bg-blue-600`;
      case 'success':
        return `${baseClass} bg-green-600`;
      case 'error':
        return `${baseClass} bg-red-500 hover:bg-red-600`;
      default:
        return baseClass;
    }
  };

  return (
    <Button onClick={onClick} disabled={disabled} className={getButtonClass()}>
      {getButtonContent()}
    </Button>
  );
};

interface AdSolution {
  title: string;
  subtitle: string;
  decorative_text: string;
  content: string;
  tag: string;
  image: string;
}

interface AdResults {
  output: AdSolution[];
}

interface ResultsViewProps {
  results: AdResults | null;
  onBack: () => void;
  onSendToBackend: (selectedSolutions: AdSolution[]) => void;
}

// 方案展示组件
const SolutionDisplay = ({
  solution,
  isAdopted,
  onToggleAdopt,
  onContentChange,
  onImageClick,
}: {
  solution: AdSolution;
  isAdopted: boolean;
  onToggleAdopt: () => void;
  onContentChange: (content: string) => void;
  onImageClick: (imageUrl: string) => void;
}) => {
  // 添加安全检查，确保solution对象存在
  if (!solution) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950 rounded-2xl border border-red-200 dark:border-red-800">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>方案数据加载失败</p>
        </div>
      </div>
    );
  }

  // 更严格的图片URL验证
  const hasValidImage =
    solution.image &&
    solution.image.trim() !== '' &&
    solution.image !== 'null' &&
    solution.image !== 'undefined';

  // 图片加载状态管理
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // 预加载图片
  useEffect(() => {
    if (!hasValidImage) {
      setImageLoading(false);
      setImageError(true);
      return;
    }

    setImageLoading(true);
    setImageError(false);

    // 创建Image对象预加载
    const img = new Image();

    const handleLoad = () => {
      setImageLoading(false);
      setImageError(false);
      setImageSrc(solution.image);
    };

    const handleError = () => {
      setImageLoading(false);
      setImageError(true);
      console.error('图片预加载失败:', solution.image);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = solution.image;

    // 清理函数
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [solution.image, hasValidImage]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white/80 dark:bg-black/80 rounded-2xl border border-neutral-200/50 dark:border-white/15 backdrop-blur-sm">
      {/* 左侧图片区域 - 占据主要空间 */}
      <div className="lg:w-3/5">
        <div
          className="relative group cursor-pointer w-full aspect-[4/3] min-h-[280px] rounded-2xl border border-neutral-200/50 dark:border-white/15 transition-all duration-200 hover:scale-[1.02] overflow-hidden bg-white dark:bg-black shadow-sm"
          onClick={() => hasValidImage && onImageClick(solution.image)}
        >
          {hasValidImage && imageSrc ? (
            <img
              src={imageSrc}
              alt={solution.title || '方案图片'}
              className="w-full h-full object-contain transition-all duration-200"
              onError={(e) => {
                console.error('图片加载失败:', imageSrc);
                setImageError(true);
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  暂无图片
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {hasValidImage ? '点击图片放大查看' : '暂无图片可查看'}
        </p>
      </div>

      {/* 右侧信息区域 */}
      <div className="lg:w-2/5 flex flex-col space-y-4">
        {/* 标题区域 */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{solution.title}</h3>
          <p className="text-sm text-muted-foreground">{solution.subtitle}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {solution.decorative_text}
          </p>
        </div>

        {/* 文案编辑区域 */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">文案内容</label>
          <textarea
            value={solution.content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-32 p-3 border border-neutral-300/50 dark:border-white/15 rounded-lg bg-white dark:bg-black text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors backdrop-blur-sm"
            placeholder="输入文案内容..."
          />
        </div>

        {/* 标签和操作区域 */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">标签:</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {solution.tag}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              采纳此方案
            </span>
            <button
              onClick={onToggleAdopt}
              className={`p-2 rounded-full transition-all duration-200 ${
                isAdopted
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                  : 'bg-neutral-200/50 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50'
              }`}
            >
              <CheckCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResultsView({
  results,
  onBack,
  onSendToBackend,
}: ResultsViewProps) {
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [solutionAdoptions, setSolutionAdoptions] = useState<boolean[]>([]);
  const [editableSolutions, setEditableSolutions] = useState<AdSolution[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');

  // 初始化状态
  useEffect(() => {
    if (results && results.output) {
      setEditableSolutions([...results.output]);
      setSolutionAdoptions(new Array(results.output.length).fill(false));
      setSelectedSolutionIndex(0);
    }
  }, [results]);

  // 处理方案选择
  const handleSolutionSelect = useCallback((index: number) => {
    setSelectedSolutionIndex(index);
  }, []);

  // 处理采纳切换
  const handleToggleAdopt = useCallback((index: number) => {
    setSolutionAdoptions((prev) => {
      const newAdoptions = [...prev];
      newAdoptions[index] = !newAdoptions[index];
      return newAdoptions;
    });
  }, []);

  // 处理内容修改
  const handleContentChange = useCallback((index: number, content: string) => {
    setEditableSolutions((prev) => {
      const newSolutions = [...prev];
      newSolutions[index] = { ...newSolutions[index], content };
      return newSolutions;
    });
  }, []);

  // 处理发送到后端
  const handleSendToBackend = useCallback(() => {
    const adoptedSolutions = editableSolutions.filter(
      (_, index) => solutionAdoptions[index]
    );

    // 开始发送状态
    setSendStatus('sending');

    // 模拟发送过程
    setTimeout(() => {
      try {
        // 调用实际的发送函数
        onSendToBackend(adoptedSolutions);

        // 发送完成
        setSendStatus('success');

        // 3秒后重置成功状态
        setTimeout(() => {
          setSendStatus('idle');
        }, 3000);
      } catch {
        // 发送失败
        setSendStatus('error');

        // 3秒后重置错误状态
        setTimeout(() => {
          setSendStatus('idle');
        }, 3000);
      }
    }, 2000); // 模拟2秒的发送时间
  }, [editableSolutions, solutionAdoptions, onSendToBackend]);

  // 获取已采纳的方案数量
  const adoptedCount = solutionAdoptions.filter(Boolean).length;

  if (!results || !results.output || results.output.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="w-full max-w-6xl mx-auto px-4 pt-8 pb-16 min-h-screen flex flex-col">
          {/* 头部返回区域 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回输入
            </Button>
            <h1 className="text-2xl font-bold">生成结果</h1>
            <div className="w-20"></div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">暂无生成结果</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="w-full max-w-6xl mx-auto px-4 pt-8 pb-16 min-h-screen flex flex-col">
          {/* 头部返回区域 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回输入
            </Button>
            <h1 className="text-2xl font-bold">生成结果</h1>
            <div className="w-20"></div>
          </div>

          {/* 方案选择器 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">方案选择</h2>
            <div className="flex flex-wrap gap-2">
              {editableSolutions.map((solution, index) => (
                <button
                  key={index}
                  onClick={() => handleSolutionSelect(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedSolutionIndex === index
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white/50 dark:bg-black/50 text-neutral-700 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-black/70 border border-neutral-200/50 dark:border-white/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    方案 {index + 1}
                    {solutionAdoptions[index] && (
                      <CheckCircle size={14} className="text-green-500" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容展示区域 */}
          <div className="flex-1 mb-6">
            <SolutionDisplay
              solution={editableSolutions[selectedSolutionIndex]}
              isAdopted={solutionAdoptions[selectedSolutionIndex]}
              onToggleAdopt={() => handleToggleAdopt(selectedSolutionIndex)}
              onContentChange={(content) =>
                handleContentChange(selectedSolutionIndex, content)
              }
              onImageClick={(imageUrl) => setEnlargedImage(imageUrl)}
            />
          </div>

          {/* 底部操作栏 */}
          <div className="p-4 bg-white/80 dark:bg-black/80 rounded-2xl border border-neutral-200/50 dark:border-white/15 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    已采纳
                  </span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {adoptedCount}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    个方案
                  </span>
                </div>
                {adoptedCount > 0 && (
                  <div className="flex gap-2">
                    {editableSolutions.map(
                      (_, index) =>
                        solutionAdoptions[index] && (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-medium shadow-sm"
                          >
                            {index + 1}
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>

              <AnimatedSendButton
                status={sendStatus}
                adoptedCount={adoptedCount}
                onClick={handleSendToBackend}
                disabled={adoptedCount === 0 || sendStatus === 'sending'}
              />
            </div>
          </div>
        </div>

        {/* 图片放大查看模态框 */}
        <Dialog
          open={!!enlargedImage}
          onOpenChange={(open) => !open && setEnlargedImage(null)}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-transparent border-none">
            <VisuallyHidden>
              <DialogTitle>图片放大查看</DialogTitle>
            </VisuallyHidden>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
                <img
                  src={enlargedImage || ''}
                  alt="Enlarged view"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                <button
                  className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full p-3 hover:bg-opacity-80 transition-all duration-200 z-10"
                  onClick={() => setEnlargedImage(null)}
                >
                  <X size={28} />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
