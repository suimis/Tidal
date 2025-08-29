// hooks/usePlanner.ts
import { useState } from 'react';

type Plan = {
  title: string;
  description: string;
  steps: string[];
  advantages: string[];
};

export function usePlanner() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlans = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPrompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        try {
          const parsed = JSON.parse(buffer);
          setPlans(parsed);
          buffer = ''; // 清空缓冲区
        } catch {
          // JSON解析不完整时继续等待
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成计划失败');
      setPlans([
        {
          title: '备用方案',
          description: '遇到技术问题，已通知工程师处理',
          steps: ['请稍后再试'],
          advantages: ['24小时技术支持'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { plans, generatePlans, isLoading, error };
}
