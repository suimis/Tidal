'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Edit3,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  title: string;
  description: string;
  steps: string[];
  advantages: string[];
  step_num: number;
}

interface PlanCardProps {
  plan: Plan;
  onEdit: () => void;
  onExecute: () => void;
  onDismiss: () => void;
  onStepEdit?: (stepIndex: number, newContent: string) => void;
  isLoading?: boolean;
}

export function PlanCard({
  plan,
  onEdit,
  onExecute,
  onDismiss,
  onStepEdit,
  isLoading = false,
}: PlanCardProps) {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepContent, setEditingStepContent] = useState('');

  const handleStepDoubleClick = (stepIndex: number, stepContent: string) => {
    setEditingStepIndex(stepIndex);
    setEditingStepContent(stepContent);
  };

  const handleStepEditSave = () => {
    if (editingStepIndex !== null && editingStepContent.trim()) {
      onStepEdit?.(editingStepIndex, editingStepContent.trim());
      setEditingStepIndex(null);
      setEditingStepContent('');
    }
  };

  const handleStepEditCancel = () => {
    setEditingStepIndex(null);
    setEditingStepContent('');
  };

  const handleStepEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStepEditSave();
    } else if (e.key === 'Escape') {
      handleStepEditCancel();
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex justify-center mb-4 px-4"
      >
        <Card className="w-full max-w-2xl border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-indigo-700 font-medium">
                AI 正在生成计划中...
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex justify-center mb-4 px-4"
    >
      <Card className="w-full max-w-2xl border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-indigo-100 text-indigo-700"
                >
                  AI 计划
                </Badge>
                <div className="flex items-center gap-1 text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{plan.step_num} 步</span>
                </div>
              </div>
              <CardTitle className="text-base font-semibold text-neutral-800">
                {plan.title}
              </CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                {plan.description}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                title="关闭计划"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 优势展示 */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {plan.advantages.slice(0, 3).map((advantage, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-white/50"
                >
                  {advantage}
                </Badge>
              ))}
              {plan.advantages.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-white/50"
                >
                  +{plan.advantages.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* 步骤预览/详情 */}
          <div className="mb-4">
            <button
              onClick={() => setIsStepsExpanded(!isStepsExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              <span>执行步骤</span>
              {isStepsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {isStepsExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {plan.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="flex items-center justify-center w-5 h-5 text-xs bg-indigo-100 text-indigo-700 rounded-full flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {editingStepIndex === index ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editingStepContent}
                              onChange={(e) =>
                                setEditingStepContent(e.target.value)
                              }
                              onKeyDown={handleStepEditKeyDown}
                              className="text-sm h-7"
                              placeholder="输入步骤内容..."
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStepEditSave}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStepEditCancel}
                              className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="flex-1 cursor-pointer hover:bg-neutral-50 rounded px-1 py-0.5 transition-colors"
                            onDoubleClick={() =>
                              handleStepDoubleClick(index, step)
                            }
                            title="双击编辑步骤"
                          >
                            {step}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1">
                    {plan.steps.slice(0, 2).map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="flex items-center justify-center w-5 h-5 text-xs bg-indigo-100 text-indigo-700 rounded-full flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {editingStepIndex === index ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editingStepContent}
                              onChange={(e) =>
                                setEditingStepContent(e.target.value)
                              }
                              onKeyDown={handleStepEditKeyDown}
                              className="text-sm h-7"
                              placeholder="输入步骤内容..."
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStepEditSave}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStepEditCancel}
                              className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="flex-1 cursor-pointer hover:bg-neutral-50 rounded px-1 py-0.5 transition-colors line-clamp-1"
                            onDoubleClick={() =>
                              handleStepDoubleClick(index, step)
                            }
                            title="双击编辑步骤"
                          >
                            {step}
                          </span>
                        )}
                      </div>
                    ))}
                    {plan.steps.length > 2 && (
                      <div className="text-xs text-neutral-500 pl-7">
                        还有 {plan.steps.length - 2} 个步骤...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 text-xs"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              编辑计划
            </Button>
            <Button
              size="sm"
              onClick={onExecute}
              className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              <Play className="w-3 h-3 mr-1" />
              执行计划
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PlanCardLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex justify-center mb-4 px-4"
    >
      <Card className="w-full max-w-2xl border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-indigo-700 font-medium">
              AI 正在生成计划中...
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
