import { getFormattedTime } from '@/hooks/useCurrentTime';
import { UIMessage } from 'ai';
import { useEffect, useState, useRef, useCallback } from 'react';
import MessageReasoning from './message-reasoning';
import { getCookie } from '@/lib/utils/cookies';

import { Model } from '@/lib/types/models';
import { motion } from 'framer-motion';
import { Markdown } from '@/components/markdown';
import MessageActions from './message-actions';
import { UseChatHelpers } from '@ai-sdk/react';
import useMarkdownToImage from '@/hooks/use-markdown-to-image';
import { Weather } from './weather';
import { cx } from 'class-variance-authority';
import { getFileIcon } from '@/lib/utils/file-upload';
import Image from 'next/image';

interface MessageProps {
  message: UIMessage;
  status: UseChatHelpers['status'];
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export default function Message({
  message,
  setMessages,
  status,
  reload,
  onClick,
  active = false,
}: MessageProps) {
  const [time, setTime] = useState('');
  const [isExpand, setIsExpand] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isLoading =
    active && (status === 'streaming' || status === 'submitted');

  const [model, setModel] = useState<Model | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const { containerRef, convertToImage } = useMarkdownToImage();

  // 处理重新发送消息
  const handleResend = useCallback(
    (resendMessage: UIMessage) => {
      // 创建新的用户消息
      const newUserMessage: UIMessage = {
        ...resendMessage,
        id: Date.now().toString(), // 生成新的ID
        role: 'user',
        content: resendMessage.content,
        parts: [{ type: 'text', text: resendMessage.content }],
      };

      setMessages((prevMessages) => {
        const index = prevMessages.findIndex((m) => m.id === resendMessage.id);
        if (index === -1) return prevMessages;

        // 保留原始消息之前的所有消息，加上新的用户消息，并删除之后的消息
        const newMessages = prevMessages.slice(0, index);
        newMessages.push(newUserMessage);
        return newMessages;
      });

      // 使用setTimeout等待状态更新后触发reload
      setTimeout(() => {
        reload();
      }, 0);
    },
    [setMessages, reload]
  );

  // 处理编辑消息
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    // 获取消息的文本内容
    const textContent = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
    setEditedContent(textContent);
  }, [message]);

  // 保存编辑并重新发送
  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);

    // 创建新的编辑后消息
    const editedMessage: UIMessage = {
      ...message,
      id: Date.now().toString(), // 生成新ID
      content: editedContent,
      parts: [{ type: 'text', text: editedContent }],
    };

    setMessages((prevMessages) => {
      const index = prevMessages.findIndex((m) => m.id === message.id);
      if (index === -1) return prevMessages;

      // 替换原始消息为编辑后的消息
      const newMessages = [...prevMessages];
      newMessages[index] = editedMessage;

      // 删除原始消息之后的所有消息
      return newMessages.slice(0, index + 1);
    });

    // 触发重新生成
    setTimeout(() => {
      reload();
    }, 0);
  }, [editedContent, message, setMessages, reload]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleConvertToImage = () => {
    convertToImage()
      .then((imageData) => {
        const link = document.createElement('a');
        link.download = 'markdown-image.png';
        link.href = imageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error('转换失败:', error);
      });
  };

  useEffect(() => {
    const savedModel = getCookie('selectedModel');
    if (savedModel) {
      try {
        const activeModel = JSON.parse(savedModel) as Model;
        setModel(activeModel);
      } catch (e) {
        console.error('Failed to parse saved model:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setHasOverflow(
        element.scrollWidth > element.clientWidth && status === 'ready'
      );
    }
  }, [message]);

  useEffect(() => {
    setTime(getFormattedTime());
  }, []);

  return (
    <div className={`${isExpand ? 'w-224' : 'w-168'}`}>
      <section
        ref={containerRef}
        className={`chat-card cursor-pointer space-y-3.5 w-full border-2 p-1.5 rounded-3xl duration-100
        ${
          isEditing
            ? 'border-indigo-400 bg-indigo-100 dark:bg-indigo-900/30'
            : ''
        }
dark:border-neutral-800
dark:bg-neutral-900
group hover:border-indigo-200 dark:hover:border-indigo-800
${
  active
    ? 'border-indigo-200 bg-indigo-200/50'
    : 'border-neutral-200 bg-neutral-100'
}`}
        onClick={onClick}
      >
        <section
          className={`overflow-visible relative rounded-2xl duration-200 border-2 bg-neutral-50 px-4 py-5 shadow-lg shadow-neutral-200/50 dark:bg-neutral-950 dark:shadow-neutral-800/50 dark:border-neutral-800 ${
            active ? 'border-indigo-200' : 'border-neutral-200'
          }`}
        >
          <div className="w-full cursor-text pr-2 align-middle text-sm leading-6">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full p-2 border rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    onClick={handleCancelEdit}
                  >
                    取消
                  </button>
                  <button
                    className="px-3 py-1 bg-indigo-500 text-white rounded-lg"
                    onClick={handleSaveEdit}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {active && (
                    <span className="loading-animation pointer-events-none z-50 h-4 w-4 rounded-full inline-block mr-2 scale-75"></span>
                  )}
                  <h1 className="text-xl font-semibold">
                    {message.role === 'user' ? '' : 'AI'}
                  </h1>
                  {hasOverflow && (
                    <div
                      className="ai-expand ml-auto cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpand(!isExpand);
                      }}
                    >
                      {isExpand ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-minimize2 size-4 transition-colors rotate-45 text-indigo-500"
                        >
                          <polyline points="4 14 10 14 10 20"></polyline>
                          <polyline points="20 10 14 10 14 4"></polyline>
                          <line x1="14" x2="21" y1="10" y2="3"></line>
                          <line x1="3" x2="10" y1="21" y2="14"></line>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-maximize2 size-4 transition-colors rotate-45 text-indigo-500"
                        >
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" x2="14" y1="3" y2="10"></line>
                          <line x1="3" x2="10" y1="21" y2="14"></line>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4 w-full">
                  {message.parts.map((part, i) => {
                    const { type } = part;
                    const key = `message-${message.id}-part-${i}`;
                    if (type === 'reasoning') {
                      return (
                        <MessageReasoning
                          key={key}
                          active={active}
                          isLoading={active && status === 'streaming'}
                          reasoning={part.reasoning}
                        />
                      );
                    }

                    if (type === 'text') {
                      return (
                        <div
                          ref={contentRef}
                          key={`${message.id}-${i}`}
                          className="message-text scrollbar-nice mt-1 w-full cursor-text overflow-auto pr-2 text-sm"
                        >
                          {message.role === 'user' ? (
                            <motion.div
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              {part.text}
                            </motion.div>
                          ) : (
                            <div className="flex flex-col">
                              <Markdown>{part.text}</Markdown>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (type === 'tool-invocation') {
                      const { toolInvocation } = part;
                      const { toolName, toolCallId, state } = toolInvocation;

                      if (state === 'call') {
                        // 暂时移除未使用的args变量
                        return (
                          <div
                            key={toolCallId}
                            className={cx({
                              skeleton: ['getWeather'].includes(toolName),
                            })}
                          >
                            <Weather />
                          </div>
                        );
                      }

                      if (state === 'result') {
                        const { result } = toolInvocation;

                        return (
                          <div key={toolCallId}>
                            <Weather weatherAtLocation={result} />
                          </div>
                        );
                      }
                    }
                  })}

                  {/* 显示附件 - 添加类型安全 */}
                  {message.experimental_attachments &&
                    message.experimental_attachments.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {message.experimental_attachments.map(
                          (attachment, index) => (
                            <div key={index} className="flex flex-col gap-2">
                              {attachment.contentType?.startsWith('image/') ? (
                                <div className="relative group">
                                  <Image
                                    src={attachment.url}
                                    alt={
                                      attachment.name || `attachment-${index}`
                                    }
                                    width={200}
                                    height={200}
                                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 object-cover max-w-xs"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {attachment.name}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                                  <span className="text-2xl">
                                    {getFileIcon(
                                      attachment.contentType ||
                                        'application/octet-stream'
                                    )}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {attachment.name}
                                    </span>
                                    <span className="text-xs text-neutral-500">
                                      {attachment.contentType}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="flex w-full items-center justify-between px-1 font-mono text-[0.65rem]">
          {message.role === 'user' ? (
            <>
              <div className="inline-flex items-center gap-1 rounded-full bg-neutral-200 py-1 pl-2 pr-2.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <div className="size-5">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full absolute aspect-square h-full animate-overlayShow cursor-pointer border-2 shadow duration-200 pointer-events-none">
                    <img
                      className="aspect-square size-full object-cover"
                      src="../avatar.jpg"
                    />
                  </span>
                </div>
                <span className="text-neutral-600 dark:text-neutral-400">
                  我
                </span>
              </div>
              <span className="ml-auto">{time}</span>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1 rounded-full bg-neutral-200 py-1 pl-2 pr-2.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <div className="size-5">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full absolute aspect-square h-full animate-overlayShow cursor-pointer border-2 shadow duration-200 pointer-events-none">
                    <img
                      src={`/providers/logos/${
                        model?.providerId || 'openai'
                      }.svg`}
                      alt={model?.providerId || 'AI'}
                      width={18}
                      height={18}
                      className="bg-white rounded-full border"
                    />
                  </span>
                </div>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {model?.name || 'AI'}
                </span>
              </div>
              <span className="ml-auto">{time}</span>
            </>
          )}
        </div>
      </section>

      {!isLoading && (
        <MessageActions
          setMessages={setMessages}
          message={message}
          reload={reload}
          convertToImage={handleConvertToImage}
          onResend={handleResend}
          onEdit={handleEditClick}
        />
      )}
    </div>
  );
}
