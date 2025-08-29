'use client';

import { getCookie } from '@/lib/utils/cookies';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Markdown } from '@/components/markdown';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

interface FormField {
  [key: string]: {
    variable: string;
    label: string;
    type: string;
    max_length: number;
    required: boolean;
    options: string[];
    allowed_file_upload_methods?: string[];
    allowed_file_types?: string[];
    allowed_file_extensions?: string[];
  };
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface PageProps {
  params: Promise<{ app: string }>;
}

export default function Page({ params }: PageProps) {
  const { app } = use(params);
  const [inputs, setInputs] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<
    Record<string, string | File | null>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

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

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const response = await fetch(
          `http://localhost:8000/GPT/get_application_info?application_name=${app}`,
          {
            method: 'GET',
            credentials: 'include',
            headers,
          }
        );

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
          setInputs(data.data.user_input_form || []);
          // 初始化表单数据
          const initialFormData: Record<string, string | File | null> = {};
          data.data.user_input_form?.forEach((field: FormField) => {
            const fieldKey = Object.keys(field)[0];
            const fieldData = field[fieldKey];
            initialFormData[fieldData.variable] =
              fieldData.type === 'file' ? null : '';
          });
          setFormData(initialFormData);
        } else {
          throw new Error(data.message || '后端返回状态错误');
        }
      } catch (err) {
        console.error('获取失败:', err);
        setError(err instanceof Error ? err.message : '获取应用信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [app]);

  const handleInputChange = (variable: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleFileChange = (variable: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [variable]: file,
    }));
  };

  // 处理 SSE 流响应
  const handleSSEResponse = async (
    response: Response,
    assistantMessageId: string
  ) => {
    try {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              console.log('SSE 数据:', data);

              // 处理不同类型的 SSE 事件
              if (data.event === 'text_chunk' && data.data?.text) {
                // 更新对应的AI消息内容
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + data.data.text }
                      : msg
                  )
                );
              } else if (data.event === 'workflow_started') {
                console.log('工作流开始:', data.data?.id);
              } else if (data.event === 'workflow_finished') {
                console.log('工作流完成:', data.data?.status);
                // 移除加载状态
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isLoading: false }
                      : msg
                  )
                );
              } else if (data.event === 'node_started') {
                console.log('节点开始:', data.data?.title);
              } else if (data.event === 'node_finished') {
                console.log('节点完成:', data.data?.title);
              } else if (data.event === 'error') {
                // 更新消息为错误状态
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: `错误: ${data.message || '流式传输出错'}`,
                          isLoading: false,
                        }
                      : msg
                  )
                );
                break;
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e, '原始数据:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE 流处理错误:', error);
      // 更新消息为错误状态
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `错误: ${
                  error instanceof Error ? error.message : '流式传输失败'
                }`,
                isLoading: false,
              }
            : msg
        )
      );
    }
  };

  // 清空所有消息
  const clearMessages = () => {
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      // 验证必填字段
      const requiredFields = inputs.filter((field) => {
        const fieldKey = Object.keys(field)[0];
        return field[fieldKey].required;
      });

      for (const field of requiredFields) {
        const fieldKey = Object.keys(field)[0];
        const fieldData = field[fieldKey];
        if (!formData[fieldData.variable]) {
          throw new Error(`请填写必填字段: ${fieldData.label}`);
        }
      }

      // 构建输入数据对象
      const inputsData: Record<string, string> = {};
      let userDisplayContent = '';

      // 遍历表单数据，构建inputs对象
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          // 对于文件类型，暂时使用文件名作为值
          if (value instanceof File) {
            inputsData[key] = value.name;
            if (!userDisplayContent) {
              userDisplayContent = `上传文件: ${value.name}`;
            }
          } else {
            inputsData[key] = value as string;
            // 收集用户输入内容用于显示
            if (!userDisplayContent) {
              userDisplayContent = value as string;
            }
          }
        }
      });

      // 添加用户消息到历史
      const userMessage: Message = {
        id: Date.now().toString() + '-user',
        type: 'user',
        content: userDisplayContent || '提交了表单',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // 添加AI消息占位符（带加载状态）
      const assistantMessageId = Date.now().toString() + '-assistant';
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 获取认证相关的cookies
      const authCookies = getAuthCookies();

      // 调试信息：打印所有可用的cookies
      console.log('所有cookies:', document.cookie);
      console.log('获取到的认证cookies:', authCookies);

      // 检查是否有必要的认证信息
      if (!authCookies.sessionid || !authCookies.csrftoken) {
        throw new Error('缺少必要的认证信息，请重新登录');
      }

      // 调试信息：打印发送的数据
      const dataToSend = {
        inputs: inputsData,
      };
      console.log('发送的数据:', dataToSend);
      console.log('inputsData 详情:', inputsData);

      // 创建FormData对象
      const submitFormData = new FormData();
      submitFormData.append('application_name', app);
      submitFormData.append('data', JSON.stringify(dataToSend));
      submitFormData.append('command', 'talk');

      // 添加文件到FormData（如果有文件字段）
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submitFormData.append(key, value);
        }
      });

      // 创建请求头
      const headers: Record<string, string> = {};

      // 添加CSRF Token（如果存在）
      if (authCookies.csrftoken) {
        headers['X-CSRFToken'] = authCookies.csrftoken;
      }

      // 构建cookie字符串 - 获取所有cookies而不仅仅是认证cookies
      const allCookies = document.cookie;
      if (allCookies) {
        headers['Cookie'] = allCookies;
        console.log('发送的Cookie头:', allCookies);
      } else {
        console.warn('没有找到任何cookies');
      }

      // 发送请求到后端API
      // 注意：使用与获取应用信息相同的域名以确保cookie一致性
      const response = await fetch('http://localhost:8000/GPT/appTalk', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers,
        body: submitFormData,
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream')) {
        // 处理 SSE 流响应
        await handleSSEResponse(response, assistantMessageId);
      } else {
        // 处理普通 JSON 响应
        const result = await response.json();
        if (result.status === 'success') {
          console.log('提交成功！');
          // 更新AI消息内容
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: '提交成功！', isLoading: false }
                : msg
            )
          );
        } else {
          throw new Error(result.message || '提交失败');
        }
      }

      // 清空表单（可选）
      // setFormData({});
    } catch (err) {
      console.error('提交失败:', err);
      // 更新AI消息为错误状态
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === Date.now().toString() + '-assistant'
            ? {
                ...msg,
                content: `错误: ${
                  err instanceof Error ? err.message : '提交失败'
                }`,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldCard = (field: FormField, index: number) => {
    const fieldKey = Object.keys(field)[0];
    const fieldData = field[fieldKey];

    return (
      <div
        key={`${fieldData.variable}-${index}`}
        className="mb-2 p-2 flex items-center gap-3"
      >
        <span className="flex items-center gap-1 min-w-0 flex-shrink-0">
          {fieldData.required && (
            <span className="text-red-500 text-sm">*</span>
          )}
          <span className="text-sm">{fieldData.variable}</span>
        </span>
        {/* 输入控件 */}
        <div className="flex-1">
          {fieldData.type === 'text-input' && (
            <Input
              id={fieldData.variable}
              type="text"
              value={(formData[fieldData.variable] as string) || ''}
              onChange={(e) =>
                handleInputChange(fieldData.variable, e.target.value)
              }
              placeholder={`请输入${fieldData.label}`}
              maxLength={fieldData.max_length || undefined}
              required={fieldData.required}
              className="w-full h-8"
            />
          )}

          {fieldData.type === 'file' && (
            <Input
              id={fieldData.variable}
              type="file"
              onChange={(e) =>
                handleFileChange(
                  fieldData.variable,
                  e.target.files?.[0] || null
                )
              }
              accept={fieldData.allowed_file_extensions?.join(',') || '*'}
              required={fieldData.required}
              className="w-full h-8"
            />
          )}
        </div>
      </div>
    );
  };

  // 渲染消息组件
  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';

    return (
      <div
        key={message.id}
        className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900 border'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>AI 正在思考中...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          <div className="text-xs opacity-70 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full">
        {/* 顶部标题栏骨架 */}
        <div className="px-4 py-4 border-b border-grey-500">
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="w-full h-full flex">
          {/* 左侧表单区域骨架 */}
          <section className="h-full w-100 overflow-y-auto">
            <div className="space-y-6 p-4">
              {/* 模拟多个表单字段 */}
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="mb-2 p-2 flex items-center gap-3">
                  {/* 字段标签骨架 */}
                  <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {/* 输入框骨架 */}
                  <div className="flex-1">
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 右侧对话区域骨架 */}
          <section className="w-full border-l border-grey-500 flex flex-col">
            {/* 对话区域头部骨架 */}
            <div className="px-4 py-4 border-b border-grey-500 flex justify-between items-center">
              <Skeleton className="h-6 w-12" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>

            {/* 对话内容区域骨架 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center mt-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-lg font-medium">加载失败</div>
              <p className="text-muted-foreground">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                重新加载
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="px-4 py-4 border-b border-grey-500 text-2xl font-semibold">
        Workflow - {app}
      </div>

      {/* 可调整大小的主内容区域 */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* 左侧变量区 */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <section className="h-full overflow-y-auto scrollbar-nice">
            <div className="space-y-6 p-4">
              {inputs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无输入字段</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                  {inputs.map((field, index) => renderFieldCard(field, index))}
                </form>
              )}
            </div>
          </section>
        </ResizablePanel>

        {/* 可调整大小的分隔条 */}
        <ResizableHandle withHandle />

        {/* 右侧对话区 */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <section className="h-full border-l border-grey-500 flex flex-col">
            <div className="px-4 py-4 border-b border-grey-500 flex justify-between items-center">
              <h3 className="text-lg font-semibold">对话</h3>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button onClick={clearMessages} variant="outline" size="sm">
                    清空对话
                  </Button>
                )}
                {inputs.length > 0 && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="min-w-24"
                    size="sm"
                  >
                    {submitting ? '提交中...' : '提交'}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">💬</div>
                  <p>提交表单后，对话将在这里显示</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => renderMessage(message))}
                </div>
              )}
            </div>
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
