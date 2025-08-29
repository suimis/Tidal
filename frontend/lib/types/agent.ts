// Agent和任务相关的类型定义

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'completed' | 'error';
  currentTask?: string;
  performance?: {
    tasksCompleted: number;
    averageResponseTime: number;
    successRate: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedAgent?: string;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration?: number; // 分钟
  actualDuration?: number;
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  subtasks?: Task[];
  queueId?: string; // 任务队列ID
}

export interface TaskPlan {
  id: string;
  originalRequest: string;
  title: string;
  description: string;
  tasks: Task[];
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedAgents: string[];
  progress: number; // 0-100
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string; // undefined 表示广播给所有agent
  type: 'task_request' | 'task_update' | 'result' | 'error' | 'coordination';
  content: unknown;
  timestamp: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples?: string[];
}

export interface AgentRegistry {
  [agentId: string]: Agent;
}

export interface TaskQueue {
  pending: Task[];
  running: Task[];
  completed: Task[];
  failed: Task[];
}

export interface AgentSystemConfig {
  maxConcurrentTasks: number;
  taskTimeout: number; // 分钟
  enableAutoScaling: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
