'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit3, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PlanStep {
  id: string;
  content: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface PlanStepItemProps {
  step: PlanStep;
  index: number;
  onEdit: (content: string) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function PlanStepItem({
  step,
  index,
  onEdit,
  onDelete,
  isDragging = false,
}: PlanStepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(step.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(step.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2 bg-white border border-neutral-200 rounded-md transition-all duration-200',
        'hover:border-neutral-300 hover:shadow-sm',
        (isDragging || isSortableDragging) &&
          'shadow-lg border-indigo-300 bg-indigo-50/50',
        step.status === 'completed' && 'bg-green-50 border-green-200',
        step.status === 'executing' && 'bg-blue-50 border-blue-200',
        step.status === 'failed' && 'bg-red-50 border-red-200'
      )}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-5 h-5 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* 步骤编号 */}
      <div className="flex items-center justify-center w-5 h-5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
        {index + 1}
      </div>

      {/* 步骤内容 */}
      <div className="flex-1">
        {isEditing ? (
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xs h-7"
            placeholder="输入步骤内容..."
            autoFocus
          />
        ) : (
          <span className="text-xs text-neutral-700">{step.content}</span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50"
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface AddStepItemProps {
  onAdd: (content: string) => void;
}

export function AddStepItem({ onAdd }: AddStepItemProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (content.trim()) {
      onAdd(content.trim());
      setContent('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-2 border-dashed border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
      <div className="w-5 h-5" /> {/* 占位符，对齐拖拽手柄 */}
      <div className="flex items-center justify-center w-5 h-5 text-xs font-medium text-neutral-400 bg-neutral-100 rounded-full">
        <Plus className="w-3 h-3" />
      </div>
      <div className="flex-1">
        {isAdding ? (
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xs h-7"
            placeholder="输入新步骤内容..."
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            添加新步骤...
          </button>
        )}
      </div>
      {isAdding && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAdd}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
