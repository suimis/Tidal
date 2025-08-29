'use client';

import { useState, useRef, useCallback } from 'react';
import Textarea from 'react-textarea-autosize';
import ImageUploadButton from './components/image-upload-button';
import { Send, Square, X } from 'lucide-react';
import { Attachment } from 'ai';
import { CozeAPI } from '@coze/api';
import {
  uploadFileToCoze,
  getFileIcon,
  formatFileSize,
  generateAcceptString,
  FILE_TYPE_GROUPS,
} from '@/lib/utils/coze-file-upload';
import AdBackground from './components/ad-background';
import AdLoadingComponent from './components/AdLoadingComponent';
import WordLimitButton from './components/WordLimitButton';
import ResultsView from '@/app/(coze)/coze/components/ResultsView';

export default function AdPage() {
  const [input, setInput] = useState('');
  const [wordLimit, setWordLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<
    (Attachment & { fileId?: string }) | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);

  // 流式响应相关状态
  const [showResults, setShowResults] = useState(false);

  // 方案数据类型
  interface AdSolution {
    title: string;
    subtitle: string;
    decorative_text: string;
    content: string;
    tag: string;
    image: string;
  }

  interface AdResults {
    output: AdSolution[];
  }

  // 工作流返回的原始数据类型
  interface WorkflowOutputItem {
    content: string;
    decorative_text: string;
    image: string;
    subtitle: string;
    tag: string;
    title: string;
  }

  const [results, setResults] = useState<AdResults | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // 取消处理函数
  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort(); // 取消请求
    }
    setIsLoading(false);
    setIsCancelled(true);
    setAbortController(null);
  }, [abortController]);

  // 清理计时器状态
  const cleanupTimerStates = useCallback(() => {
    setIsCancelled(false);
  }, []);

  const handleWordLimitChange = useCallback((value: number) => {
    setWordLimit(value);
  }, []);

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
          FILE_TYPE_GROUPS.images.mimeTypes,
          50 * 1024 * 1024 // 50MB limit for images
        );

        if (result) {
          setAttachment({
            ...result.attachment,
            fileId: result.fileId,
          });
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

  // 配置验证函数
  const validateConfig = () => {
    const apiToken = process.env.NEXT_PUBLIC_COZE_API_TOKEN;
    const workflowId = process.env.NEXT_PUBLIC_COZE_AD_WORKFLOW_ID;
    const appId = process.env.NEXT_PUBLIC_COZE_AD_APP_ID;

    const errors: string[] = [];

    if (!apiToken) {
      errors.push('Coze API Token');
    }
    if (!workflowId) {
      errors.push('AD工作流ID');
    }
    if (!appId) {
      errors.push('AD应用ID');
    }

    if (errors.length > 0) {
      throw new Error(`缺少必要的环境变量配置: ${errors.join(', ')}`);
    }

    return { apiToken, workflowId, appId };
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsCancelled(false); // 重置取消状态

    try {
      // 验证必要参数
      if (!attachment || !input.trim()) {
        throw new Error('请上传图片并输入描述内容');
      }

      // 验证配置
      const { apiToken, workflowId, appId } = validateConfig();

      console.log('使用配置:', { workflowId, appId });

      // 构建请求参数
      const requestBody = {
        workflow_id: workflowId,
        app_id: appId,
        parameters: {
          picture: { file_id: attachment.fileId },
          max_word_amt: wordLimit,
          input: input,
        },
      };

      console.log('发送请求参数:', requestBody);

      // 使用官方Coze SDK
      const apiClient = new CozeAPI({
        token: apiToken!,
        baseURL: 'https://api.coze.cn',
        allowPersonalAccessTokenInBrowser: true,
      });

      // 创建 AbortController
      const controller = new AbortController();
      setAbortController(controller);

      // 使用SDK调用工作流
      const response = await apiClient.workflows.runs.create({
        workflow_id: workflowId!,
        app_id: appId!,
        parameters: {
          picture: {
            file_id: attachment.fileId!,
          },
          max_word_amt: wordLimit,
          input: input,
        },
      });

      console.log('SDK响应:', response);

      // 检查是否已取消，如果已取消则不处理结果
      if (isCancelled) {
        console.log('请求已被用户取消，不处理结果');
        return;
      }

      // 处理响应数据
      let finalResult: AdResults | null = null;

      if (response && response.data) {
        // 根据SDK的实际响应格式处理数据
        console.log('响应数据:', response.data);

        // 确保response.data是对象
        let responseData;
        try {
          responseData =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
        } catch (error) {
          console.error('解析响应数据失败:', error);
          throw new Error('解析响应数据失败');
        }

        console.log('解析后的数据:', responseData);

        // 如果有 data 字段且是字符串，需要再次解析
        if (responseData.data && typeof responseData.data === 'string') {
          try {
            const nestedData = JSON.parse(responseData.data);
            responseData = { ...responseData, ...nestedData };
            console.log('解析嵌套data后的数据:', responseData);
          } catch (error) {
            console.error('解析嵌套data字段失败:', error);
          }
        }

        // 检查是否有output字段且是数组
        if (responseData.output && Array.isArray(responseData.output)) {
          finalResult = {
            output: responseData.output.map(
              (item: WorkflowOutputItem, index: number) => ({
                title: item.title || `方案 ${index + 1}`,
                subtitle: item.subtitle || '',
                decorative_text: item.decorative_text || '',
                content: item.content || '',
                tag: item.tag || '',
                image: item.image || '',
              })
            ),
          };
        }
        // 如果没有output字段，但有content、title、subtitle等数组字段，重新组织数据
        else if (responseData.content && Array.isArray(responseData.content)) {
          const contentArray = responseData.content || [];
          const titleArray = responseData.title || [];
          const subtitleArray = responseData.subtitle || [];
          const decorativeTextArray = responseData.decorative_text || [];
          const imageArray = responseData.image || [];

          finalResult = {
            output: contentArray.map((content: string, index: number) => ({
              title: titleArray[index] || `方案 ${index + 1}`,
              subtitle: subtitleArray[index] || '',
              decorative_text: decorativeTextArray[index] || '',
              content: content || '',
              tag: '#瓶装饮料 #推荐 #小红书',
              image: imageArray[index] || '',
            })),
          };
        }
        // 如果content不是数组，而是单个字符串
        else if (
          responseData.content &&
          typeof responseData.content === 'string'
        ) {
          finalResult = {
            output: [
              {
                title: responseData.title || '方案 1',
                subtitle: responseData.subtitle || '',
                decorative_text: responseData.decorative_text || '',
                content: responseData.content || '',
                tag: '#瓶装饮料 #推荐 #小红书',
                image: responseData.image || '',
              },
            ],
          };
        }
        // 如果都没有，尝试从data字段中解析
        else if (responseData.data && typeof responseData.data === 'string') {
          try {
            const nestedData = JSON.parse(responseData.data);
            if (nestedData.output && Array.isArray(nestedData.output)) {
              finalResult = {
                output: nestedData.output.map(
                  (item: WorkflowOutputItem, index: number) => ({
                    title: item.title || `方案 ${index + 1}`,
                    subtitle: item.subtitle || '',
                    decorative_text: item.decorative_text || '',
                    content: item.content || '',
                    tag: item.tag || '',
                    image: item.image || '',
                  })
                ),
              };
            }
          } catch (error) {
            console.error('解析嵌套data字段失败:', error);
          }
        }

        // 验证最终结果
        if (
          finalResult &&
          finalResult.output &&
          finalResult.output.length > 0
        ) {
          console.log('最终结果:', finalResult);
          setResults(finalResult);
          setShowResults(true);
        } else {
          throw new Error('未收到有效结果或结果格式不正确');
        }
      }

      // 处理最终结果
      if (finalResult) {
        console.log('最终结果:', finalResult);
        setResults(finalResult);
        setShowResults(true);
      } else {
        throw new Error('未收到有效结果');
      }
    } catch (error) {
      // 检查是否是取消导致的错误
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('请求被用户取消');
        return; // 不显示错误提示
      }

      const errorMessage = error instanceof Error ? error.message : '生成失败';
      console.error('生成失败:', error);
      alert(`生成失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen py-8">
      <AdBackground />

      <div className="w-full max-w-4xl px-4 relative z-10">
        {!showResults ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-center mb-2">
                广告工作流
              </h1>
              <p className="text-center text-muted-foreground">
                输入文字和图片，生成精美的广告内容
              </p>
            </div>

            {/* 在同一位置进行内容切换 */}
            <div className="mb-6">
              {!isLoading ? (
                // 初始状态 - 显示输入表单
                <section className="p-2 bg-white/50 dark:bg/black/50 z-[90] border border-neutral-200/50 dark:border-white/15 rounded-2xl transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700">
                  <form
                    className="relative min-w-xl flex flex-col gap-4 rounded-lg bg-gradient-to-tr from-neutral-50 to-neutral-200 border-neutral-300/50 border p-2 dark:border-neutral-50/20 dark:from-neutral-800 dark:to-neutral-900"
                    onSubmit={handleGenerate}
                  >
                    <input
                      type="file"
                      className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
                      ref={fileInputRef}
                      accept={generateAcceptString(
                        FILE_TYPE_GROUPS.images.mimeTypes
                      )}
                      onChange={handleFileChange}
                      tabIndex={-1}
                    />

                    {/* 文字输入区域 */}
                    <div className="flex">
                      <Textarea
                        className="flex-1 input-color font-geist-mono resize-none min-w-xl border-0 p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                        rows={2}
                        maxRows={5}
                        placeholder="请输入广告描述内容..."
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
                              attachment.contentType ||
                                'application/octet-stream'
                            )}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="truncate max-w-32"
                              title={attachment.name}
                            >
                              {attachment.name}
                            </span>
                            <span className="text-neutral-500 text-xs">
                              {formatFileSize(
                                attachment.url
                                  ? new Blob([attachment.url]).size
                                  : 0
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
                        <ImageUploadButton
                          fileInputRef={fileInputRef}
                          status="ready"
                        />
                        <WordLimitButton
                          currentValue={wordLimit}
                          onChange={handleWordLimitChange}
                        />
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
              ) : (
                // 加载状态 - 显示加载卡片（在输入表单的原位置）
                <AdLoadingComponent
                  onCancel={handleCancel}
                  cleanupTimerStates={cleanupTimerStates}
                />
              )}
            </div>
          </>
        ) : (
          // 显示结果
          <ResultsView
            results={results}
            onBack={() => {
              setShowResults(false);
              setResults(null);
            }}
            onSendToBackend={(selectedSolutions) => {
              console.log('发送到后端:', selectedSolutions);
            }}
          />
        )}
      </div>
    </div>
  );
}
