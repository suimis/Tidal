import {
  CopyIcon,
  FilePenLine,
  Image,
  Maximize,
  Proportions,
  RefreshCcw,
  Text,
  Trash2,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import removeMd from 'remove-markdown';
import { Separator } from './ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Markdown } from './markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { UseChatHelpers } from '@ai-sdk/react';
import { UIMessage } from 'ai';

interface MessageActionsProps {
  setMessages: UseChatHelpers['setMessages'];
  message: UIMessage;
  reload: UseChatHelpers['reload'];
  convertToImage: () => void;
  onResend?: (message: UIMessage) => void; // 添加重新发送回调函数
  onEdit: () => void; // 添加编辑回调函数
}

export default function MessageActions({
  setMessages,
  message,
  reload,
  convertToImage,
  onResend,
  onEdit, // 添加 onEdit 属性
}: MessageActionsProps) {
  const copyToClipboard = useCopyToClipboard()[1];
  const [copyType, setCopyType] = useState<'text' | 'markdown'>('markdown');
  const [textFromParts, setTextFromParts] = useState('');
  const [open, setOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    setTextFromParts(
      message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n')
        .trim()
    );
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row items-center space-x-1 mt-2 h-5">
        {message.role !== 'user' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={() => {
                    setCopyType(copyType === 'text' ? 'markdown' : 'text');
                  }}
                >
                  {copyType === 'text' ? (
                    <Text className="size-3" />
                  ) : (
                    <Proportions className="size-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {copyType === 'text' ? '文本' : 'Markdown'}
              </TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-[1rem]!" />
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
              onClick={async () => {
                if (!textFromParts) {
                  toast.error('没有文字可以被复制！');
                  return;
                }

                if (copyType === 'markdown') {
                  copyToClipboard(textFromParts);
                }

                if (copyType === 'text') {
                  const copyText = removeMd(textFromParts);
                  await copyToClipboard(copyText);
                }
                toast.success('复制成功！');
              }}
            >
              <CopyIcon className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">复制</TooltipContent>
        </Tooltip>

        {/* 为用户消息添加编辑按钮 */}
        {message.role === 'user' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={onEdit} // 调用 onEdit 回调函数
                >
                  <FilePenLine className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">编辑</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={() => onResend && onResend(message)}
                >
                  <RefreshCcw className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">重新发送</TooltipContent>
            </Tooltip>
          </>
        )}

        {message.role !== 'user' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={() => {
                    setMessages((messages) => {
                      const index = messages.findIndex(
                        (m) => m.id === message.id
                      );

                      if (index !== -1) {
                        const updatedMessage = {
                          ...message,
                          content: message.content,
                          parts: [
                            { type: 'text' as const, text: message.content },
                          ],
                        };

                        return [
                          ...messages.slice(0, index),
                          updatedMessage,
                          ...messages.slice(index + 1),
                        ];
                      }

                      return messages;
                    });
                    reload();
                  }}
                >
                  <RefreshCcw className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">重新生成</TooltipContent>
            </Tooltip>
            <Drawer direction="right" open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="rounded-md py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                      onClick={() => setOpen(!open)}
                    >
                      <Maximize className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">查看更多</TooltipContent>
                </Tooltip>
              </DrawerTrigger>

              <DrawerContent className="!min-w-3xl">
                <DrawerHeader>
                  <DrawerTitle>
                    <div className="flex items-center">
                      <span className="flex items-center ml-auto gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="flex items-center gap-1 text-xs rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                              onClick={async () => {
                                if (!textFromParts) {
                                  toast.error('没有文字可以被复制！');
                                  return;
                                }

                                if (copyType === 'markdown') {
                                  copyToClipboard(textFromParts);
                                }

                                if (copyType === 'text') {
                                  const copyText = removeMd(textFromParts);
                                  copyToClipboard(copyText);
                                }
                                toast.success('复制成功！');
                              }}
                            >
                              <CopyIcon className="size-3" />
                              复制
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">复制</TooltipContent>
                        </Tooltip>
                        <Separator
                          orientation="vertical"
                          className="h-[1rem]!"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="rounded-md py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                              onClick={() => setOpen(false)}
                            >
                              <X className="size-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            关闭窗口
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </div>
                  </DrawerTitle>
                </DrawerHeader>
                <div className="mx-auto w-full px-4 pb-10 overflow-y-auto">
                  <Markdown>{textFromParts}</Markdown>
                </div>
              </DrawerContent>
            </Drawer>
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={() => {}}
                >
                  <FilePenLine className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">文本编辑器</TooltipContent>
            </Tooltip> */}

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-red-200/50"
                      onClick={() => {
                        setAlertOpen(true);
                      }}
                    >
                      <Trash2 className="size-3 text-red-600/80" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">删除对话</TooltipContent>
                </Tooltip>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>你确定要删除该节点吗？</AlertDialogTitle>
                  <AlertDialogDescription>
                    该操作无法被撤销。请确认你是否需要删除！
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setMessages((messages) => {
                        const index = messages.findIndex(
                          (m) => m.id === message.id
                        );

                        if (index !== -1) {
                          return [
                            ...messages.slice(0, index),
                            ...messages.slice(index + 1),
                          ];
                        }
                        return messages;
                      });
                    }}
                  >
                    确认
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md  py-2 px-2 h-fit duration-20 text-muted-foreground cursor-pointer hover:bg-neutral-200/50"
                  onClick={() => {
                    convertToImage();
                  }}
                >
                  <Image className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">导出为图片</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
