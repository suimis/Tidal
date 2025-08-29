/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Textarea from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UploadButton from '@/components/upload-button';
import { Loader2, Clock, Send, Square } from 'lucide-react';
import { Attachment } from 'ai';
import {
  uploadFileToCoze,
  getFileIcon,
  formatFileSize,
  generateAcceptString,
  FILE_TYPE_GROUPS,
} from '@/lib/utils/coze-file-upload';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CozeAPI } from '@coze/api';

interface ExecutionStage {
  nodeId?: string;
  nodeTitle?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

interface InputFormProps {
  onSubmit: (data: { input: string; wordLimit: string; results: any }) => void;
  onError: (error: string) => void;
}

export default function InputForm({ onSubmit, onError }: InputFormProps) {
  const [input, setInput] = useState('');
  const [wordLimit, setWordLimit] = useState('500');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 流式响应相关状态
  const [executionStages, setExecutionStages] = useState<ExecutionStage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string>('');

  // 计时器相关状态
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用useEffect管理计时器生命周期
  useEffect(() => {
    return () => {
      // 组件卸载时清理计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleWordLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWordLimit(e.target.value);
    },
    []
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      setIsUploading(true);

      try {
        const result = await uploadFileToCoze(
          file,
          FILE_TYPE_GROUPS.all.mimeTypes
        );
        const uploadedAttachment = result?.attachment;

        if (uploadedAttachment) {
          setAttachment(uploadedAttachment);
        }
      } catch {
        // 文件上传失败，静默处理
      } finally {
        setIsUploading(false);
        // 重置文件输入值，允许重复选择相同文件
        event.target.value = '';
      }
    },
    []
  );

  const removeAttachment = useCallback(() => {
    setAttachment(null);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsStreaming(true);
    setStreamProgress(0);
    setCurrentStage('初始化工作流...');
    setExecutionStages([]);
    setStreamError('');

    // 启动计时器
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    // 清除之前的计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 设置新的计时器 - 每秒更新一次，避免频繁重新渲染
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(Math.floor(elapsed / 1000) * 1000); // 取整到秒，避免毫秒级闪烁
    }, 1000);

    try {
      // 获取环境变量
      const apiToken = process.env.NEXT_PUBLIC_COZE_API_TOKEN;
      const workflowId = process.env.NEXT_PUBLIC_COZE_WORKFLOW_ID;
      const appId = process.env.NEXT_PUBLIC_COZE_APP_ID;

      if (!apiToken || !workflowId || !appId) {
        throw new Error('缺少必要的环境变量配置');
      }

      // 初始化执行阶段
      const initialStages: ExecutionStage[] = [
        {
          nodeTitle: '开始执行',
          status: 'running',
          message: '正在启动工作流...',
        },
      ];
      setExecutionStages(initialStages);

      // 初始化 Coze API 客户端
      const apiClient = new CozeAPI({
        token: apiToken,
        baseURL: 'https://api.coze.cn',
        allowPersonalAccessTokenInBrowser: true,
      });

      // 更新进度
      setStreamProgress(10);
      setCurrentStage('连接到 Coze 服务器...');

      // 调用 Coze 工作流 - 使用流式端点
      console.log('开始调用流式工作流...');
      const response = await apiClient.workflows.runs.create({
        workflow_id: workflowId,
        parameters: {
          input: input.trim(),
          zishu: wordLimit,
        },
      });
      console.log('工作流调用成功');

      // 注意：流式处理需要根据Coze API的具体实现来处理
      // 这里暂时使用原有的处理方式，后续可以根据需要实现真正的流式处理

      // 更新进度
      setStreamProgress(25);
      setCurrentStage('工作流执行中...');

      // 处理响应数据
      if (response.data) {
        // 添加调试日志
        console.log('原始响应数据:', response.data);
        console.log('响应数据类型:', typeof response.data);

        // 解析响应数据
        let outputData: unknown = response.data;

        // 如果 response.data 是字符串，尝试解析为 JSON
        if (typeof response.data === 'string') {
          try {
            outputData = JSON.parse(response.data);
            console.log('JSON解析成功:', outputData);
          } catch (error) {
            console.error('JSON解析失败:', error);
            // 如果解析失败，直接使用原始字符串
            outputData = response.data;
          }
        }

        // 更新进度
        setStreamProgress(50);
        setCurrentStage('解析响应数据...');

        // 直接使用解析后的数据作为最终结果
        let parsedData: any = null;

        if (typeof outputData === 'object' && outputData !== null) {
          parsedData = outputData;
          console.log('最终解析数据:', parsedData);
        } else {
          // 如果不是对象，尝试再次解析
          try {
            parsedData = JSON.parse(response.data as string);
            console.log('二次解析成功:', parsedData);
          } catch {
            console.error('二次解析失败，使用默认结构');
            // 如果解析失败，使用默认结构
            parsedData = {
              data_list: [],
              output: '',
              output1: '',
            };
          }
        }

        // 更新进度
        setStreamProgress(75);
        setCurrentStage('验证数据格式...');

        if (
          parsedData &&
          parsedData.data_list &&
          Array.isArray(parsedData.data_list)
        ) {
          // 更新进度
          setStreamProgress(90);
          setCurrentStage('处理完成，正在生成结果...');

          // 更新最终状态
          setStreamProgress(100);
          setCurrentStage('执行完成');
          setExecutionStages((prev) =>
            prev.map((stage) =>
              stage.status === 'running'
                ? { ...stage, status: 'completed', message: '执行完成' }
                : stage
            )
          );

          // 延迟提交结果，让用户看到100%完成状态
          setTimeout(() => {
            onSubmit({
              input: input.trim(),
              wordLimit,
              results: parsedData,
            });
          }, 1000);
        } else {
          throw new Error('响应数据格式不正确');
        }
      } else {
        throw new Error('API 响应缺少数据');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成失败';
      setStreamError(errorMessage);

      // 更新错误状态
      setExecutionStages((prev) =>
        prev.map((stage) =>
          stage.status === 'running'
            ? { ...stage, status: 'error', message: '执行失败' }
            : stage
        )
      );

      // 通知父组件错误
      onError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);

      // 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen py-8">
      <div className="w-full max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Coze 工作流生成
          </h1>
          <p className="text-center text-muted-foreground">
            输入文字和图片，生成精美的内容
          </p>
        </div>

        {/* 主要输入区域 */}
        <section className="mb-6 p-2 bg-white/50 dark:bg-black/50 z-[90] border border-neutral-200/50 dark:border-white/15 rounded-2xl transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700">
          <form
            className="relative min-w-xl flex flex-col gap-4 rounded-lg bg-gradient-to-tr from-neutral-50 to-neutral-200 border-neutral-300/50 border p-2 dark:border-neutral-50/20 dark:from-neutral-800 dark:to-neutral-900"
            onSubmit={handleGenerate}
          >
            <input
              type="file"
              className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
              ref={fileInputRef}
              accept={generateAcceptString(FILE_TYPE_GROUPS.all.mimeTypes)}
              onChange={handleFileChange}
              tabIndex={-1}
            />

            {/* 文字输入区域 */}
            <div className="flex">
              <Textarea
                className="flex-1 input-color font-geist-mono resize-none min-w-xl border-0 p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                rows={2}
                maxRows={5}
                placeholder="请输入要生成的内容..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
            </div>

            {/* 文件预览区域 */}
            {attachment && (
              <div className="flex gap-2 px-2">
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-2 text-xs">
                  <span className="text-lg">
                    {getFileIcon(
                      attachment.contentType || 'application/octet-stream'
                    )}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-32" title={attachment.name}>
                      {attachment.name}
                    </span>
                    <span className="text-neutral-500 text-xs">
                      {formatFileSize(
                        attachment.url ? new Blob([attachment.url]).size : 0
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 上传进度 */}
            {isUploading && (
              <div className="flex gap-2 px-2">
                <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 rounded-lg p-2 text-xs">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    上传中...
                  </span>
                </div>
              </div>
            )}

            {/* 控制按钮区域 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadButton fileInputRef={fileInputRef} status="ready" />
                <Label htmlFor="wordLimit" className="text-sm">
                  字数限制:
                </Label>
                <Input
                  id="wordLimit"
                  className="w-16 h-8 text-sm"
                  placeholder="500"
                  value={wordLimit}
                  onChange={handleWordLimitChange}
                  min="1"
                  max="2000"
                />
                <span className="text-sm text-muted-foreground">字</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Square size={14} /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </section>

        {/* 流式响应进度显示 */}
        {(isStreaming || isLoading) && (
          <section className="mb-6 p-4 bg-white/50 dark:bg-black/50 border border-neutral-200/50 dark:border-white/15 rounded-2xl">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">执行进度</h3>
                {/* 计时器显示 */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.floor(elapsedTime / 60000)}:
                    {Math.floor((elapsedTime % 60000) / 1000)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* 总体进度条 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">总体进度</span>
                  <span className="text-sm text-muted-foreground">
                    {streamProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${streamProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* 当前阶段 */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {currentStage || '正在处理...'}
                  </span>
                </div>
              </div>

              {/* 执行阶段列表 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  执行阶段
                </h4>
                {executionStages.map((stage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex-shrink-0">
                      {stage.status === 'pending' && (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                      {stage.status === 'running' && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {stage.status === 'completed' && (
                        <div className="w-4 h-4 text-green-500">✓</div>
                      )}
                      {stage.status === 'error' && (
                        <div className="w-4 h-4 text-red-500">✗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {stage.nodeTitle || `阶段 ${index + 1}`}
                        </span>
                        <Badge
                          variant={
                            stage.status === 'completed'
                              ? 'default'
                              : stage.status === 'running'
                              ? 'secondary'
                              : stage.status === 'error'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {stage.status === 'pending' && '等待中'}
                          {stage.status === 'running' && '执行中'}
                          {stage.status === 'completed' && '已完成'}
                          {stage.status === 'error' && '错误'}
                        </Badge>
                      </div>
                      {stage.message && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {stage.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 错误信息 */}
              {streamError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-red-500">✗</div>
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      执行错误
                    </span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {streamError}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
