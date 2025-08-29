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
import { PlanStepItem, AddStepItem, PlanStep } from './plan-step-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  id: string;
  title: string;
  description: string;
  steps: string[];
  advantages: string[];
  step_num: number;
}

interface PlanStepEditorProps {
  plan: Plan;
  onPlanModify: (modifiedPlan: Plan) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlanStepEditor({
  plan,
  onPlanModify,
  onConfirm,
  onCancel,
}: PlanStepEditorProps) {
  // 将字符串步骤转换为 PlanStep 对象
  const [steps, setSteps] = useState<PlanStep[]>(
    plan.steps.map((step, index) => ({
      id: `step-${index}`,
      content: step,
      status: 'pending' as const,
    }))
  );

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

  const handleConfirm = () => {
    // 更新计划对象
    const updatedPlan: Plan = {
      ...plan,
      steps: steps.map((step) => step.content),
      step_num: steps.length,
    };
    onPlanModify(updatedPlan);
    onConfirm();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 计划信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-800">
            {plan.title}
          </CardTitle>
          <p className="text-sm text-neutral-600">{plan.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700">优势：</h4>
            <ul className="list-disc list-inside space-y-1">
              {plan.advantages.map((advantage, index) => (
                <li key={index} className="text-sm text-neutral-600">
                  {advantage}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 步骤编辑区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-800">
            编辑执行步骤
          </CardTitle>
          <p className="text-sm text-neutral-600">
            拖拽步骤可以调整顺序，点击编辑按钮可以修改内容
          </p>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((step) => step.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
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
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-600">共 {steps.length} 个步骤</div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            确认执行计划
          </Button>
        </div>
      </div>
    </div>
  );
}
