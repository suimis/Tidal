'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function CozeErrorPage() {
  const router = useRouter();

  const handleRetry = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen py-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
            生成失败
          </h1>
          <p className="text-red-600 dark:text-red-300">
            抱歉，内容生成过程中出现了错误。请稍后重试。
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            可能的原因：
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              网络连接不稳定
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              服务器暂时不可用
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              输入内容格式不正确
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              API 服务暂时异常
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            如果问题持续存在，请联系技术支持
          </p>
        </div>
      </div>
    </div>
  );
}
