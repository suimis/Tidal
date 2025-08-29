'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { getCookie } from '@/lib/utils/cookies';

interface Application {
  name: string;
  api_url: string;
  api_key: string;
  type: string;
  icon: string;
  member_count?: number;
}

interface ApplicationContextType {
  applications: Application[];
  loading: boolean;
  refreshApplications: () => Promise<void>;
  updateApplication: (updatedApp: Application) => void;
  addApplication: (newApp: Application) => void;
  removeApplication: (appName: string) => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error(
      'useApplications must be used within an ApplicationProvider'
    );
  }
  return context;
};

interface ApplicationProviderProps {
  children: ReactNode;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({
  children,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取认证相关的cookies
  const getAuthCookies = () => {
    const cookies = [
      'sessionid', // Django 默认session cookie
      'csrftoken', // Django CSRF token
    ];

    const authCookies: Record<string, string> = {};

    cookies.forEach((name) => {
      const value = getCookie(name);
      if (value) {
        authCookies[name] = value;
      }
    });

    return authCookies;
  };

  // 获取应用列表
  const fetchApplications = async () => {
    try {
      setLoading(true);

      // 检查用户是否已登录
      const userCookie = getCookie('user');
      const sessionCookie = getCookie('sessionid');

      // 如果用户未登录，不发送请求，直接设置为空列表
      if (!userCookie || !sessionCookie) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // 获取认证相关的cookies
      const authCookies = getAuthCookies();

      // 创建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 添加CSRF Token（如果存在）
      if (authCookies.csrftoken) {
        headers['X-CSRFToken'] = authCookies.csrftoken;
      }

      // 构建cookie字符串
      const cookieString = Object.entries(authCookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

      // 如果存在cookies，添加到请求头
      if (cookieString) {
        headers['Cookie'] = cookieString;
      }

      // 发送请求获取用户的应用列表
      const response = await fetch('http://localhost:8000/GPT/getApps', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `请求失败: ${response.status} ${response.statusText} - ${
            errorData.message || ''
          }`
        );
      }

      const data = await response.json();

      if (data.status === 'success') {
        setApplications(data.applications || []);
      } else {
        throw new Error(data.message || '后端返回状态错误');
      }
    } catch (err) {
      // 只在用户已登录但请求失败时显示错误
      const userCookie = getCookie('user');
      const sessionCookie = getCookie('sessionid');
      if (userCookie && sessionCookie) {
        console.error('获取应用失败:', err);
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // 刷新应用列表
  const refreshApplications = async () => {
    await fetchApplications();
  };

  // 更新应用
  const updateApplication = (updatedApp: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.name === updatedApp.name ? updatedApp : app))
    );
  };

  // 添加应用
  const addApplication = (newApp: Application) => {
    setApplications((prev) => [...prev, newApp]);
  };

  // 删除应用
  const removeApplication = (appName: string) => {
    setApplications((prev) => prev.filter((app) => app.name !== appName));
  };

  // 初始化时获取应用列表
  useEffect(() => {
    fetchApplications();
  }, []);

  const value: ApplicationContextType = {
    applications,
    loading,
    refreshApplications,
    updateApplication,
    addApplication,
    removeApplication,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};
