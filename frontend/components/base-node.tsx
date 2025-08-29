import { forwardRef, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const BaseNode = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      className,
      selected ? 'border-neutral-200 bg-neutral-100' : ''
    )}
    tabIndex={0}
    {...props}
  />
));

BaseNode.displayName = 'BaseNode';
