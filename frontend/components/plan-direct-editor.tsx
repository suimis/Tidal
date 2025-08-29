'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, X, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { PlanStepItem, AddStepItem, PlanStep } from './plan-step-item';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  title: string;
  description: string;
  steps: string[];
  advantages: string[];
  step_num: number;
}

interface PlanDirectEditorProps {
  plan: Plan;
  onExecute: (modifiedPlan: Plan) => void;
  onDismiss: () => void;
}

export function PlanDirectEditor({
  plan,
  onExecute,
  onDismiss,
}: PlanDirectEditorProps) {
  // 将字符串步骤转换为 PlanStep 对象
  const [steps, setSteps] = useState<PlanStep[]>(
    plan.steps.map((step, index) => ({
      id: `step-${index}`,
      content: step,
      status: 'pending' as const,
    }))
  );

  // 折叠状态管理
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleStepEdit = (stepId: string, newContent: string) => {
    setSteps((items) =>
      items.map((item) =>
        item.id === stepId ? { ...item, content: newContent } : item
      )
    );
  };

  const handleStepDelete = (stepId: string) => {
    setSteps((items) => items.filter((item) => item.id !== stepId));
  };

  const handleStepAdd = (content: string) => {
    const newStep: PlanStep = {
      id: `step-${Date.now()}`,
      content,
      status: 'pending',
    };
    setSteps((items) => [...items, newStep]);
  };

  const handleExecute = () => {
    // 创建修改后的计划对象
    const modifiedPlan: Plan = {
      ...plan,
      steps: steps.map((step) => step.content),
      step_num: steps.length,
    };
    onExecute(modifiedPlan);
  };

  // 如果最小化，只显示标题栏
  if (isMinimized) {
    return (
      <div className="absolute bottom-[10rem] left-1/2 transform -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full min-w-[320px] max-w-sm sm:max-w-md lg:max-w-lg"
        >
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/95 to-blue-50/95 backdrop-blur-md shadow-lg">
            <CardHeader className="py-2 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-indigo-100 text-indigo-700"
                  >
                    AI 计划
                  </Badge>
                  <span className="text-sm font-medium text-neutral-800 truncate">
                    {plan.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                    title="展开"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                    title="关闭"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-[10rem] left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[70vh] overflow-y-auto scrollbar-hide"
      >
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/95 to-blue-50/95 backdrop-blur-md shadow-lg">
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-indigo-100 text-indigo-700"
                  >
                    AI 计划
                  </Badge>
                  <div className="flex items-center gap-1 text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{steps.length} 步</span>
                  </div>
                </div>
                <CardTitle className="text-base font-semibold text-neutral-800 line-clamp-1">
                  {plan.title}
                </CardTitle>
                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                  {plan.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                  title="最小化"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                  title={isCollapsed ? '展开详情' : '收起详情'}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 优势展示 - 紧凑版 */}
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {plan.advantages.slice(0, 3).map((advantage, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 bg-white/50"
                  >
                    {advantage}
                  </Badge>
                ))}
                {plan.advantages.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 bg-white/50"
                  >
                    +{plan.advantages.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          {!isCollapsed && (
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 步骤编辑区域 - 紧凑版 */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map((step) => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <PlanStepItem
                        key={step.id}
                        step={step}
                        index={index}
                        onEdit={(content) => handleStepEdit(step.id, content)}
                        onDelete={() => handleStepDelete(step.id)}
                      />
                    ))}
                    <AddStepItem onAdd={handleStepAdd} />
                  </div>
                </SortableContext>
              </DndContext>

              {/* 执行按钮 - 紧凑版 */}
              <div className="flex justify-between items-center pt-2 border-t border-white/50">
                <span className="text-xs text-neutral-600">
                  {steps.length} 步骤
                </span>
                <Button
                  onClick={handleExecute}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                  disabled={steps.length === 0}
                >
                  <Play className="w-3 h-3 mr-1" />
                  执行
                </Button>
              </div>
            </CardContent>
          )}

          {/* 折叠状态下的简化执行按钮 */}
          {isCollapsed && (
            <CardContent className="px-4 pb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-600">
                  {steps.length} 步骤已准备
                </span>
                <Button
                  onClick={handleExecute}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3"
                  disabled={steps.length === 0}
                >
                  <Play className="w-3 h-3 mr-1" />
                  执行
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export function PlanDirectEditorLoading() {
  return (
    <div className="absolute bottom-[10rem] left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg"
      >
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/95 to-blue-50/95 backdrop-blur-md shadow-lg">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-indigo-700 font-medium">
                AI 正在生成计划中...
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
