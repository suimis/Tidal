'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  title: string;
  description: string;
  steps: string[];
  advantages: string[];
  step_num: number;
}

interface PlanDisplayProps {
  plans: Plan[];
  onPlanSelect: (plan: Plan) => void;
  onPlanEdit: (plan: Plan) => void;
  isLoading?: boolean;
}

export function PlanDisplay({
  plans,
  onPlanSelect,
  onPlanEdit,
  isLoading = false,
}: PlanDisplayProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlanId(plan.id);
    onPlanSelect(plan);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">AI 正在为您生成计划方案...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-neutral-600">暂无计划方案</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-neutral-800">
          AI 为您生成了 {plans.length} 个计划方案
        </h2>
        <p className="text-sm text-neutral-600">
          请选择一个方案进行编辑和执行，或直接执行
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan, index) => (
          <Card
            key={plan.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              selectedPlanId === plan.id &&
                'ring-2 ring-indigo-500 border-indigo-200'
            )}
            onClick={() => handlePlanSelect(plan)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-neutral-800 line-clamp-2">
                    {plan.title}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    方案 {index + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{plan.step_num} 步</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 描述 */}
              <p className="text-sm text-neutral-600 line-clamp-3">
                {plan.description}
              </p>

              {/* 步骤预览 */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-700">
                  执行步骤：
                </h4>
                <div className="space-y-1">
                  {plan.steps.slice(0, 3).map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className="flex items-start gap-2 text-xs text-neutral-600"
                    >
                      <span className="flex items-center justify-center w-4 h-4 text-xs bg-neutral-100 rounded-full flex-shrink-0 mt-0.5">
                        {stepIndex + 1}
                      </span>
                      <span className="line-clamp-2">{step}</span>
                    </div>
                  ))}
                  {plan.steps.length > 3 && (
                    <div className="text-xs text-neutral-500 pl-6">
                      还有 {plan.steps.length - 3} 个步骤...
                    </div>
                  )}
                </div>
              </div>

              {/* 优势 */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-700">优势：</h4>
                <div className="flex flex-wrap gap-1">
                  {plan.advantages.slice(0, 2).map((advantage, advIndex) => (
                    <Badge
                      key={advIndex}
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                    >
                      {advantage}
                    </Badge>
                  ))}
                  {plan.advantages.length > 2 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{plan.advantages.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanEdit(plan);
                  }}
                  className="flex-1 text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan);
                  }}
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  执行
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlanId && (
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            已选择方案，您可以直接执行或先编辑后执行
          </p>
        </div>
      )}
    </div>
  );
}
