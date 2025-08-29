'use client';

import { useChat } from '@ai-sdk/react';
import ChatPanel from './chat-panel';
import Messages from './messages';
import CanvasBackground from './canvas-background';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Attachment, Message } from 'ai';
import { Model } from '@/lib/types/models';
import {
  PlanDirectEditor,
  PlanDirectEditorLoading,
} from './plan-direct-editor';
import { getCookie } from '@/lib/utils/cookies';
import { useRouter, useSearchParams } from 'next/navigation';

export function Chat({
  models,
  initialMessages = [],
}: {
  models: Model[];
  initialMessages?: Message[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    isLoading,
    status,
    input,
    setInput,
    stop,
    reload,
    handleInputChange,
    messages,
    setMessages,
    handleSubmit,
    append,
    id: chatId, // 获取useChat生成的实际ID
  } = useChat({
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    initialMessages,
    maxSteps: 10,
    onError: () => {
      toast.error('发生了一个意外，请重试！');
    },
  });

  const stableHandleInputChange = useCallback(handleInputChange, [
    handleInputChange,
  ]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // 计划模式状态管理
  interface Plan {
    id: string;
    title: string;
    description: string;
    steps: string[];
    advantages: string[];
    step_num: number;
  }

  const [planMode, setPlanMode] = useState<{
    status: 'idle' | 'generating' | 'ready' | 'executing';
    currentPlan: Plan | null;
    isMinimized: boolean;
  }>({
    status: 'idle',
    currentPlan: null,
    isMinimized: false,
  });

  // 检查当前模式
  const [currentMode, setCurrentMode] = useState('normal');
  const [previousMode, setPreviousMode] = useState('normal');

  // 追踪是否已经生成过计划
  const [planGenerated, setPlanGenerated] = useState(false);

  useEffect(() => {
    const mode = getCookie('mode') || 'normal';
    setCurrentMode(mode);
  }, []);

  // 监听 URL 参数变化，检测新对话请求
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam) {
      // 检测到新对话参数，执行重置
      console.log('[Chat Debug] New chat detected from URL param:', newParam);

      // 停止当前请求
      stop();

      // 重置useChat状态
      setMessages([]);
      setInput('');

      // 重置附件
      setAttachments([]);

      // 重置计划模式状态
      setPlanMode({
        status: 'idle',
        currentPlan: null,
        isMinimized: false,
      });
      setPlanGenerated(false);

      // 清理 URL 参数，避免重复触发
      router.replace('/chat');
    }
  }, [searchParams, stop, setMessages, setInput, setAttachments, router]);

  // 监听模式变化，当从计划模式切换到其他模式时重置计划状态
  useEffect(() => {
    // 只有当从计划模式切换到其他模式时才重置状态
    if (previousMode === 'plan' && currentMode !== 'plan') {
      setPlanMode({
        status: 'idle',
        currentPlan: null,
        isMinimized: false,
      });
      setPlanGenerated(false);
    }

    // 更新前一个模式
    setPreviousMode(currentMode);
  }, [currentMode, previousMode]);

  // 监听消息变化，如果消息被清空则重置计划状态
  useEffect(() => {
    if (messages.length === 0) {
      setPlanMode({
        status: 'idle',
        currentPlan: null,
        isMinimized: false,
      });
      setPlanGenerated(false);
    }
  }, [messages.length]);

  // 添加调试日志来追踪messages状态变化
  useEffect(() => {
    console.log('[Chat Debug] Messages changed:', messages.length, messages);

    // 如果是计划模式且收到了AI回复，尝试解析计划
    if (currentMode === 'plan' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        try {
          // 尝试解析JSON格式的计划（单个对象）
          const content = lastMessage.content;
          if (content.includes('{') && content.includes('}')) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const plan = JSON.parse(jsonMatch[0]) as Plan;
              if (plan && plan.title && plan.steps) {
                // 为计划添加唯一ID
                const planWithId = {
                  ...plan,
                  id: `plan-${Date.now()}`,
                };
                setPlanMode((prev) => ({
                  ...prev,
                  status: 'ready',
                  currentPlan: planWithId,
                }));

                // 注意：不再需要手动过滤消息，Messages组件会自动处理
              }
            }
          }
        } catch (error) {
          console.error('Failed to parse plan:', error);
        }
      }
    }
  }, [messages, currentMode]);

  useEffect(() => {
    console.log('[Chat Debug] Status changed:', status);
  }, [status]);

  // 计划模式处理函数
  const handlePlanExecute = useCallback(
    (modifiedPlan: Plan) => {
      setPlanMode((prev) => ({
        ...prev,
        status: 'executing',
        currentPlan: null, // 清除当前计划显示
      }));

      // 构造执行计划的消息
      const executionPrompt = `请执行以下计划：

标题：${modifiedPlan.title}
描述：${modifiedPlan.description}

执行步骤：
${modifiedPlan.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

请按照上述步骤逐一执行，并提供详细的执行过程和结果。`;

      // 标记已生成计划，避免重复生成
      setPlanGenerated(true);

      // 使用 append 方法直接添加消息并触发AI响应
      append({
        role: 'user',
        content: executionPrompt,
      });
    },
    [append, setPlanGenerated]
  );

  const handlePlanDismiss = useCallback(() => {
    setPlanMode((prev) => ({
      ...prev,
      currentPlan: null,
      status: 'idle',
    }));
  }, []);

  // 统一的新对话重置函数
  const handleNewChat = useCallback(() => {
    // 停止当前请求
    stop();

    // 重置useChat状态
    setMessages([]);
    setInput('');

    // 重置附件
    setAttachments([]);

    // 重置计划模式状态
    setPlanMode({
      status: 'idle',
      currentPlan: null,
      isMinimized: false,
    });
    setPlanGenerated(false);

    // 导航到新的聊天页面，确保完全重置
    router.push('/chat');
  }, [stop, setMessages, setInput, setAttachments, router]);

  // 包装 handleSubmit 以支持附件
  const stableHandleSubmit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();

      // 检查是否是第一条消息
      const isFirstMessage = messages.length === 0;

      // 只有在计划模式、未生成过计划、且是第一条消息时才生成计划
      if (currentMode === 'plan' && !planGenerated && isFirstMessage) {
        setPlanMode((prev) => ({
          ...prev,
          status: 'generating',
          currentPlan: null,
        }));
        // 标记即将生成计划
        setPlanGenerated(true);
      }

      // 调用 useChat 的 handleSubmit，传递附件
      handleSubmit(event, {
        experimental_attachments:
          attachments.length > 0 ? attachments : undefined,
      });

      // 发送后清空附件
      setAttachments([]);
    },
    [
      handleSubmit,
      attachments,
      messages.length,
      currentMode,
      planGenerated,
      setPlanGenerated,
    ]
  );
  const className = useMemo(
    () =>
      `w-full flex flex-col items-center bg-white ${
        messages.length <= 0 ? 'min-h-screen justify-center' : 'h-full'
      }`,
    [messages.length]
  );

  return (
    <div className={`${className} relative`}>
      {/* 在没有发生对话的时候显示Canvas背景 */}
      {messages.length === 0 && (
        <CanvasBackground gridSize={25} animationSpeed={0.18} />
      )}

      {messages.length > 0 && (
        <Messages
          reload={reload}
          status={status}
          messages={messages}
          setMessages={setMessages}
        />
      )}

      {/* 对话页面的蒙版 */}
      {messages.length == 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 1,
            backgroundImage:
              'linear-gradient(to top, rgba(255,255,255,0.7), transparent)',
            backgroundSize: '100% 25vh',
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat',
            height: '25vh',
          }}
        />
      )}

      {messages.length == 0 && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 1,
            backgroundImage:
              'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)',
            backgroundSize: '100% 25vh',
            backgroundPosition: 'top',
            backgroundRepeat: 'no-repeat',
            height: '25vh',
          }}
        />
      )}

      {/* 计划模式UI - 绝对定位浮在内容之上 */}
      {currentMode === 'plan' &&
        planMode.status === 'generating' &&
        !planMode.currentPlan && <PlanDirectEditorLoading />}

      {currentMode === 'plan' &&
        planMode.status === 'ready' &&
        planMode.currentPlan && (
          <PlanDirectEditor
            plan={planMode.currentPlan}
            onExecute={handlePlanExecute}
            onDismiss={handlePlanDismiss}
          />
        )}

      <ChatPanel
        input={input}
        stop={stop}
        status={status}
        chatId={chatId || ''}
        reload={reload}
        handleInputChange={stableHandleInputChange}
        messages={messages}
        setMessages={setMessages}
        attachments={attachments}
        setAttachments={setAttachments}
        handleSubmit={stableHandleSubmit}
        handleNewChat={handleNewChat}
        isLoading={isLoading}
        models={models}
        onModeChange={setCurrentMode}
      />
    </div>
  );
}
