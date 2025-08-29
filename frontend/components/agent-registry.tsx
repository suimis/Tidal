'use client';

import React, { useState, useEffect } from 'react';
import { Agent, AgentSystemConfig } from '@/lib/types/agent';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Activity,
} from 'lucide-react';

interface AgentRegistryProps {
  agents: Agent[];
  config: AgentSystemConfig;
  onAgentSelect?: (agent: Agent) => void;
  onAgentStatusChange?: (agentId: string, status: Agent['status']) => void;
  onConfigChange?: (config: AgentSystemConfig) => void;
}

const statusColors = {
  idle: 'bg-green-100 text-green-800 border-green-200',
  working: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-purple-100 text-purple-800 border-purple-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
  idle: <Clock className="h-4 w-4" />,
  working: <Activity className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

const statusLabels = {
  idle: '空闲',
  working: '工作中',
  completed: '已完成',
  error: '错误',
};

export function AgentRegistry({
  agents,
  config,
  onAgentSelect,
  onAgentStatusChange,
  onConfigChange,
}: AgentRegistryProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // 计算系统统计信息
  const systemStats = {
    totalAgents: agents.length,
    availableAgents: agents.filter((a) => a.status === 'idle').length,
    workingAgents: agents.filter((a) => a.status === 'working').length,
    totalTasksCompleted: agents.reduce(
      (sum, agent) => sum + (agent.performance?.tasksCompleted || 0),
      0
    ),
    averageResponseTime:
      agents.length > 0
        ? agents.reduce(
            (sum, agent) => sum + (agent.performance?.averageResponseTime || 0),
            0
          ) / agents.length
        : 0,
    overallSuccessRate:
      agents.length > 0
        ? agents.reduce(
            (sum, agent) => sum + (agent.performance?.successRate || 0),
            0
          ) / agents.length
        : 0,
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    onAgentSelect?.(agent);
  };

  const handleStatusToggle = (agent: Agent) => {
    const newStatus = agent.status === 'idle' ? 'working' : 'idle';
    onAgentStatusChange?.(agent.id, newStatus);
  };

  const getPerformanceColor = (value: number): string => {
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 系统概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent 系统概览
          </CardTitle>
          <CardDescription>
            当前系统中有 {systemStats.totalAgents} 个 Agent，
            {systemStats.availableAgents} 个可用
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemStats.totalAgents}
              </div>
              <div className="text-sm text-gray-600">总 Agent 数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStats.availableAgents}
              </div>
              <div className="text-sm text-gray-600">可用 Agent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemStats.totalTasksCompleted}
              </div>
              <div className="text-sm text-gray-600">已完成任务</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getPerformanceColor(
                  systemStats.overallSuccessRate
                )}`}
              >
                {(systemStats.overallSuccessRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">成功率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAgent?.id === agent.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleAgentClick(agent)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className={`${statusColors[agent.status]} border`}
                >
                  <div className="flex items-center gap-1">
                    {statusIcons[agent.status]}
                    {statusLabels[agent.status]}
                  </div>
                </Badge>
              </div>
              <CardDescription>{agent.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent 描述 */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {agent.description}
              </p>

              {/* 能力标签 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">能力:</div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <Badge
                      key={capability}
                      variant="outline"
                      className="text-xs"
                    >
                      {capability}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 性能指标 */}
              {agent.performance && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">性能:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold">
                        {agent.performance.tasksCompleted}
                      </div>
                      <div className="text-gray-600">完成任务</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        {agent.performance.averageResponseTime.toFixed(1)}s
                      </div>
                      <div className="text-gray-600">响应时间</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getPerformanceColor(
                          agent.performance.successRate
                        )}`}
                      >
                        {(agent.performance.successRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-gray-600">成功率</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 当前任务 */}
              {agent.currentTask && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">当前任务:</div>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {agent.currentTask}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(agent);
                  }}
                  className="flex-1"
                >
                  {agent.status === 'idle' ? (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      启动
                    </>
                  ) : (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      停止
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 这里可以添加更多操作
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 系统配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              系统配置
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              {isConfigOpen ? '收起' : '展开'}
            </Button>
          </CardTitle>
        </CardHeader>
        {isConfigOpen && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">最大并发任务数</label>
                <input
                  type="number"
                  value={config.maxConcurrentTasks}
                  onChange={(e) =>
                    onConfigChange?.({
                      ...config,
                      maxConcurrentTasks: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  任务超时时间（分钟）
                </label>
                <input
                  type="number"
                  value={config.taskTimeout}
                  onChange={(e) =>
                    onConfigChange?.({
                      ...config,
                      taskTimeout: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  min="1"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">日志级别</label>
                <select
                  value={config.logLevel}
                  onChange={(e) =>
                    onConfigChange?.({
                      ...config,
                      logLevel: e.target.value as AgentSystemConfig['logLevel'],
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">自动扩容</label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.enableAutoScaling}
                    onChange={(e) =>
                      onConfigChange?.({
                        ...config,
                        enableAutoScaling: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">启用自动扩容</span>
                </label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
