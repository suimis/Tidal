// @/components/task-item.tsx
import React from 'react';

interface TaskItemProps {
  name: string;
  time: string;
  onClick: () => void;
  isActive?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  name,
  time,
  onClick,
  isActive = false,
}) => {
  return (
    <div
      className={`flex items-center p-2 border-b cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="font-semibold">{name}</div>
      <div className="ml-auto text-sm text-gray-500">{time}</div>
    </div>
  );
};
