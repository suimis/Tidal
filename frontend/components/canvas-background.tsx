'use client';

import React, { useEffect, useRef } from 'react';

interface ComponentData {
  count: number;
  rect: DOMRect | null;
  displayName: string;
}

type AnimationDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

interface CanvasBackgroundProps {
  // 网格配置
  gridSize?: number; // 网格大小，默认30
  gridColor?: string; // 网格颜色，默认'rgba(200, 200, 200, 0.15)'
  gridLineWidth?: number; // 网格线宽度，默认1

  // 动画配置
  animationSpeed?: number; // 动画速度，默认0.1
  direction?: AnimationDirection; // 移动方向，默认'down-right'

  // 组件追踪配置
  enableComponentTracking?: boolean; // 是否启用组件追踪，默认true
  trackedSelectors?: string[]; // 要追踪的组件选择器，默认['.greeting', '.chat-panel', '.carousel-bar']
  showComponentLabels?: boolean; // 是否显示组件标签，默认true

  // 样式配置
  zIndex?: number; // CSS z-index，默认0
  className?: string; // 额外的CSS类名
}

const DEFAULT_PROPS = {
  gridSize: 30,
  gridColor: 'rgba(200, 200, 200, 0.15)',
  gridLineWidth: 1,
  animationSpeed: 0.1,
  direction: 'down-right' as AnimationDirection,
  enableComponentTracking: true,
  trackedSelectors: ['.greeting', '.chat-panel', '.carousel-bar'],
  showComponentLabels: true,
  zIndex: 0,
};

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  'up-left': { x: -1, y: -1 },
  'up-right': { x: 1, y: -1 },
  'down-left': { x: -1, y: 1 },
  'down-right': { x: 1, y: 1 },
};

const COLORS = [
  '#37afa9', // 低频 - 冷色
  '#63b19e',
  '#80b393',
  '#97b488',
  '#abb67d',
  '#beb771',
  '#cfb965',
  '#dfba57',
  '#efbb49',
  '#febc38', // 高频 - 暖色
];

// 辅助函数：获取嵌套元素的边界矩形
function getNestedBoundingClientRect(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
    toJSON: rect.toJSON.bind(rect),
  };
}

