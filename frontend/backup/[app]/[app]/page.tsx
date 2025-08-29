'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputForm from '@/app/(coze)/coze/components/InputForm';
import ResultsView from '@/app/(coze)/coze/components/ResultsView';
import CanvasBackground from '@/components/canvas-background';

interface ResultsData {
  data_list: string[];
  output: string;
  output1: string;
}

export default function CozePage() {
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const router = useRouter();

  // 处理表单提交
  const handleFormSubmit = (data: {
    input: string;
    wordLimit: string;
    results: ResultsData;
  }) => {
    setResults(data.results);
    setShowResults(true);
  };

  // 处理错误
  const handleError = (error: string) => {
    console.error('生成错误:', error);
    // 延迟跳转到错误页面，让用户看到错误信息
    setTimeout(() => {
      router.push('/coze/error');
    }, 2000);
  };

  // 处理返回输入
  const handleBackToInput = () => {
    setShowResults(false);
    setResults(null);
  };

  // 处理发送到后端
  const handleSendToBackend = () => {
    // 这里暂时留空，后续可以实现发送到后端的逻辑
  };

  return (
    <>
      {!showResults ? (
        <div className="w-full h-full">
          <CanvasBackground direction="down-left" />
          {/* 对话页面的蒙版 */}

          <InputForm onSubmit={handleFormSubmit} onError={handleError} />
        </div>
      ) : (
        <ResultsView
          results={null}
          onBack={handleBackToInput}
          onSendToBackend={handleSendToBackend}
        />
      )}
    </>
  );
}
