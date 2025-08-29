import { Task, Agent } from '@/lib/types/agent';

export interface TaskQueueConfig {
  maxQueueSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  priorityMode?: boolean;
  timeout?: number;
}

export interface QueuedTask extends Task {
  queueId: string;
  queuedAt: Date;
  queuePriority: number; // 队列优先级（数字）
  retryCount: number;
  dependencies: string[]; // Queue IDs of dependencies
}

export interface TaskQueueStats {
  totalQueued: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  averageWaitTime: number;
  averageExecutionTime: number;
  throughput: number;
}

/**
 * 任务队列管理器
 * 负责任务的排队、调度、优先级管理和依赖处理
 */
export class TaskQueue {
  private queue: Map<string, QueuedTask> = new Map();
  private runningTasks: Map<string, QueuedTask> = new Map();
  private completedTasks: Map<string, QueuedTask> = new Map();
  private failedTasks: Map<string, QueuedTask> = new Map();

  private config: Required<TaskQueueConfig>;
  private nextQueueId = 1;
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TaskQueueConfig = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize || 1000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      priorityMode: config.priorityMode !== false,
      timeout: config.timeout || 300000, // 5 minutes default
    };
  }

  /**
   * 添加任务到队列
   */
  public enqueue(task: Task, priority: number = 0): string {
    if (this.queue.size >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    const queueId = `task_${this.nextQueueId++}`;
    const queuedTask: QueuedTask = {
      ...task,
      queueId,
      queuedAt: new Date(),
      queuePriority: priority,
      retryCount: 0,
      dependencies: task.dependencies || [],
    };

    this.queue.set(queueId, queuedTask);
    this.logTaskEvent(queuedTask, 'queued');

    return queueId;
  }

  /**
   * 从队列中获取下一个可执行的任务
   */
  public dequeue(): QueuedTask | null {
    // 检查是否有可执行的任务（依赖已满足）
    const executableTasks = Array.from(this.queue.values()).filter((task) =>
      this.areDependenciesSatisfied(task)
    );

    if (executableTasks.length === 0) {
      return null;
    }

    // 根据优先级模式选择任务
    let selectedTask: QueuedTask;
    if (this.config.priorityMode) {
      // 按优先级排序，优先级高的先执行
      executableTasks.sort((a, b) => {
        // 首先按任务优先级排序
        const taskPriorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff =
          taskPriorityOrder[a.priority] - taskPriorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // 然后按队列优先级排序
        return b.queuePriority - a.queuePriority;
      });
      selectedTask = executableTasks[0];
    } else {
      // FIFO 模式
      selectedTask = executableTasks.reduce((oldest, current) =>
        current.queuedAt < oldest.queuedAt ? current : oldest
      );
    }

    // 从队列中移除并添加到运行中
    this.queue.delete(selectedTask.queueId);
    this.runningTasks.set(selectedTask.queueId, selectedTask);

    // 设置任务超时
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(selectedTask.queueId);
    }, this.config.timeout);
    this.taskTimeouts.set(selectedTask.queueId, timeout);

    this.logTaskEvent(selectedTask, 'dequeued');
    return selectedTask;
  }

  /**
   * 完成任务
   */
  public completeTask(queueId: string, result?: any): void {
    const task = this.runningTasks.get(queueId);
    if (!task) {
      throw new Error(`Task ${queueId} is not running`);
    }

    // 清除超时定时器
    const timeout = this.taskTimeouts.get(queueId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(queueId);
    }

    // 更新任务状态
    const completedTask: QueuedTask = {
      ...task,
      status: 'completed',
      result,
      completedAt: new Date(),
      actualDuration: this.calculateDuration(task.queuedAt, new Date()),
    };

    this.runningTasks.delete(queueId);
    this.completedTasks.set(queueId, completedTask);

    this.logTaskEvent(completedTask, 'completed');
  }

  /**
   * 任务失败
   */
  public failTask(queueId: string, error: string): void {
    const task = this.runningTasks.get(queueId);
    if (!task) {
      throw new Error(`Task ${queueId} is not running`);
    }

    // 清除超时定时器
    const timeout = this.taskTimeouts.get(queueId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(queueId);
    }

    // 检查是否可以重试
    if (task.retryCount < this.config.maxRetries) {
      // 重新排队进行重试
      const retryTask: QueuedTask = {
        ...task,
        status: 'pending',
        retryCount: task.retryCount + 1,
        error,
      };

      this.runningTasks.delete(queueId);
      this.queue.set(queueId, retryTask);

      // 延迟重试
      setTimeout(() => {
        this.logTaskEvent(retryTask, 'retry_queued');
      }, this.config.retryDelay);

      this.logTaskEvent(retryTask, 'failed_retry');
    } else {
      // 达到最大重试次数，标记为最终失败
      const failedTask: QueuedTask = {
        ...task,
        status: 'failed',
        error,
        completedAt: new Date(),
        actualDuration: this.calculateDuration(task.queuedAt, new Date()),
      };

      this.runningTasks.delete(queueId);
      this.failedTasks.set(queueId, failedTask);

      this.logTaskEvent(failedTask, 'failed_final');
    }
  }

  /**
   * 取消任务
   */
  public cancelTask(queueId: string): boolean {
    // 检查队列中的任务
    if (this.queue.has(queueId)) {
      const task = this.queue.get(queueId)!;
      this.queue.delete(queueId);

      const cancelledTask: QueuedTask = {
        ...task,
        status: 'cancelled',
        completedAt: new Date(),
      };

      this.failedTasks.set(queueId, cancelledTask);
      this.logTaskEvent(cancelledTask, 'cancelled');
      return true;
    }

    // 检查运行中的任务
    if (this.runningTasks.has(queueId)) {
      const task = this.runningTasks.get(queueId)!;
      this.runningTasks.delete(queueId);

      // 清除超时定时器
      const timeout = this.taskTimeouts.get(queueId);
      if (timeout) {
        clearTimeout(timeout);
        this.taskTimeouts.delete(queueId);
      }

      const cancelledTask: QueuedTask = {
        ...task,
        status: 'cancelled',
        completedAt: new Date(),
      };

      this.failedTasks.set(queueId, cancelledTask);
      this.logTaskEvent(cancelledTask, 'cancelled');
      return true;
    }

    return false;
  }

  /**
   * 获取任务状态
   */
  public getTaskStatus(queueId: string): QueuedTask | null {
    return (
      this.queue.get(queueId) ||
      this.runningTasks.get(queueId) ||
      this.completedTasks.get(queueId) ||
      this.failedTasks.get(queueId) ||
      null
    );
  }

  /**
   * 获取队列统计信息
   */
  public getStats(): TaskQueueStats {
    const allTasks = [
      ...Array.from(this.queue.values()),
      ...Array.from(this.runningTasks.values()),
      ...Array.from(this.completedTasks.values()),
      ...Array.from(this.failedTasks.values()),
    ];

    const now = new Date();
    const pendingTasks = Array.from(this.queue.values());
    const runningTasks = Array.from(this.runningTasks.values());
    const completedTasks = Array.from(this.completedTasks.values());

    // 计算平均等待时间
    const totalWaitTime = pendingTasks.reduce(
      (sum, task) => sum + this.calculateDuration(task.queuedAt, now),
      0
    );
    const averageWaitTime =
      pendingTasks.length > 0 ? totalWaitTime / pendingTasks.length : 0;

    // 计算平均执行时间
    const totalExecutionTime = completedTasks.reduce(
      (sum, task) => sum + (task.actualDuration || 0),
      0
    );
    const averageExecutionTime =
      completedTasks.length > 0
        ? totalExecutionTime / completedTasks.length
        : 0;

    // 计算吞吐量（任务/小时）
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCompleted = completedTasks.filter(
      (task) => task.completedAt && task.completedAt > oneHourAgo
    ).length;
    const throughput = recentCompleted;

    return {
      totalQueued: allTasks.length,
      pending: this.queue.size,
      running: this.runningTasks.size,
      completed: this.completedTasks.size,
      failed: this.failedTasks.size,
      averageWaitTime,
      averageExecutionTime,
      throughput,
    };
  }

  /**
   * 清理已完成的任务
   */
  public cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    // 清理已完成的任务
    for (const [queueId, task] of this.completedTasks) {
      if (task.completedAt && task.completedAt < cutoff) {
        this.completedTasks.delete(queueId);
        cleanedCount++;
      }
    }

    // 清理失败的任务
    for (const [queueId, task] of this.failedTasks) {
      if (task.completedAt && task.completedAt < cutoff) {
        this.failedTasks.delete(queueId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): QueuedTask[] {
    return [
      ...Array.from(this.queue.values()),
      ...Array.from(this.runningTasks.values()),
      ...Array.from(this.completedTasks.values()),
      ...Array.from(this.failedTasks.values()),
    ];
  }

  /**
   * 重置队列
   */
  public reset(): void {
    // 清除所有超时定时器
    for (const timeout of this.taskTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.queue.clear();
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
    this.taskTimeouts.clear();
    this.nextQueueId = 1;
  }

  /**
   * 检查依赖是否满足
   */
  private areDependenciesSatisfied(task: QueuedTask): boolean {
    return task.dependencies.every((depQueueId) => {
      // 检查依赖任务是否已完成
      return this.completedTasks.has(depQueueId);
    });
  }

  /**
   * 处理任务超时
   */
  private handleTaskTimeout(queueId: string): void {
    this.taskTimeouts.delete(queueId);
    this.failTask(queueId, 'Task execution timeout');
  }

  /**
   * 计算持续时间（分钟）
   */
  private calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * 记录任务事件
   */
  private logTaskEvent(task: QueuedTask, event: string): void {
    // 这里可以集成日志系统
    console.log(`TaskQueue: ${task.queueId} - ${event}`, {
      title: task.title,
      status: task.status,
      priority: task.priority,
      retryCount: task.retryCount,
    });
  }

  /**
   * 获取推荐的任务分配
   */
  public getRecommendedTaskAssignment(agents: Agent[]): Map<string, string[]> {
    const assignment = new Map<string, string[]>();

    // 获取所有可执行的任务
    const executableTasks = Array.from(this.queue.values()).filter((task) =>
      this.areDependenciesSatisfied(task)
    );

    // 按Agent能力分组
    for (const agent of agents) {
      if (agent.status !== 'idle') continue;

      // 找到该Agent可以执行的任务
      const suitableTasks = executableTasks.filter((task) => {
        // 检查任务是否指定了Agent
        if (task.assignedAgent && task.assignedAgent !== agent.id) {
          return false;
        }

        // 检查Agent能力是否匹配任务需求
        // 这里可以根据实际需求实现更复杂的匹配逻辑
        return true;
      });

      if (suitableTasks.length > 0) {
        assignment.set(
          agent.id,
          suitableTasks.map((task) => task.queueId)
        );
      }
    }

    return assignment;
  }

  /**
   * 从队列中删除任务（用于重新排队）
   */
  public removeTaskFromQueue(queueId: string): boolean {
    return this.queue.delete(queueId);
  }
}
