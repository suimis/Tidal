import {
  Agent,
  Task,
  TaskPlan,
  AgentMessage,
  AgentRegistry,
  TaskQueue,
  AgentSystemConfig,
} from '@/lib/types/agent';

export class AgentManager {
  private agents: AgentRegistry = {};
  private taskQueue: TaskQueue = {
    pending: [],
    running: [],
    completed: [],
    failed: [],
  };
  private config: AgentSystemConfig;
  private messageHandlers: Map<string, (message: AgentMessage) => void> =
    new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: AgentSystemConfig) {
    this.config = config;
    this.initializeDefaultAgents();
  }

  /**
   * 初始化默认的Agent
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'product-manager',
        name: '产品经理',
        role: 'Product Manager',
        description: '负责需求分析、产品规划和任务分解',
        capabilities: ['需求分析', '任务分解', '优先级排序', '用户故事编写'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          averageResponseTime: 0,
          successRate: 1.0,
        },
      },
      {
        id: 'architect',
        name: '架构师',
        role: 'Architect',
        description: '负责系统设计、技术选型和架构规划',
        capabilities: ['系统设计', '技术选型', '架构规划', '性能优化'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          averageResponseTime: 0,
          successRate: 1.0,
        },
      },
      {
        id: 'developer',
        name: '开发工程师',
        role: 'Developer',
        description: '负责代码实现、单元测试和代码审查',
        capabilities: ['代码实现', '单元测试', '代码审查', '调试'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          averageResponseTime: 0,
          successRate: 1.0,
        },
      },
      {
        id: 'tester',
        name: '测试工程师',
        role: 'QA Engineer',
        description: '负责测试计划制定、测试执行和质量保证',
        capabilities: ['测试计划', '测试执行', '缺陷报告', '质量保证'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          averageResponseTime: 0,
          successRate: 1.0,
        },
      },
      {
        id: 'document-writer',
        name: '文档工程师',
        role: 'Technical Writer',
        description: '负责文档编写、用户手册和技术文档',
        capabilities: ['文档编写', '用户手册', '技术文档', 'API文档'],
        status: 'idle',
        performance: {
          tasksCompleted: 0,
          averageResponseTime: 0,
          successRate: 1.0,
        },
      },
    ];

    defaultAgents.forEach((agent) => {
      this.registerAgent(agent);
    });
  }

  /**
   * 注册新的Agent
   */
  registerAgent(agent: Agent): void {
    this.agents[agent.id] = { ...agent };
    this.emit('agent-registered', agent);
  }

  /**
   * 注销Agent
   */
  unregisterAgent(agentId: string): void {
    if (this.agents[agentId]) {
      delete this.agents[agentId];
      this.emit('agent-unregistered', agentId);
    }
  }

  /**
   * 获取所有Agent
   */
  getAllAgents(): Agent[] {
    return Object.values(this.agents);
  }

  /**
   * 获取指定Agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents[agentId];
  }

  /**
   * 获取可用的Agent
   */
  getAvailableAgents(): Agent[] {
    return Object.values(this.agents).filter(
      (agent) => agent.status === 'idle'
    );
  }

  /**
   * 更新Agent状态
   */
  public async updateAgentStatus(
    agentId: string,
    status: Agent['status']
  ): Promise<void> {
    const agent = this.agents[agentId];
    if (agent) {
      agent.status = status;
      this.logAgentEvent(agent, 'status_changed');
    }
    return Promise.resolve();
  }

  /**
   * 添加任务到队列
   */
  addTask(task: Task): void {
    this.taskQueue.pending.push(task);
    this.emit('task-added', task);
    this.processTaskQueue();
  }

  /**
   * 处理任务队列
   */
  private processTaskQueue(): void {
    const runningTasksCount = this.taskQueue.running.length;
    const slotsAvailable = this.config.maxConcurrentTasks - runningTasksCount;
    const tasksToProcess = this.taskQueue.pending.slice(0, slotsAvailable);

    for (const task of tasksToProcess) {
      // 检查任务依赖
      if (this.checkTaskDependencies(task)) {
        const suitableAgent = this.findSuitableAgent(task);
        if (suitableAgent) {
          this.assignTaskToAgent(task, suitableAgent);
        }
      }
    }
  }

  /**
   * 检查任务依赖
   */
  private checkTaskDependencies(task: Task): boolean {
    if (task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every((depId) => {
      const completedTask = this.taskQueue.completed.find(
        (t) => t.id === depId
      );
      return completedTask && completedTask.status === 'completed';
    });
  }

  /**
   * 为任务找到合适的Agent
   */
  private findSuitableAgent(task: Task): Agent | undefined {
    const availableAgents = this.getAvailableAgents();

    // 根据任务描述和Agent能力进行匹配
    return availableAgents.find((agent) => {
      return this.isAgentSuitableForTask(agent, task);
    });
  }

  /**
   * 判断Agent是否适合执行任务
   */
  private isAgentSuitableForTask(agent: Agent, task: Task): boolean {
    // 简单的关键词匹配算法
    const taskDescription = task.description.toLowerCase();
    const taskTitle = task.title.toLowerCase();

    return agent.capabilities.some((capability) => {
      const capabilityLower = capability.toLowerCase();
      return (
        taskDescription.includes(capabilityLower) ||
        taskTitle.includes(capabilityLower) ||
        this.matchByRole(agent.role, taskTitle)
      );
    });
  }

  /**
   * 根据角色匹配任务
   */
  private matchByRole(role: string, taskTitle: string): boolean {
    const roleTaskMap: Record<string, string[]> = {
      'Product Manager': ['需求', '规划', '分析', '设计', '用户'],
      Architect: ['架构', '设计', '系统', '技术', '性能'],
      Developer: ['开发', '实现', '代码', '编程', '测试'],
      'QA Engineer': ['测试', '质量', '验证', '缺陷', '检查'],
      'Technical Writer': ['文档', '手册', '说明', 'API', '用户'],
    };

    const keywords = roleTaskMap[role] || [];
    return keywords.some((keyword) => taskTitle.includes(keyword));
  }

  /**
   * 将任务分配给Agent
   */
  private async assignTaskToAgent(task: Task, agent: Agent): Promise<void> {
    // 更新任务状态
    task.status = 'running';
    task.assignedAgent = agent.id;
    task.startedAt = new Date();

    // 更新Agent状态
    agent.status = 'working';
    agent.currentTask = task.id;

    // 移动任务到运行队列
    this.taskQueue.pending = this.taskQueue.pending.filter(
      (t) => t.id !== task.id
    );
    this.taskQueue.running.push(task);

    this.emit('task-started', task, agent);

    // 模拟任务执行
    try {
      await this.executeTask(task, agent);
    } catch (error) {
      this.handleTaskError(task, agent, error as Error);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task, agent: Agent): Promise<void> {
    const startTime = Date.now();

    // 模拟任务执行时间
    const executionTime = Math.random() * 5000 + 2000; // 2-7秒

    await new Promise((resolve) => setTimeout(resolve, executionTime));

    // 更新任务结果
    task.status = 'completed';
    task.completedAt = new Date();
    task.actualDuration = Math.round((Date.now() - startTime) / 1000);
    task.result = {
      message: `任务 "${task.title}" 已由 ${agent.name} 完成`,
      output: this.generateTaskOutput(task, agent),
      quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
    };

    // 更新Agent状态
    agent.status = 'idle';
    agent.currentTask = undefined;
    agent.performance!.tasksCompleted++;
    agent.performance!.averageResponseTime =
      (agent.performance!.averageResponseTime *
        (agent.performance!.tasksCompleted - 1) +
        task.actualDuration) /
      agent.performance!.tasksCompleted;

    // 移动任务到完成队列
    this.taskQueue.running = this.taskQueue.running.filter(
      (t) => t.id !== task.id
    );
    this.taskQueue.completed.push(task);

    this.emit('task-completed', task, agent);

    // 继续处理队列中的任务
    this.processTaskQueue();
  }

  /**
   * 生成任务输出
   */
  private generateTaskOutput(task: Task, agent: Agent): string {
    const outputs: Record<string, string[]> = {
      'Product Manager': [
        `已完成需求分析，识别出${Math.floor(
          Math.random() * 5 + 3
        )}个关键功能点`,
        `制定了详细的产品计划和时间表`,
        `编写了用户故事和验收标准`,
      ],
      Architect: [
        `设计了系统架构，采用微服务架构模式`,
        `完成了技术选型，推荐使用React + Node.js`,
        `制定了性能优化方案和安全策略`,
      ],
      Developer: [
        `完成了核心功能模块的开发`,
        `编写了单元测试，覆盖率达到90%以上`,
        `进行了代码审查，确保代码质量`,
      ],
      'QA Engineer': [
        `制定了详细的测试计划`,
        `执行了功能测试和回归测试`,
        `发现了${Math.floor(Math.random() * 3)}个缺陷并已修复`,
      ],
      'Technical Writer': [
        `编写了用户手册和技术文档`,
        `完成了API文档的编写`,
        `制作了部署和运维指南`,
      ],
    };

    const agentOutputs = outputs[agent.role] || ['任务已完成'];
    return agentOutputs[Math.floor(Math.random() * agentOutputs.length)];
  }

  /**
   * 处理任务错误
   */
  private handleTaskError(task: Task, agent: Agent, error: Error): void {
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = new Date();

    agent.status = 'idle';
    agent.currentTask = undefined;
    agent.performance!.successRate =
      (agent.performance!.successRate *
        (agent.performance!.tasksCompleted + 1) -
        1) /
      (agent.performance!.tasksCompleted + 1);

    // 移动任务到失败队列
    this.taskQueue.running = this.taskQueue.running.filter(
      (t) => t.id !== task.id
    );
    this.taskQueue.failed.push(task);

    this.emit('task-failed', task, agent, error);
  }

  /**
   * 发送消息给Agent
   */
  sendMessage(message: AgentMessage): void {
    const handler = this.messageHandlers.get(message.toAgent || 'broadcast');
    if (handler) {
      handler(message);
    }

    this.emit('message-sent', message);
  }

  /**
   * 注册消息处理器
   */
  registerMessageHandler(
    agentId: string,
    handler: (message: AgentMessage) => void
  ): void {
    this.messageHandlers.set(agentId, handler);
  }

  /**
   * 获取任务队列状态
   */
  getTaskQueueStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.taskQueue.pending.length,
      running: this.taskQueue.running.length,
      completed: this.taskQueue.completed.length,
      failed: this.taskQueue.failed.length,
      total:
        this.taskQueue.pending.length +
        this.taskQueue.running.length +
        this.taskQueue.completed.length +
        this.taskQueue.failed.length,
    };
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    agents: { total: number; available: number; working: number };
    tasks: ReturnType<typeof AgentManager.prototype.getTaskQueueStatus>;
    config: AgentSystemConfig;
  } {
    const agents = this.getAllAgents();
    return {
      agents: {
        total: agents.length,
        available: agents.filter((a) => a.status === 'idle').length,
        working: agents.filter((a) => a.status === 'working').length,
      },
      tasks: this.getTaskQueueStatus(),
      config: this.config,
    };
  }

  /**
   * 注册事件监听器
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  /**
   * 创建任务计划
   */
  createTaskPlan(request: string, tasks: Task[]): TaskPlan {
    const plan: TaskPlan = {
      id: `plan-${Date.now()}`,
      originalRequest: request,
      title: this.generatePlanTitle(request),
      description: this.generatePlanDescription(request),
      tasks,
      status: 'planning',
      createdAt: new Date(),
      assignedAgents: [],
      progress: 0,
    };

    // 将任务添加到队列
    tasks.forEach((task) => this.addTask(task));

    this.emit('plan-created', plan);
    return plan;
  }

  /**
   * 生成计划标题
   */
  private generatePlanTitle(request: string): string {
    // 简单的标题生成逻辑
    if (request.includes('开发') || request.includes('实现')) {
      return `软件开发项目`;
    } else if (request.includes('分析') || request.includes('研究')) {
      return `分析研究项目`;
    } else if (request.includes('设计')) {
      return `设计项目`;
    } else {
      return `综合项目`;
    }
  }

  /**
   * 生成计划描述
   */
  private generatePlanDescription(request: string): string {
    return `基于用户需求"${request}"生成的任务执行计划`;
  }

  /**
   * 更新计划进度
   */
  updatePlanProgress(plan: TaskPlan): void {
    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter(
      (t) => t.status === 'completed'
    ).length;
    plan.progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    if (plan.progress === 100) {
      plan.status = 'completed';
      plan.completedAt = new Date();
    } else if (plan.tasks.some((t) => t.status === 'running')) {
      plan.status = 'executing';
      plan.startedAt = plan.startedAt || new Date();
    }

    this.emit('plan-updated', plan);
  }

  /**
   * 记录Agent事件
   */
  private logAgentEvent(agent: Agent, event: string): void {
    console.log(`AgentManager: ${agent.id} - ${event}`, {
      name: agent.name,
      status: agent.status,
      role: agent.role,
    });
  }
}
