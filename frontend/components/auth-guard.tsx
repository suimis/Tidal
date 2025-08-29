'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { FullScreenLoading } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireSuperuser?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireSuperuser = false,
  redirectTo = '/',
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const { canAccess, isLoading } = useRequireAuth(requireSuperuser);

  useEffect(() => {
    if (!isLoading && !canAccess) {
      // 如果未认证或权限不足，重定向到指定页面
      router.replace(redirectTo);
    }
  }, [isLoading, canAccess, router, redirectTo]);

  // 加载中显示 fallback 或默认加载状态
  if (isLoading) {
    return fallback || <FullScreenLoading />;
  }

  // 未认证或权限不足时不渲染内容
  if (!canAccess) {
    return null;
  }

  // 认证通过，渲染子组件
  return <>{children}</>;
}

// 专门用于管理员页面的守卫
export function AdminGuard({
  children,
  redirectTo = '/',
  fallback,
}: Omit<AuthGuardProps, 'requireSuperuser'>) {
  return (
    <AuthGuard
      requireSuperuser={true}
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
}

// 用于普通认证页面的守卫
export function UserGuard({
  children,
  redirectTo = '/',
  fallback,
}: Omit<AuthGuardProps, 'requireSuperuser'>) {
  return (
    <AuthGuard
      requireSuperuser={false}
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
}
