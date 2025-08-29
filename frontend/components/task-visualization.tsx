'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPlan, Agent } from '@/lib/types/agent';
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
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Users,
  Calendar,
  Target,
  Zap,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface TaskVisualizationProps {
  tasks: Task[];
  taskPlan?: TaskPlan;
  agents: Agent[];
  onTaskAction?: (
    taskId: string,
    action: 'start' | 'pause' | 'cancel' | 'restart'
  ) => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    color: string;
    icon: React.ReactNode;
    label: string;
    bgColor: string;
  }
> = {
  pending: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Clock className="h-4 w-4" />,
    label: '待执行',
    bgColor: 'bg-gray-50',
  },
  running: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Play className="h-4 w-4" />,
    label: '执行中',
    bgColor: 'bg-blue-50',
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-4 w-4" />,
    label: '已完成',
    bgColor: 'bg-green-50',
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    label: '失败',
    bgColor: 'bg-red-50',
  },
  cancelled: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Pause className="h-4 w-4" />,
    label: '已取消',
    bgColor: 'bg-yellow-50',
  },
  // 添加TaskPlan可能的状态
  planning: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Target className="h-4 w-4" />,
    label: '规划中',
    bgColor: 'bg-purple-50',
  },
  executing: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <Zap className="h-4 w-4" />,
    label: '执行中',
    bgColor: 'bg-orange-50',
  },
  paused: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Pause className="h-4 w-4" />,
    label: '已暂停',
    bgColor: 'bg-gray-50',
  },
};

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: '低' },
  medium: { color: 'bg-blue-100 text-blue-800', label: '中' },
  high: { color: 'bg-orange-100 text-orange-800', label: '高' },
  critical: { color: 'bg-red-100 text-red-800', label: '紧急' },
};

