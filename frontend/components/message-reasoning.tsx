'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, LoaderIcon } from 'lucide-react';
import { useState, useEffect } from 'react'; // 新增 useEffect

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
  active: boolean;
}

export default function MessageReasoning({
  isLoading,
  reasoning,
  active,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 新增 useEffect 监听加载状态变化
  useEffect(() => {
    if (!isLoading) {
      // 当加载完成时自动折叠
      setIsExpanded(false);
    }
  }, [isLoading]);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col message-reasoning">
      {isLoading && active ? (
        <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
          <div className="font-medium">深度思考中...</div>
          <div className="animate-spin">
            <LoaderIcon className="size-3" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center text-xs text-muted-foreground">
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon
              className={`size-3 transition-transform ${
                isExpanded ? '' : '-rotate-90'
              }`}
            />
          </button>
          <div className="font-medium">深度思考结果</div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {(isLoading || isExpanded) && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate={
              isLoading ? 'expanded' : isExpanded ? 'expanded' : 'collapsed'
            }
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
