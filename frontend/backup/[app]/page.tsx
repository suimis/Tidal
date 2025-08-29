'use client';
import { TaskItem } from '@/components/task-item';
import { TaskList } from '@/components/task-list';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useState } from 'react';

// 定义任务接口
interface Task {
  name: string;
  time: string;
  id: string; // 添加唯一标识符
}

interface PageProps {
  params: Promise<{ app: string }>;
}

export default function Page({ params }: PageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _app = params;
  // 添加示例任务数据（包含唯一ID）
  const [tasks] = useState<Task[]>([
    { name: '任务1', time: '1分钟前', id: 'task1' },
    { name: '任务2', time: '5分钟前', id: 'task2' },
    { name: '任务3', time: '10分钟前', id: 'task3' },
  ]);

  const [activeTask, setActiveTask] = useState<string | null>(null); // 存储选中任务的ID

  // 处理任务点击事件
  const handleTaskClick = (taskId: string) => {
    // 如果点击的是已选中的任务，则取消选中
    setActiveTask(activeTask === taskId ? null : taskId);
  };

  // 获取当前选中的任务对象
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentTask = tasks.find((task) => task.id === activeTask);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full rounded-lg border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={30}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={13}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">header</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <TaskList>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  name={task.name}
                  time={task.time}
                  // 添加点击事件和选中状态
                  onClick={() => handleTaskClick(task.id)}
                  isActive={activeTask === task.id}
                />
              ))}
            </TaskList>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      {/* 当有选中任务时显示右侧面板 */}
      {activeTask && <ResizableHandle />}
      {activeTask && <ResizablePanel defaultSize={40}></ResizablePanel>}
    </ResizablePanelGroup>
  );
}