export function TaskVisualization({
  tasks,
  taskPlan,
  agents,
  onTaskAction,
  onTaskClick,
  className = '',
}: TaskVisualizationProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>(
    'list'
  );
  const [sortBy, setSortBy] = useState<'status' | 'priority' | 'createdAt'>(
    'status'
  );
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>(
    'all'
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // 计算统计信息
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
    progress:
      tasks.length > 0
        ? (tasks.filter((t) => t.status === 'completed').length /
            tasks.length) *
          100
        : 0,
    totalEstimatedTime: tasks.reduce(
      (sum, task) => sum + (task.estimatedDuration || 0),
      0
    ),
    totalActualTime: tasks.reduce(
      (sum, task) => sum + (task.actualDuration || 0),
      0
    ),
  };

  // 过滤和排序任务
  const filteredTasks = tasks
    .filter((task) => filterStatus === 'all' || task.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'status':
          const statusOrder = {
            pending: 0,
            running: 1,
            completed: 2,
            failed: 3,
            cancelled: 4,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  const getAgentById = (agentId: string): Agent | undefined => {
    return agents.find((agent) => agent.id === agentId);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`;
  };

  const getTaskProgress = (task: Task): number => {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed' || task.status === 'cancelled') return 0;
    if (
      task.status === 'running' &&
      task.estimatedDuration &&
      task.actualDuration
    ) {
      return Math.min((task.actualDuration / task.estimatedDuration) * 100, 99);
    }
    return 0;
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const agent = task.assignedAgent
      ? getAgentById(task.assignedAgent)
      : undefined;
    const progress = getTaskProgress(task);
    const statusInfo = statusConfig[task.status];
    const priorityInfo = priorityConfig[task.priority];

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedTask?.id === task.id ? 'ring-2 ring-blue-500' : ''
        } ${statusInfo.bgColor}`}
        onClick={() => {
          setSelectedTask(task);
          onTaskClick?.(task);
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base mb-1">{task.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {task.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusInfo.color}>
                <div className="flex items-center gap-1">
                  {statusInfo.icon}
                  {statusInfo.label}
                </div>
              </Badge>
              <Badge variant="outline" className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 进度条 */}
          {task.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>执行进度</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 时间信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-gray-600">预估时间</div>
              <div className="font-medium">
                {task.estimatedDuration
                  ? formatDuration(task.estimatedDuration)
                  : '未设置'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">实际时间</div>
              <div className="font-medium">
                {task.actualDuration
                  ? formatDuration(task.actualDuration)
                  : '-'}
              </div>
            </div>
          </div>

          {/* Agent 信息 */}
          {agent && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">执行者:</span>
              <span className="font-medium">{agent.name}</span>
              <Badge variant="outline" className="text-xs">
                {agent.role}
              </Badge>
            </div>
          )}

          {/* 依赖任务 */}
          {task.dependencies.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm text-gray-600">依赖任务:</div>
              <div className="flex flex-wrap gap-1">
                {task.dependencies.slice(0, 3).map((depId) => {
                  const depTask = tasks.find((t) => t.id === depId);
                  return depTask ? (
                    <Badge key={depId} variant="outline" className="text-xs">
                      {depTask.title}
                    </Badge>
                  ) : null;
                })}
                {task.dependencies.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.dependencies.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskAction?.(task.id, 'start');
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  启动
                </Button>
              )}
              {task.status === 'running' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskAction?.(task.id, 'pause');
                  }}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  暂停
                </Button>
              )}
              {(task.status === 'completed' || task.status === 'failed') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskAction?.(task.id, 'restart');
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重启
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // 更多操作
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 任务计划概览 */}
      {taskPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              任务计划: {taskPlan.title}
            </CardTitle>
            <CardDescription>{taskPlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  创建时间
                </div>
                <div className="font-medium">
                  {taskPlan.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  总体进度
                </div>
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${taskPlan.progress}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium">
                    {taskPlan.progress.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  状态
                </div>
                <Badge className={statusConfig[taskPlan.status].color}>
                  {statusConfig[taskPlan.status].label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            任务统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">总任务</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">待执行</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.running}
              </div>
              <div className="text-sm text-gray-600">执行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
              </div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.progress.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">完成率</div>
            </div>
          </div>

          {/* 总体进度条 */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>总体进度</span>
              <span>
                {stats.completed}/{stats.total} 已完成
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* 时间统计 */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>
                预估总时长: {formatDuration(stats.totalEstimatedTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span>实际总时长: {formatDuration(stats.totalActualTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 控制面板 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* 视图模式切换 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">视图:</span>
                <div className="flex gap-1">
                  {(['list', 'kanban', 'timeline'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === 'list'
                        ? '列表'
                        : mode === 'kanban'
                        ? '看板'
                        : '时间线'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 排序方式 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="status">状态</option>
                  <option value="priority">优先级</option>
                  <option value="createdAt">创建时间</option>
                </select>
              </div>

              {/* 状态过滤 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">过滤:</span>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as typeof filterStatus)
                  }
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">全部</option>
                  <option value="pending">待执行</option>
                  <option value="running">执行中</option>
                  <option value="completed">已完成</option>
                  <option value="failed">失败</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              显示 {filteredTasks.length} / {tasks.length} 个任务
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
            <p className="text-gray-600">当前条件下没有找到任务</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* 任务详情面板 */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>任务详情</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{selectedTask.title}</h4>
              <p className="text-sm text-gray-600">
                {selectedTask.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">状态:</span>
                <Badge
                  className={`ml-2 ${statusConfig[selectedTask.status].color}`}
                >
                  {statusConfig[selectedTask.status].label}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">优先级:</span>
                <Badge
                  className={`ml-2 ${
                    priorityConfig[selectedTask.priority].color
                  }`}
                >
                  {priorityConfig[selectedTask.priority].label}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">创建时间:</span>
                <span className="ml-2">
                  {selectedTask.createdAt.toLocaleString()}
                </span>
              </div>
              {selectedTask.startedAt && (
                <div>
                  <span className="text-gray-600">开始时间:</span>
                  <span className="ml-2">
                    {selectedTask.startedAt.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedTask.completedAt && (
                <div>
                  <span className="text-gray-600">完成时间:</span>
                  <span className="ml-2">
                    {selectedTask.completedAt.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {selectedTask.result !== undefined &&
              selectedTask.result !== null && (
                <div>
                  <h5 className="font-medium mb-2">执行结果:</h5>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {typeof selectedTask.result === 'object' &&
                    selectedTask.result !== null &&
                    'message' in selectedTask.result ? (
                      <div>{String(selectedTask.result.message)}</div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs">
                        {String(JSON.stringify(selectedTask.result, null, 2))}
                      </pre>
                    )}
                  </div>
                </div>
              )}

            {selectedTask.error && (
              <div>
                <h5 className="font-medium mb-2 text-red-600">错误信息:</h5>
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  {String(selectedTask.error)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
