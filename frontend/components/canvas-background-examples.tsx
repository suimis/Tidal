'use client';

import CanvasBackground from './canvas-background';

export default function CanvasBackgroundExamples() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold mb-8">CanvasBackground 使用示例</h1>

      {/* 示例1: 默认配置 */}
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <h2 className="absolute top-4 left-4 z-10 text-lg font-semibold bg-white/80 px-3 py-1 rounded">
          默认配置 (向右下移动)
        </h2>
        <CanvasBackground />
      </div>

      {/* 示例2: 八个方向展示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            向上
          </h3>
          <CanvasBackground direction="up" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            向下
          </h3>
          <CanvasBackground direction="down" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            向左
          </h3>
          <CanvasBackground direction="left" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            向右
          </h3>
          <CanvasBackground direction="right" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            左上
          </h3>
          <CanvasBackground direction="up-left" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            右上
          </h3>
          <CanvasBackground direction="up-right" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            左下
          </h3>
          <CanvasBackground direction="down-left" animationSpeed={0.15} />
        </div>

        <div className="relative h-40 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            右下
          </h3>
          <CanvasBackground direction="down-right" animationSpeed={0.15} />
        </div>
      </div>

      {/* 示例3: 不同网格大小 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative h-48 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            小网格 (15px)
          </h3>
          <CanvasBackground
            gridSize={15}
            gridColor="rgba(255, 100, 100, 0.2)"
          />
        </div>

        <div className="relative h-48 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            中网格 (30px)
          </h3>
          <CanvasBackground
            gridSize={30}
            gridColor="rgba(100, 255, 100, 0.2)"
          />
        </div>

        <div className="relative h-48 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            大网格 (50px)
          </h3>
          <CanvasBackground
            gridSize={50}
            gridColor="rgba(100, 100, 255, 0.2)"
          />
        </div>
      </div>

      {/* 示例4: coze/ad 工作流专用背景 */}
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <h2 className="absolute top-4 left-4 z-10 text-lg font-semibold bg-white/80 px-3 py-1 rounded">
          coze/ad 工作流专用背景
        </h2>
        <CanvasBackground
          gridSize={25}
          animationSpeed={0.08}
          direction="up-right"
          gridColor="rgba(50, 100, 200, 0.12)"
          gridLineWidth={1}
          enableComponentTracking={false}
          showComponentLabels={false}
          zIndex={1}
        />
      </div>

      {/* 示例5: 自定义颜色主题 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative h-48 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            温暖主题
          </h3>
          <CanvasBackground
            gridSize={35}
            animationSpeed={0.12}
            direction="down-right"
            gridColor="rgba(255, 150, 50, 0.15)"
            gridLineWidth={2}
          />
        </div>

        <div className="relative h-48 border rounded-lg overflow-hidden">
          <h3 className="absolute top-2 left-2 z-10 text-sm bg-white/80 px-2 py-1 rounded">
            冷色主题
          </h3>
          <CanvasBackground
            gridSize={35}
            animationSpeed={0.12}
            direction="up-left"
            gridColor="rgba(50, 150, 255, 0.15)"
            gridLineWidth={2}
          />
        </div>
      </div>
    </div>
  );
}
