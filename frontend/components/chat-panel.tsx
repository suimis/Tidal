'use client';

import Textarea from 'react-textarea-autosize';

import UploadButton from './upload-button';
import SendButton from './send-button';
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useRef,
} from 'react';
import { ChevronDownIcon } from 'lucide-react';
import CarouselBar from './carousel-bar';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import Greeting from './greeting';
import { motion, AnimatePresence } from 'framer-motion';
import { getCookie, setCookie } from '@/lib/utils/cookies';
import ModelSelector from './model-selector';
import ModeSelector from './mode-selector';
import { Attachment, Message } from 'ai';
import StopButton from './stop-button';
import { UseChatHelpers } from '@ai-sdk/react';
import { Model } from '@/lib/types/models';
import { toast } from 'sonner';
import NewButton from './new-button';
import {
  uploadFile,
  getFileIcon,
  formatFileSize,
} from '@/lib/utils/file-upload';
import { X } from 'lucide-react';

interface ChatPanelProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  messages: Message[]; // 建议替换为具体类型
  stop: () => void;
  reload: () => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleNewChat: () => void;
  chatId: string;
  status: UseChatHelpers['status'];
  isLoading: boolean;
  models: Model[];
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  onModeChange?: (mode: string) => void;
}

export default function ChatPanel({
  input,
  handleInputChange,
  messages,
  stop,
  chatId,
  handleSubmit,
  handleNewChat,
  isLoading,
  models,
  status,
  setMessages,
  attachments,
  setAttachments,
  onModeChange,
}: ChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mode, setMode] = useState('normal');
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitForm = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      setIsExpanded(false);
      handleSubmit(e);
    },
    [handleSubmit, chatId]
  );

  const handlePlanSwitch = useCallback(
    (check: boolean) => {
      const newMode = check.toString() == 'true' ? 'plan' : 'normal';
      setCookie('mode', newMode);
      setMode(newMode);
      onModeChange?.(newMode);

      if (newMode === 'plan') {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    },
    [onModeChange]
  );

  useEffect(() => {
    const mode = getCookie('mode');
    setMode(mode || 'normal');
  }, []);

  useEffect(() => {
    if (mode === 'plan') {
      setCookie('mode', 'plan');
      setMode('plan');
      setIsExpanded(true);
    }
  }, [mode]);

  // 监听消息变化，确保在新对话时正确设置预设折叠框状态
  useEffect(() => {
    if (mode === 'plan' && messages.length === 0) {
      setIsExpanded(true);
    }
  }, [mode, messages.length]);

  // Stable handleInputChange
  const stableHandleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e);
    },
    [handleInputChange]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  // Stable onKeyDown handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();

        if (status !== 'ready') {
          toast.error('Please wait for the model to finish its response!');
        } else {
          submitForm(event);
        }
      }
    },
    [submitForm]
  );

  // Memoize CarouselBar components
  const memoizedCarouselBars = useMemo(
    () => (
      <motion.div>
        <CarouselBar
          speed={0.25}
          handleSubmit={(message: string) => {
            stableHandleInputChange({
              target: { value: message },
            } as React.ChangeEvent<HTMLTextAreaElement>);
          }}
          data={[
            {
              describe: '特斯拉股票分析以及建议',
              content:
                '创建一个全面的特斯拉股票分析，包括公司概览、财务数据、市场情绪、技术分析、竞争对比、价值评估以及针对不同类型投资者的投资建议。',
            },
            {
              describe: '日本旅行规划',
              content:
                '为一对预算$2500-5000的西雅图情侣设计一个7天日本行程(4月15-23日)，包含历史景点、文化体验和隐藏景点，特别推荐一个完美求婚地点，并提供带有地图、常用日语和旅行贴士的HTML旅行手册。',
            },
            {
              describe: 'AI行研专家',
              content: `1. 深度解析：产业链关键节点与技术演进路径
2. 动态评估：市场成熟度与成长拐点，量化投资价值
3. 适配任何领域：输出可落地的产业图谱与决策方案`,
            },
            {
              describe: '漫画解析投资本质',
              content:
                '创建一个HTML网页，运用黑白手绘漫画配合极简文字，从本质逐层深入浅出地解析投资概念。',
            },
          ]}
        ></CarouselBar>
        <CarouselBar
          speed={0.5}
          handleSubmit={(message: string) => {
            stableHandleInputChange({
              target: { value: message },
            } as React.ChangeEvent<HTMLTextAreaElement>);
          }}
          data={[
            {
              describe: '特斯拉股票分析以及建议',
              content:
                '创建一个全面的特斯拉股票分析，包括公司概览、财务数据、市场情绪、技术分析、竞争对比、价值评估以及针对不同类型投资者的投资建议。',
            },
            {
              describe: '日本旅行规划',
              content:
                '为一对预算$2500-5000的西雅图情侣设计一个7天日本行程(4月15-23日)，包含历史景点、文化体验和隐藏景点，特别推荐一个完美求婚地点，并提供带有地图、常用日语和旅行贴士的HTML旅行手册。',
            },
            {
              describe: 'AI行研专家',
              content: `1. 深度解析：产业链关键节点与技术演进路径
2. 动态评估：市场成熟度与成长拐点，量化投资价值
3. 适配任何领域：输出可落地的产业图谱与决策方案`,
            },
            {
              describe: '漫画解析投资本质',
              content:
                '创建一个HTML网页，运用黑白手绘漫画配合极简文字，从本质逐层深入浅出地解析投资概念。',
            },
          ]}
        ></CarouselBar>
      </motion.div>
    ),
    [stableHandleInputChange]
  );

  const handleNewChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleNewChat();
  };

  // 删除单个附件
  const removeAttachment = useCallback(
    (index: number) => {
      setAttachments((current) => current.filter((_, i) => i !== index));
    },
    [setAttachments]
  );

  return (
    <div
      className={`w-[47rem] mt-2 overflow-hidden ${
        messages.length > 0 ? 'mt-auto' : ''
      }`}
    >
      {messages.length == 0 && <Greeting />}
      <section className="mb-4 p-2 bg-white/50 dark:bg-black/50 z-[90] border border-neutral-200/50 dark:border-white/15 rounded-2xl transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gradient-to-b before:from-white/5 before:to-white/10 dark:before:from-neutral-800/50 dark:before:to-neutral-800/30">
        <form
          className="relative min-w-xl flex flex-col gap-4 rounded-lg bg-gradient-to-tr from-neutral-50 to-neutral-200 border-neutral-300/50 border p-2 dark:border-neutral-50/20 dark:from-neutral-800 dark:to-neutral-900"
          onSubmit={submitForm}
        >
          <div className="flex">
            <input
              type="file"
              className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
              ref={fileInputRef}
              multiple
              accept=".txt,.md,.json,.csv,.html,.css,.js,.xml"
              onChange={handleFileChange}
              tabIndex={-1}
            />

            <Textarea
              className={`mark-scroll-bar flex-1 input-color font-geist-mono resize-none min-w-xl border-0 p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                messages.length > 0 ? 'min-h-12' : 'min-h-24'
              }`}
              rows={2}
              maxRows={5}
              tabIndex={0}
              spellCheck={false}
              placeholder={
                isLoading
                  ? 'ai生成中...'
                  : messages.length > 0
                  ? '继续追问...'
                  : '发起一个话题...'
              }
              onKeyDown={handleKeyDown}
              onChange={stableHandleInputChange}
              autoFocus
              value={input}
            />
            <div className="flex justify-center items-start gap-2">
              <Label
                htmlFor="airplane-mode"
                className="font-mono text-[0.9em] font-semibold text-[rgba(67,56,202,1)]"
              >
                计划模式
              </Label>
              <Switch
                checked={mode === 'plan'}
                onCheckedChange={handlePlanSwitch}
                className="mt-0.5 data-[state=checked]:!bg-[rgba(67,56,202,1)]"
                id="airplane-mode"
              />
            </div>
          </div>

          {/* 文件预览区域 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-2 text-xs"
                >
                  <span className="text-lg">
                    {getFileIcon(
                      attachment.contentType || 'application/octet-stream'
                    )}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-32" title={attachment.name}>
                      {attachment.name}
                    </span>
                    <span className="text-neutral-500 text-xs">
                      {formatFileSize(
                        attachment.url ? new Blob([attachment.url]).size : 0
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 上传进度 */}
          {uploadQueue.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {uploadQueue.map((fileName, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 rounded-lg p-2 text-xs"
                >
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  <span className="truncate max-w-32" title={fileName}>
                    {fileName}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    上传中...
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 底边栏 */}
          <div className="flex w-full items-center">
            <div className="flex ml-auto justify-center items-center gap-2">
              <NewButton onClick={handleNewChatClick} />
              <UploadButton fileInputRef={fileInputRef} status={status} />
              {status === 'submitted' || status === 'streaming' ? (
                <StopButton stop={stop} setMessages={setMessages} />
              ) : (
                <SendButton submitForm={submitForm} input={input} />
              )}
            </div>
          </div>
        </form>
        {/* 工具栏 */}
        {mode !== 'plan' && (
          <div className="mt-3 flex items-center gap-2">
            <ModeSelector
              mode={mode}
              handleSelectMode={(newMode: string) => {
                setMode(newMode);
                onModeChange?.(newMode);
              }}
            />
            <ModelSelector models={models} />
          </div>
        )}

        {mode === 'plan' && messages.length <= 0 && (
          <>
            <div
              className="flex items-center mt-1 p-1 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-[0.75rem] text-neutral-900/70">
                现有预设：使用预建方案快速高效构建AI工作流程
              </span>
              <ChevronDownIcon
                className={`ml-1 size-3 transition-transform ${
                  isExpanded ? '' : '-rotate-90'
                }`}
              />
            </div>
            {/* 走马灯 */}
            <AnimatePresence>
              {isExpanded && memoizedCarouselBars}
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
}
