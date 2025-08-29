import { Task, Agent, TaskPlan } from '@/lib/types/agent';

export interface DecompositionRule {
  keywords: string[];
  taskType: string;
  template: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
  };
  requiredAgents: string[];
}

export interface DecompositionContext {
  userRequest: string;
  complexity: 'simple' | 'medium' | 'complex';
  domain: string;
  constraints?: string[];
}

export class TaskDecomposer {
  private decompositionRules: DecompositionRule[] = [];
  private agentCapabilities: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDecompositionRules();
    this.initializeAgentCapabilities();
  }

  /**
   * 初始化任务分解规则
   */
  private initializeDecompositionRules(): void {
    this.decompositionRules = [
      // 开发相关规则
      {
        keywords: ['开发', '实现', '编写', '编程', '构建'],
        taskType: 'development',
        template: {
          title: '开发{feature}',
          description: '实现{feature}功能，包括核心逻辑和界面开发',
          priority: 'high',
          estimatedDuration: 120,
        },
        requiredAgents: ['developer'],
      },
      {
        keywords: ['设计', '架构', '规划', '原型'],
        taskType: 'design',
        template: {
          title: '设计{component}',
          description: '设计{component}的架构和用户界面',
          priority: 'high',
          estimatedDuration: 90,
        },
        requiredAgents: ['architect'],
      },
      {
        keywords: ['测试', '验证', '检查', '质量'],
        taskType: 'testing',
        template: {
          title: '测试{feature}',
          description: '对{feature}进行全面的功能和性能测试',
          priority: 'medium',
          estimatedDuration: 60,
        },
        requiredAgents: ['tester'],
      },
      {
        keywords: ['文档', '说明', '手册', '指南'],
        taskType: 'documentation',
        template: {
          title: '编写{feature}文档',
          description: '为{feature}编写用户手册和技术文档',
          priority: 'medium',
          estimatedDuration: 45,
        },
        requiredAgents: ['document-writer'],
      },
      {
        keywords: ['分析', '研究', '调研', '需求'],
        taskType: 'analysis',
        template: {
          title: '分析{domain}',
          description: '分析{domain}的需求和可行性',
          priority: 'high',
          estimatedDuration: 75,
        },
        requiredAgents: ['product-manager'],
      },
      {
        keywords: ['部署', '发布', '上线', '运维'],
        taskType: 'deployment',
        template: {
          title: '部署{system}',
          description: '将{system}部署到生产环境',
          priority: 'critical',
          estimatedDuration: 30,
        },
        requiredAgents: ['developer'],
      },
      {
        keywords: ['优化', '改进', '提升', '性能'],
        taskType: 'optimization',
        template: {
          title: '优化{aspect}',
          description: '优化{aspect}的性能和用户体验',
          priority: 'medium',
          estimatedDuration: 90,
        },
        requiredAgents: ['developer', 'tester'],
      },
      {
        keywords: ['集成', '对接', '连接', '接口'],
        taskType: 'integration',
        template: {
          title: '集成{system}',
          description: '将{system}与现有系统进行集成',
          priority: 'high',
          estimatedDuration: 100,
        },
        requiredAgents: ['developer', 'architect'],
      },
    ];
  }

  /**
   * 初始化Agent能力映射
   */
  private initializeAgentCapabilities(): void {
    this.agentCapabilities = new Map([
      [
        'product-manager',
        ['需求分析', '任务分解', '优先级排序', '用户故事编写', '市场调研'],
      ],
      [
        'architect',
        ['系统设计', '技术选型', '架构规划', '性能优化', '安全设计'],
      ],
      ['developer', ['代码实现', '单元测试', '代码审查', '调试', '重构']],
      [
        'tester',
        ['测试计划', '测试执行', '缺陷报告', '质量保证', '自动化测试'],
      ],
      [
        'document-writer',
        ['文档编写', '用户手册', '技术文档', 'API文档', '部署指南'],
      ],
    ]);
  }

  /**
   * 分解用户请求为任务列表
   */
  decomposeRequest(
    request: string,
    context?: Partial<DecompositionContext>
  ): Task[] {
    const fullContext: DecompositionContext = {
      userRequest: request,
      complexity: this.assessComplexity(request),
      domain: this.extractDomain(request),
      constraints: context?.constraints,
      ...context,
    };

    const tasks: Task[] = [];
    const taskComponents = this.extractTaskComponents(request);

    // 根据复杂度决定分解策略
    if (fullContext.complexity === 'simple') {
      tasks.push(...this.createSimpleTasks(taskComponents, fullContext));
    } else if (fullContext.complexity === 'medium') {
      tasks.push(
        ...this.createMediumComplexityTasks(taskComponents, fullContext)
      );
    } else {
      tasks.push(...this.createComplexTasks(taskComponents, fullContext));
    }

    // 添加任务依赖关系
    this.addTaskDependencies(tasks, fullContext);

    // 设置任务优先级
    this.adjustTaskPriorities(tasks, fullContext);

    return tasks;
  }

  /**
   * 评估请求复杂度
   */
  private assessComplexity(request: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['添加', '修改', '删除', '更新', '简单'],
      medium: ['开发', '实现', '设计', '测试', '集成'],
      complex: ['系统', '平台', '架构', '重构', '迁移', '优化'],
    };

    let score = 0;
    const lowerRequest = request.toLowerCase();

    Object.entries(complexityIndicators).forEach(([level, indicators]) => {
      const matches = indicators.filter((indicator) =>
        lowerRequest.includes(indicator)
      ).length;

      if (level === 'simple') score += matches * 1;
      else if (level === 'medium') score += matches * 2;
      else if (level === 'complex') score += matches * 3;
    });

    // 检查任务数量暗示
    const taskCountMatches =
      request.match(/\d+个?任务/) ||
      request.match(/多步/) ||
      request.match(/分阶段/);
    if (taskCountMatches) score += 3;

    if (score <= 2) return 'simple';
    if (score <= 6) return 'medium';
    return 'complex';
  }

  /**
   * 提取领域信息
   */
  private extractDomain(request: string): string {
    const domainKeywords = [
      '网站',
      '应用',
      '系统',
      '平台',
      '软件',
      '程序',
      '服务',
      'API',
      '数据库',
      '前端',
      '后端',
      '移动端',
      '桌面端',
    ];

    const lowerRequest = request.toLowerCase();
    for (const keyword of domainKeywords) {
      if (lowerRequest.includes(keyword)) {
        return keyword;
      }
    }

    return '通用';
  }

  /**
   * 提取任务组件
   */
  private extractTaskComponents(request: string): string[] {
    const components: string[] = [];

    // 提取主要功能点
    const featureMatches = request.match(
      /(?:开发|实现|设计|测试|优化|集成)\s*([^，。！？]+)/g
    );
    if (featureMatches) {
      featureMatches.forEach((match) => {
        const component = match.replace(
          /^(开发|实现|设计|测试|优化|集成)\s*/,
          ''
        );
        if (component.trim()) {
          components.push(component.trim());
        }
      });
    }

    // 如果没有明确的特征，使用整个请求作为组件
    if (components.length === 0) {
      components.push(request);
    }

    return components;
  }

  /**
   * 创建简单任务
   */
  private createSimpleTasks(
    components: string[],
    context: DecompositionContext
  ): Task[] {
    const tasks: Task[] = [];

    components.forEach((component, index) => {
      const rule = this.findBestMatchingRule(component);
      if (rule) {
        tasks.push(this.createTaskFromRule(rule, component, index, context));
      }
    });

    return tasks;
  }

  /**
   * 创建中等复杂度任务
   */
  private createMediumComplexityTasks(
    components: string[],
    context: DecompositionContext
  ): Task[] {
    const tasks: Task[] = [];

    components.forEach((component, index) => {
      // 为每个组件创建多个任务
      const relevantRules = this.decompositionRules.filter((rule) =>
        rule.keywords.some((keyword) =>
          component.toLowerCase().includes(keyword)
        )
      );

      if (relevantRules.length > 0) {
        relevantRules.forEach((rule, ruleIndex) => {
          tasks.push(
            this.createTaskFromRule(
              rule,
              component,
              index * 10 + ruleIndex,
              context
            )
          );
        });
      } else {
        // 默认任务
        const defaultRule = this.decompositionRules[0];
        tasks.push(
          this.createTaskFromRule(defaultRule, component, index * 10, context)
        );
      }
    });

    return tasks;
  }

  /**
   * 创建复杂任务
   */
  private createComplexTasks(
    components: string[],
    context: DecompositionContext
  ): Task[] {
    const tasks: Task[] = [];

    // 添加项目规划任务
    tasks.push(this.createPlanningTask(context));

    // 为每个组件创建完整的任务链
    components.forEach((component, index) => {
      const taskChain = this.createTaskChain(component, index * 100, context);
      tasks.push(...taskChain);
    });

    // 添加项目总结任务
    tasks.push(this.createSummaryTask(context, tasks.length));

    return tasks;
  }

  /**
   * 创建任务链
   */
  private createTaskChain(
    component: string,
    baseIndex: number,
    context: DecompositionContext
  ): Task[] {
    const chain: Task[] = [];
    const taskTypes = [
      'analysis',
      'design',
      'development',
      'testing',
      'documentation',
    ];

    taskTypes.forEach((taskType, chainIndex) => {
      const rule = this.decompositionRules.find((r) => r.taskType === taskType);
      if (rule) {
        chain.push(
          this.createTaskFromRule(
            rule,
            component,
            baseIndex + chainIndex * 10,
            context
          )
        );
      }
    });

    return chain;
  }

  /**
   * 创建项目规划任务
   */
  private createPlanningTask(context: DecompositionContext): Task {
    return {
      id: `task-planning-${Date.now()}`,
      title: '项目规划',
      description: `对"${context.userRequest}"进行项目规划和需求分析`,
      status: 'pending',
      priority: 'critical',
      estimatedDuration: 60,
      createdAt: new Date(),
      dependencies: [],
      assignedAgent: 'product-manager',
    };
  }

  /**
   * 创建项目总结任务
   */
  private createSummaryTask(
    context: DecompositionContext,
    taskCount: number
  ): Task {
    return {
      id: `task-summary-${Date.now()}`,
      title: '项目总结',
      description: `总结项目执行结果，编写最终报告`,
      status: 'pending',
      priority: 'medium',
      estimatedDuration: 30,
      createdAt: new Date(),
      dependencies: Array.from(
        { length: taskCount - 1 },
        (_, i) => `task-${i}`
      ),
      assignedAgent: 'product-manager',
    };
  }

  /**
   * 找到最佳匹配规则
   */
  private findBestMatchingRule(
    component: string
  ): DecompositionRule | undefined {
    const lowerComponent = component.toLowerCase();

    return this.decompositionRules.find((rule) =>
      rule.keywords.some((keyword) => lowerComponent.includes(keyword))
    );
  }

  /**
   * 根据规则创建任务
   */
  private createTaskFromRule(
    rule: DecompositionRule,
    component: string,
    index: number,
    context: DecompositionContext
  ): Task {
    const taskId = `task-${index}-${Date.now()}`;

    return {
      id: taskId,
      title: rule.template.title
        .replace('{feature}', component)
        .replace('{component}', component)
        .replace('{system}', component)
        .replace('{aspect}', component)
        .replace('{domain}', context.domain),
      description: rule.template.description
        .replace('{feature}', component)
        .replace('{component}', component)
        .replace('{system}', component)
        .replace('{aspect}', component)
        .replace('{domain}', context.domain),
      status: 'pending',
      priority: rule.template.priority,
      estimatedDuration: rule.template.estimatedDuration,
      createdAt: new Date(),
      dependencies: [],
      assignedAgent: rule.requiredAgents[0], // 分配第一个合适的Agent
    };
  }

  /**
   * 添加任务依赖关系
   */
  private addTaskDependencies(
    tasks: Task[],
    context: DecompositionContext
  ): void {
    if (context.complexity === 'simple') {
      // 简单任务通常没有依赖
      return;
    }

    // 为复杂任务添加逻辑依赖
    tasks.forEach((task, index) => {
      if (task.title.includes('设计')) {
        // 设计任务依赖于分析任务
        const analysisTask = tasks.find((t) => t.title.includes('分析'));
        if (analysisTask) {
          task.dependencies.push(analysisTask.id);
        }
      } else if (task.title.includes('开发')) {
        // 开发任务依赖于设计任务
        const designTask = tasks.find((t) => t.title.includes('设计'));
        if (designTask) {
          task.dependencies.push(designTask.id);
        }
      } else if (task.title.includes('测试')) {
        // 测试任务依赖于开发任务
        const devTask = tasks.find(
          (t) => t.title.includes('开发') || t.title.includes('实现')
        );
        if (devTask) {
          task.dependencies.push(devTask.id);
        }
      } else if (task.title.includes('文档')) {
        // 文档任务依赖于开发任务
        const devTask = tasks.find(
          (t) => t.title.includes('开发') || t.title.includes('实现')
        );
        if (devTask) {
          task.dependencies.push(devTask.id);
        }
      }
    });
  }

  /**
   * 调整任务优先级
   */
  private adjustTaskPriorities(
    tasks: Task[],
    context: DecompositionContext
  ): void {
    if (context.constraints) {
      context.constraints.forEach((constraint) => {
        if (constraint.includes('紧急') || constraint.includes('优先')) {
          // 提高所有任务优先级
          tasks.forEach((task) => {
            if (task.priority === 'low') task.priority = 'medium';
            else if (task.priority === 'medium') task.priority = 'high';
            else if (task.priority === 'high') task.priority = 'critical';
          });
        }
      });
    }

    // 根据任务类型调整优先级
    tasks.forEach((task) => {
      if (task.title.includes('规划') || task.title.includes('分析')) {
        task.priority = 'critical';
      } else if (task.title.includes('部署') || task.title.includes('上线')) {
        task.priority = 'high';
      }
    });
  }

  /**
   * 生成任务列表
   */
  private generateTasks(request: string, availableAgents: Agent[]): Task[] {
    return this.decomposeRequest(request);
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
   * 分解复杂任务为多个子任务
   */
  public async decomposeTask(
    request: string,
    availableAgents: Agent[]
  ): Promise<TaskPlan> {
    // 分析请求并生成任务计划
    const tasks = this.generateTasks(request, availableAgents);

    return {
      id: `plan_${Date.now()}`,
      originalRequest: request,
      title: this.generatePlanTitle(request),
      description: this.generatePlanDescription(request),
      tasks,
      status: 'planning',
      createdAt: new Date(),
      assignedAgents: [],
      progress: 0,
    };
  }

  /**
   * 获取分解统计信息
   */
  getDecompositionStats(tasks: Task[]): {
    totalTasks: number;
    totalEstimatedDuration: number;
    priorityDistribution: Record<string, number>;
    agentDistribution: Record<string, number>;
  } {
    const stats = {
      totalTasks: tasks.length,
      totalEstimatedDuration: tasks.reduce(
        (sum, task) => sum + (task.estimatedDuration || 0),
        0
      ),
      priorityDistribution: {} as Record<string, number>,
      agentDistribution: {} as Record<string, number>,
    };

    // 统计优先级分布
    tasks.forEach((task) => {
      stats.priorityDistribution[task.priority] =
        (stats.priorityDistribution[task.priority] || 0) + 1;
    });

    // 统计Agent分布
    tasks.forEach((task) => {
      if (task.assignedAgent) {
        stats.agentDistribution[task.assignedAgent] =
          (stats.agentDistribution[task.assignedAgent] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * 验证任务分解的合理性
   */
  validateDecomposition(
    tasks: Task[],
    context: DecompositionContext
  ): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查任务数量
    if (tasks.length === 0) {
      issues.push('没有生成任何任务');
    } else if (tasks.length > 20) {
      issues.push('任务数量过多，可能需要合并一些任务');
      suggestions.push('考虑将相关任务合并为更大的任务单元');
    }

    // 检查任务依赖循环
    const hasCircularDependency = this.checkCircularDependencies(tasks);
    if (hasCircularDependency) {
      issues.push('检测到循环依赖');
      suggestions.push('重新检查任务依赖关系，确保没有循环');
    }

    // 检查任务分配
    const unassignedTasks = tasks.filter((task) => !task.assignedAgent);
    if (unassignedTasks.length > 0) {
      issues.push(`${unassignedTasks.length}个任务未分配Agent`);
      suggestions.push('为所有任务分配合适的Agent');
    }

    // 检查任务时长
    const longTasks = tasks.filter(
      (task) => (task.estimatedDuration || 0) > 240
    );
    if (longTasks.length > 0) {
      issues.push(`${longTasks.length}个任务预估时间过长（>4小时）`);
      suggestions.push('考虑将长时间任务分解为更小的子任务');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * 检查循环依赖
   */
  private checkCircularDependencies(tasks: Task[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    return tasks.some((task) => hasCycle(task.id));
  }
}
