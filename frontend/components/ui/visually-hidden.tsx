import { cn } from '@/lib/utils';

const VisuallyHidden = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => {
  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )}
      {...props}
    />
  );
};

export { VisuallyHidden };