export default function CanvasBackground(props: CanvasBackgroundProps) {
  const {
    gridSize = DEFAULT_PROPS.gridSize,
    gridColor = DEFAULT_PROPS.gridColor,
    gridLineWidth = DEFAULT_PROPS.gridLineWidth,
    animationSpeed = DEFAULT_PROPS.animationSpeed,
    direction = DEFAULT_PROPS.direction,
    enableComponentTracking = DEFAULT_PROPS.enableComponentTracking,
    trackedSelectors = DEFAULT_PROPS.trackedSelectors,
    showComponentLabels = DEFAULT_PROPS.showComponentLabels,
    zIndex = DEFAULT_PROPS.zIndex,
    className = '',
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeToData = useRef<Map<HTMLElement, ComponentData>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  const measureNode = function (node: HTMLElement): DOMRect | null {
    if (typeof node.getBoundingClientRect === 'function') {
      return getNestedBoundingClientRect(node);
    }
    return null;
  };

  const getDisplayName = function (node: HTMLElement): string {
    // 获取组件的显示名称
    if (node.dataset.componentName) {
      return node.dataset.componentName;
    }

    // 从class name中提取可能的组件名
    const className = node.className;
    if (className && typeof className === 'string') {
      const matches = className.match(
        /(?:^|\s)([A-Z][a-zA-Z0-9]*(?:-[A-Z][a-zA-Z0-9]*)*)/
      );
      if (matches) {
        return matches[1].replace(/-/g, ' ');
      }
    }

    // 从tagName获取
    return node.tagName.toLowerCase();
  };

  const drawLabel = function (
    context: CanvasRenderingContext2D,
    rect: DOMRect,
    text: string,
    color: string
  ): void {
    context.save();
    context.font = '12px monospace';
    context.fillStyle = color;
    context.textAlign = 'left';
    context.textBaseline = 'top';

    // 添加背景以提高可读性
    const textWidth = context.measureText(text).width;
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(rect.left, rect.top - 20, textWidth + 8, 18);

    context.fillStyle = color;
    context.fillText(text, rect.left + 4, rect.top - 16);
    context.restore();
  };

  // 动画状态
  const animationOffset = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  const drawDemoEffect = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    context.save();

    // 绘制移动的纯方格网格
    context.strokeStyle = gridColor;
    context.lineWidth = gridLineWidth;

    // 计算网格偏移
    const offsetX = animationOffset.current.x % gridSize;
    const offsetY = animationOffset.current.y % gridSize;

    // 绘制垂直线
    for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    // 绘制水平线
    for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.restore();
  };

  const drawWeb = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // 清除画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 如果没有追踪的组件，绘制演示效果
    if (nodeToData.current.size === 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        drawDemoEffect(context, rect.width, rect.height);
      }
      return;
    }

    // 绘制所有追踪的组件
    nodeToData.current.forEach((data) => {
      const colorIndex = Math.min(COLORS.length - 1, data.count - 1);
      const color = COLORS[colorIndex];

      if (data.rect) {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.rect(
          data.rect.left,
          data.rect.top,
          data.rect.width - 1,
          data.rect.height - 1
        );
        context.stroke();

        // 绘制组件名称标签
        if (showComponentLabels && data.displayName) {
          drawLabel(
            context,
            data.rect,
            `${data.displayName} (${data.count})`,
            color
          );
        }
      }
    });
  };

  // 动画循环
  const animateGrid = () => {
    const vector = DIRECTION_VECTORS[direction];

    // 更新偏移量
    animationOffset.current.x += animationSpeed * vector.x;
    animationOffset.current.y += animationSpeed * vector.y;

    // 重绘canvas
    drawWeb();

    // 继续动画循环
    animationRef.current = requestAnimationFrame(animateGrid);
  };

  const traceUpdates = (nodes: HTMLElement[]) => {
    nodes.forEach((node) => {
      const rect = measureNode(node);
      const existingData = nodeToData.current.get(node);

      nodeToData.current.set(node, {
        count: existingData ? existingData.count + 1 : 1,
        rect,
        displayName: getDisplayName(node),
      });
    });

    // 触发重绘
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawWeb);
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(dpr, dpr);
    }

    console.log('Canvas initialized:', {
      width: canvas.width,
      height: canvas.height,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });

    // 如果启用组件追踪，初始追踪一些关键组件
    if (enableComponentTracking) {
      const selector = trackedSelectors.join(', ');
      const elementsToTrack = container.querySelectorAll(selector);
      console.log('Found elements to track:', elementsToTrack.length);
      elementsToTrack.forEach((element) => {
        if (element instanceof HTMLElement) {
          console.log('Tracking element:', element.className);
          traceUpdates([element]);
        }
      });
    }

    // 如果没有找到元素或禁用组件追踪，至少绘制演示效果
    if (
      !enableComponentTracking ||
      (enableComponentTracking &&
        container.querySelectorAll(trackedSelectors.join(', ')).length === 0)
    ) {
      drawWeb();
    }
  };

  const handleResize = () => {
    initializeCanvas();
    drawWeb();
  };

  useEffect(() => {
    initializeCanvas();

    // 设置ResizeObserver来追踪容器大小变化
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(containerRef.current);
    }

    // 设置窗口resize监听
    window.addEventListener('resize', handleResize);

    // 启动网格动画
    animationRef.current = requestAnimationFrame(animateGrid);

    // 如果启用组件追踪，模拟组件更新追踪（演示用）
    let interval: NodeJS.Timeout | undefined;
    if (enableComponentTracking) {
      interval = setInterval(() => {
        if (containerRef.current) {
          const selector = trackedSelectors.join(', ');
          const elements = containerRef.current.querySelectorAll(selector);
          if (elements.length > 0) {
            traceUpdates(Array.from(elements) as HTMLElement[]);
          }
        }
      }, 2000);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          background: 'transparent',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
