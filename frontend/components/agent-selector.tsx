'use client';

import React, { useState } from 'react';
import { Agent } from '@/lib/types/agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Check,
  User,
  Clock,
  Activity,
  Zap,
  Star,
  Filter,
  Search,
} from 'lucide-react';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentIds?: string[];
  onSelectionChange?: (agentIds: string[]) => void;
  multiSelect?: boolean;
  showCapabilities?: boolean;
  showPerformance?: boolean;
  placeholder?: string;
  className?: string;
}

const statusIcons = {
  idle: <Clock className="h-3 w-3" />,
  working: <Activity className="h-3 w-3" />,
  completed: <Zap className="h-3 w-3" />,
  error: <Star className="h-3 w-3" />,
};

const statusColors = {
  idle: 'bg-green-100 text-green-800',
  working: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  error: 'bg-red-100 text-red-800',
};

const statusLabels = {
  idle: '空闲',
  working: '工作中',
  completed: '就绪',
  error: '异常',
};

export function AgentSelector({
  agents,
  selectedAgentIds = [],
  onSelectionChange,
  multiSelect = false,
  showCapabilities = true,
  showPerformance = true,
  placeholder = '选择 Agent...',
  className = '',
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Agent['status']>(
    'all'
  );

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAgentClick = (agentId: string) => {
    if (multiSelect) {
      const newSelection = selectedAgentIds.includes(agentId)
        ? selectedAgentIds.filter((id) => id !== agentId)
        : [...selectedAgentIds, agentId];
      onSelectionChange?.(newSelection);
    } else {
      onSelectionChange?.([agentId]);
      setIsOpen(false);
    }
  };

  const getSelectedAgents = () => {
    return agents.filter((agent) => selectedAgentIds.includes(agent.id));
  };

  const clearSelection = () => {
    onSelectionChange?.([]);
  };

  const getPerformanceScore = (agent: Agent): number => {
    if (!agent.performance) return 0;
    const { tasksCompleted, averageResponseTime, successRate } =
      agent.performance;
    // 简单的性能评分算法
    return (
      tasksCompleted * 10 +
      successRate * 50 +
      (averageResponseTime > 0 ? 100 / averageResponseTime : 0)
    );
  };

  const getBestAgent = (): Agent | undefined => {
    const availableAgents = agents.filter((agent) => agent.status === 'idle');
    if (availableAgents.length === 0) return undefined;

    return availableAgents.reduce((best, current) => {
      const bestScore = getPerformanceScore(best);
      const currentScore = getPerformanceScore(current);
      return currentScore > bestScore ? current : best;
    });
  };

  const selectedAgents = getSelectedAgents();
  const bestAgent = getBestAgent();

  return (
    <div className={`relative ${className}`}>
      {/* 选择器触发器 */}
      <div className="space-y-2">
        <div
          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3 flex-1">
            <User className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              {selectedAgents.length === 0 ? (
                <span className="text-gray-500">{placeholder}</span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedAgents.map((agent) => (
                    <Badge
                      key={agent.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {agent.name}
                    </Badge>
                  ))}
                  {selectedAgents.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({selectedAgents.length} 个已选择)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bestAgent && selectedAgents.length === 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-50 border-yellow-200"
              >
                推荐: {bestAgent.name}
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 快速操作 */}
        {selectedAgents.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              已选择 {selectedAgents.length} 个 Agent
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              清除选择
            </Button>
          </div>
        )}
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              选择 Agent
            </CardTitle>
            <div className="space-y-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索 Agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                />
              </div>

              {/* 状态过滤器 */}
              <div className="flex gap-2">
                {(
                  ['all', 'idle', 'working', 'completed', 'error'] as const
                ).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status === 'all' ? '全部' : statusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-h-80 overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>没有找到匹配的 Agent</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentIds.includes(agent.id);
                  const isBest = bestAgent?.id === agent.id;
                  const performanceScore = getPerformanceScore(agent);

                  return (
                    <div
                      key={agent.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        isSelected
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAgentClick(agent.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* 选择指示器 */}
                          <div className="flex items-center h-5 mt-0.5">
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                            {!isSelected && multiSelect && (
                              <div className="w-4 h-4 border rounded" />
                            )}
                          </div>

                          {/* Agent 信息 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {agent.name}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  statusColors[agent.status]
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {statusIcons[agent.status]}
                                  {statusLabels[agent.status]}
                                </div>
                              </Badge>
                              {isBest && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-50 border-yellow-200"
                                >
                                  推荐
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {agent.description}
                            </p>

                            {/* 能力标签 */}
                            {showCapabilities &&
                              agent.capabilities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {agent.capabilities
                                    .slice(0, 3)
                                    .map((capability) => (
                                      <Badge
                                        key={capability}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {capability}
                                      </Badge>
                                    ))}
                                  {agent.capabilities.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{agent.capabilities.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                            {/* 性能指标 */}
                            {showPerformance && agent.performance && (
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {agent.performance.tasksCompleted}
                                  </span>
                                  <span>任务</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {agent.performance.averageResponseTime.toFixed(
                                      1
                                    )}
                                    s
                                  </span>
                                  <span>响应</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {(
                                      agent.performance.successRate * 100
                                    ).toFixed(0)}
                                    %
                                  </span>
                                  <span>成功率</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {performanceScore.toFixed(0)}
                                  </span>
                                  <span>评分</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* 底部操作 */}
          <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredAgents.length} 个 Agent 可选
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                取消
              </Button>
              {selectedAgents.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  确认选择 ({selectedAgents.length})
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
