import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UIMessage } from 'ai';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 检查消息是否包含计划JSON
 * @param message - 要检查的消息
 * @returns 如果消息包含计划JSON则返回true
 */
export function isPlanJsonMessage(message: UIMessage): boolean {
  if (message.role !== 'assistant') return false;

  const content = message.content;
  if (!content || !content.includes('{') || !content.includes('}'))
    return false;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 检查是否包含计划的必要字段
      return (
        parsed &&
        typeof parsed.title === 'string' &&
        Array.isArray(parsed.steps) &&
        parsed.steps.length > 0
      );
    }
  } catch {
    // JSON解析失败，不是有效的计划JSON
    return false;
  }

  return false;
}
