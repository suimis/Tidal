import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  className,
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-primary',
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
}

// 全屏加载组件
interface FullScreenLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FullScreenLoading({
  className,
  size = 'md',
}: FullScreenLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background fixed inset-0 z-50">
      <LoadingSpinner className={className} size={size} />
    </div>
  );
}

// 按钮加载组件
interface ButtonLoadingProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ButtonLoading({ className, size = 'sm' }: ButtonLoadingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-current',
        sizeClasses[size],
        className
      )}
    />
  );
}
