'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Agent, Task, AgentSystemConfig, TaskPlan } from '@/lib/types/agent';
import { AgentManager } from '@/lib/agent/AgentManager';
import { TaskDecomposer } from '@/lib/agent/TaskDecomposer';
import { TaskQueue } from '@/lib/agent/TaskQueue';
import { AgentRegistry } from './agent-registry';
import { AgentSelector } from './agent-selector';
import { TaskVisualization } from './task-visualization';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Bot,
  User,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';

interface AgentChatProps {
  agents: Agent[];
  config: AgentSystemConfig;
  onConfigChange?: (config: AgentSystemConfig) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  taskId?: string;
  metadata?: any;
}

export function AgentChat({
  agents,
  config,
  onConfigChange,
  className = '',
}: AgentChatProps) {
  // 状态管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'agents' | 'tasks'>(
    'chat'
  );
  const [taskPlan, setTaskPlan] = useState<TaskPlan | null>(null);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);

  // Agent系统实例
  const [agentManager] = useState(() => new AgentManager(config));
  const [taskDecomposer] = useState(() => new TaskDecomposer());
  const [taskQueue] = useState(
    () =>
      new TaskQueue({
        maxQueueSize: 100,
        maxRetries: 3,
        retryDelay: 3000,
        priorityMode: true,
        timeout: 300000,
      })
  );

  // 初始化
  useEffect(() => {
    // 添加欢迎消息
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content:
        '欢迎使用Agent智能助手系统！我可以帮您分解复杂任务并协调多个Agent来完成工作。',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // 启动任务处理循环
    startTaskProcessingLoop();

    return () => {
      // 清理
    };
  }, []);

  // 任务处理循环
  const startTaskProcessingLoop = useCallback(() => {
    const processTasks = async () => {
      try {
        // 获取推荐的任务分配
        const availableAgents = agents.filter(
          (agent) => agent.status === 'idle'
        );
        const assignment =
          taskQueue.getRecommendedTaskAssignment(availableAgents);

        // 分配任务给Agent
        for (const [agentId, taskIds] of assignment) {
          if (taskIds.length > 0) {
            const taskId = taskIds[0]; // 每次只分配一个任务
            const queuedTask = taskQueue.getTaskStatus(taskId);

            if (queuedTask) {
              // 执行任务
              await executeTaskWithAgent(agentId, queuedTask);
            }
          }
        }
      } catch (error) {
        console.error('Task processing error:', error);
      }

      // 继续下一轮处理
      setTimeout(processTasks, 1000);
    };

    processTasks();
  }, [agents, taskQueue]);

  // 执行任务
  const executeTaskWithAgent = async (agentId: string, task: Task) => {
    try {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      // 更新Agent状态
      await agentManager.updateAgentStatus(agentId, 'working');

      // 添加执行消息
      const executionMessage: ChatMessage = {
        id: `exec_${task.id}`,
        type: 'agent',
        content: `开始执行任务: ${task.title}`,
        timestamp: new Date(),
        agentId,
        taskId: task.id,
        metadata: { action: 'start' },
      };
      addMessage(executionMessage);

      // 模拟任务执行（实际项目中这里会调用真实的Agent接口）
      const result = await simulateTaskExecution(task, agent);

      // 完成任务
      taskQueue.completeTask(task.queueId || task.id, result);
      await agentManager.updateAgentStatus(agentId, 'idle');

      // 更新任务状态
      updateTaskStatus(task.id, 'completed', result);

      // 添加完成消息
      const completionMessage: ChatMessage = {
        id: `comp_${task.id}`,
        type: 'agent',
        content: `任务完成: ${task.title}\n结果: ${
          result.message || '执行成功'
        }`,
        timestamp: new Date(),
        agentId,
        taskId: task.id,
        metadata: { action: 'complete', result },
      };
      addMessage(completionMessage);
    } catch (error) {
      // 任务失败
      taskQueue.failTask(task.queueId || task.id, String(error));
      await agentManager.updateAgentStatus(agentId, 'idle');

      // 更新任务状态
      updateTaskStatus(task.id, 'failed', null, String(error));

      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: `err_${task.id}`,
        type: 'system',
        content: `任务执行失败: ${task.title}\n错误: ${String(error)}`,
        timestamp: new Date(),
        taskId: task.id,
        metadata: { action: 'error', error: String(error) },
      };
      addMessage(errorMessage);
    }
  };

  // 模拟任务执行
  const simulateTaskExecution = async (
    task: Task,
    agent: Agent
  ): Promise<any> => {
    // 模拟处理时间
    const processingTime = Math.random() * 3000 + 1000; // 1-4秒
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // 根据任务描述生成不同的结果
    const taskDescription = task.description.toLowerCase();
    let resultMessage = '任务执行成功。';
    let resultData: any = { status: 'success' };

    if (
      taskDescription.includes('分析') ||
      taskDescription.includes('analysis')
    ) {
      resultMessage = `分析完成。发现了 ${
        Math.floor(Math.random() * 10) + 1
      } 个关键点。`;
      resultData = {
        status: 'success',
        keyPoints: Math.floor(Math.random() * 10) + 1,
      };
    } else if (
      taskDescription.includes('研究') ||
      taskDescription.includes('research')
    ) {
      resultMessage = `研究完成。收集了 ${
        Math.floor(Math.random() * 20) + 5
      } 条相关信息。`;
      resultData = {
        status: 'success',
        sources: Math.floor(Math.random() * 20) + 5,
      };
    } else if (
      taskDescription.includes('生成') ||
      taskDescription.includes('generation') ||
      taskDescription.includes('编写') ||
      taskDescription.includes('开发')
    ) {
      resultMessage = `内容生成完成。生成了 ${
        Math.floor(Math.random() * 1000) + 100
      } 字的内容。`;
      resultData = {
        status: 'success',
        wordCount: Math.floor(Math.random() * 1000) + 100,
      };
    }

    return {
      message: resultMessage,
      data: resultData,
    };
  };

  // 添加消息
  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  // 更新任务状态
  const updateTaskStatus = (
    taskId: string,
    status: Task['status'],
    result?: any,
    error?: string
  ) => {
    setCurrentTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              result,
              error,
              completedAt:
                status === 'completed' || status === 'failed'
                  ? new Date()
                  : undefined,
            }
          : task
      )
    );
  };

  // 处理消息发送
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // 如果选择了特定Agent，直接发送给Agent
      if (selectedAgentIds.length === 1) {
        const agent = agents.find((a) => a.id === selectedAgentIds[0]);
        if (agent) {
          await handleDirectAgentMessage(userMessage, agent);
        }
      } else {
        // 使用任务分解器处理复杂请求
        await handleTaskDecomposition(userMessage);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: `处理请求时发生错误: ${String(error)}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // 直接发送消息给Agent
  const handleDirectAgentMessage = async (
    message: ChatMessage,
    agent: Agent
  ) => {
    const responseMessage: ChatMessage = {
      id: `agent_${Date.now()}`,
      type: 'agent',
      content: `已收到您的消息："${message.content}"。我正在为您处理...`,
      timestamp: new Date(),
      agentId: agent.id,
    };
    addMessage(responseMessage);

    // 模拟Agent处理
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const finalResponse: ChatMessage = {
      id: `agent_final_${Date.now()}`,
      type: 'agent',
      content: `处理完成！这是针对"${message.content}"的响应结果。`,
      timestamp: new Date(),
      agentId: agent.id,
    };
    addMessage(finalResponse);
  };

  // 任务分解处理
  const handleTaskDecomposition = async (message: ChatMessage) => {
    const decomposingMessage: ChatMessage = {
      id: `decomp_${Date.now()}`,
      type: 'system',
      content: '正在分析您的请求并制定执行计划...',
      timestamp: new Date(),
    };
    addMessage(decomposingMessage);

    // 使用任务分解器
    const plan = await taskDecomposer.decomposeTask(message.content, agents);

    if (plan && plan.tasks.length > 0) {
      setTaskPlan(plan);
      setCurrentTasks(plan.tasks);

      // 将任务添加到队列
      plan.tasks.forEach((task) => {
        const queueId = taskQueue.enqueue(
          task,
          task.priority === 'critical'
            ? 10
            : task.priority === 'high'
            ? 7
            : task.priority === 'medium'
            ? 5
            : 3
        );

        // 更新任务的queueId
        setCurrentTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, queueId } : t))
        );
      });

      const planMessage: ChatMessage = {
        id: `plan_${Date.now()}`,
        type: 'system',
        content: `已制定执行计划，包含 ${plan.tasks.length} 个任务。任务已加入队列并开始执行。`,
        timestamp: new Date(),
        metadata: { planId: plan.id, taskCount: plan.tasks.length },
      };
      addMessage(planMessage);
    } else {
      const noPlanMessage: ChatMessage = {
        id: `noplan_${Date.now()}`,
        type: 'system',
        content: '无法为您的请求制定执行计划。请尝试更具体地描述您的需求。',
        timestamp: new Date(),
      };
      addMessage(noPlanMessage);
    }
  };

  // 处理任务操作
  const handleTaskAction = (
    taskId: string,
    action: 'start' | 'pause' | 'cancel' | 'restart'
  ) => {
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) return;

    switch (action) {
      case 'start':
        if (task.queueId) {
          const queuedTask = taskQueue.getTaskStatus(task.queueId);
          if (queuedTask && queuedTask.status === 'pending') {
            // 重新加入队列以触发执行
            taskQueue.removeTaskFromQueue(task.queueId);
            const newQueueId = taskQueue.enqueue(task, 10);
            setCurrentTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, queueId: newQueueId } : t
              )
            );
          }
        }
        break;
      case 'pause':
      case 'cancel':
        if (task.queueId) {
          taskQueue.cancelTask(task.queueId);
          updateTaskStatus(taskId, 'cancelled');
        }
        break;
      case 'restart':
        // 重新创建任务
        const newTask: Task = {
          ...task,
          status: 'pending',
          startedAt: undefined,
          completedAt: undefined,
          result: undefined,
          error: undefined,
          actualDuration: undefined,
        };
        const newQueueId = taskQueue.enqueue(newTask, 10);
        setCurrentTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...newTask, queueId: newQueueId } : t
          )
        );
        break;
    }
  };

  // 获取Agent状态统计
  const getAgentStats = () => {
    return {
      total: agents.length,
      idle: agents.filter((a) => a.status === 'idle').length,
      working: agents.filter((a) => a.status === 'working').length,
      completed: agents.filter((a) => a.status === 'completed').length,
      error: agents.filter((a) => a.status === 'error').length,
    };
  };

  const agentStats = getAgentStats();
  const queueStats = taskQueue.getStats();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 头部控制栏 */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Agent智能助手
              </h1>

              {/* 状态统计 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>空闲: {agentStats.idle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>工作中: {agentStats.working}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>队列: {queueStats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>已完成: {queueStats.completed}</span>
                </div>
              </div>
            </div>

            {/* 视图切换 */}
            <div className="flex gap-2">
              <Button
                variant={activeView === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('chat')}
              >
                聊天
              </Button>
              <Button
                variant={activeView === 'agents' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('agents')}
              >
                Agent管理
              </Button>
              <Button
                variant={activeView === 'tasks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('tasks')}
              >
                任务监控
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeView === 'chat' && (
          <>
            {/* 聊天消息区域 */}
            <Card className="flex-1 mb-4 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  对话记录
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type !== 'user' && (
                      <div className="flex-shrink-0">
                        {message.type === 'agent' && message.agentId ? (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Settings className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'agent'
                          ? 'bg-blue-50 text-gray-900'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                        {message.agentId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {agents.find((a) => a.id === message.agentId)?.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 输入区域 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Agent选择器 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">执行Agent:</span>
                    <AgentSelector
                      agents={agents}
                      selectedAgentIds={selectedAgentIds}
                      onSelectionChange={setSelectedAgentIds}
                      multiSelect={false}
                      placeholder="选择Agent或自动分配"
                    />
                  </div>

                  {/* 消息输入 */}
                  <div className="flex gap-2">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="输入您的请求，我将为您分解任务并协调Agent执行..."
                      className="flex-1 resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isProcessing}
                      className="self-end"
                    >
                      {isProcessing ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* 快捷操作提示 */}
                  <div className="text-xs text-gray-500">
                    <p>• 直接输入简单请求，系统会自动分配给合适的Agent</p>
                    <p>• 输入复杂任务，系统会自动分解并制定执行计划</p>
                    <p>• 选择特定Agent来执行您的请求</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'agents' && (
          <AgentRegistry
            agents={agents}
            config={config}
            onAgentSelect={(agent) => {
              setSelectedAgentIds([agent.id]);
              setActiveView('chat');
            }}
            onAgentStatusChange={async (agentId, status) => {
              await agentManager.updateAgentStatus(agentId, status);
            }}
            onConfigChange={onConfigChange}
          />
        )}

        {activeView === 'tasks' && (
          <TaskVisualization
            tasks={currentTasks}
            taskPlan={taskPlan || undefined}
            agents={agents}
            onTaskAction={handleTaskAction}
            onTaskClick={(task) => {
              // 可以在这里添加任务详情处理
            }}
          />
        )}
      </div>
    </div>
  );
}
