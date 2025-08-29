import { UseChatHelpers } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { useScrollToBottom } from './use-scroll-to-bottom';
import Message from './message';
import { isPlanJsonMessage } from '@/lib/utils';
import { getCookie } from '@/lib/utils/cookies';
interface MessagesProps {
  status: UseChatHelpers['status'];
  reload: UseChatHelpers['reload'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
}

export default function Messages({
  status,
  reload,
  messages,
  setMessages,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>(status !== 'ready');

  // 获取当前模式
  const currentMode = getCookie('mode') || 'normal';

  // 过滤消息：在计划模式下隐藏包含计划JSON的消息
  const filteredMessages = messages.filter((message) => {
    if (currentMode === 'plan' && isPlanJsonMessage(message)) {
      return false; // 不显示计划JSON消息
    }
    return true;
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col items-center w-full min-w-0 gap-12 flex-1 overflow-y-scroll pt-4 bg-transparent scrollbar-nice"
    >
      {filteredMessages.map((message, idx) => (
        <Message
          key={message.id}
          message={message}
          setMessages={setMessages}
          reload={reload}
          active={idx + 1 === filteredMessages.length}
          status={status}
        ></Message>
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}
