import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import { toast } from 'sonner';

const components: Partial<Components> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: (props: any) => {
    const { inline, className, children } = props;
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
      return (
        <CodeBlock
          key={Math.random()}
          language={match && match[1]}
          value={String(children).replace(/\n$/, '')}
          {...props}
        />
      );
    } else {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  },
  hr: () => <hr className="mt-4" />,
  pre: ({ children }) => <>{children}</>,
  ol: ({ children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ children, ...props }) => {
    return (
      <li className="my-1 marker:prose-bullets" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="list-disc markdown-ul list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ children, ...props }) => {
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      const text = e.currentTarget.textContent;
      if (text) {
        navigator.clipboard.writeText(text);
        toast.success('复制成功！');
      }
    };
    return (
      <strong
        className="cursor-pointer rounded-sm bg-indigo-400/10 px-1 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-400/80 font-normal"
        onClick={handleClick}
        {...props}
      >
        {children}
      </strong>
    );
  },
  a: ({ children, href, ...props }) => {
    return (
      <Link
        href={href || '#'}
        className="inline whitespace-pre-wrap rounded-md bg-neutral-300 box-decoration-clone px-1 text-left font-medium text-neutral-950 no-underline opacity-60 duration-200 hover:opacity-90 dark:bg-neutral-700 dark:text-neutral-50"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-4 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-4 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-4 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-4 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
