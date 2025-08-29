'use client';

import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/utils/cookies';

interface User {
  first_name: string;
  last_name: string;
  department_name: string;
  email: string;
  is_superuser: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userCookie = getCookie('user');
        const sessionCookie = getCookie('sessionid');

        if (userCookie && sessionCookie) {
          const user = JSON.parse(userCookie);

          // 验证用户信息的完整性
          if (user && typeof user === 'object' && user.email) {
            setAuthState({
              isAuthenticated: true,
              user,
              isLoading: false,
            });
            return;
          }
        }

        // 认证失败
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  return authState;
}

export function useRequireAuth(
  requireSuperuser = false
): AuthState & { canAccess: boolean } {
  const authState = useAuth();

  const canAccess =
    authState.isAuthenticated &&
    (!requireSuperuser || authState.user?.is_superuser === true);

  return {
    ...authState,
    canAccess,
  };
}
