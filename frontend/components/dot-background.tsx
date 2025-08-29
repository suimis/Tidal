'use client';

import React, { useEffect, useRef } from 'react';

interface DotBackgroundProps {
  // 点阵配置
  dotSpacing?: number; // 点之间的间距，默认20px
  dotSize?: number; // 点的大小，默认2px
  dotColor?: string; // 点的颜色，默认'rgba(150, 150, 150, 0.3)'
  backgroundColor?: string; // 背景颜色，默认'#f5f5f5'

  // 样式配置
  zIndex?: number; // CSS z-index，默认0
  className?: string; // 额外的CSS类名
}

const DEFAULT_PROPS = {
  dotSpacing: 20,
  dotSize: 1,
  dotColor: 'rgba(150, 150, 150, 0.3)',
  backgroundColor: '#f5f5f5',
  zIndex: 0,
};

export default function DotBackground(props: DotBackgroundProps) {
  const {
    dotSpacing = DEFAULT_PROPS.dotSpacing,
    dotSize = DEFAULT_PROPS.dotSize,
    dotColor = DEFAULT_PROPS.dotColor,
    backgroundColor = DEFAULT_PROPS.backgroundColor,
    zIndex = DEFAULT_PROPS.zIndex,
    className = '',
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  const drawDots = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // 清除画布并设置背景色
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 设置点的颜色
    context.fillStyle = dotColor;

    // 绘制点阵
    for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
      for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
        context.beginPath();
        context.arc(x, y, dotSize, 0, Math.PI * 2);
        context.fill();
      }
    }
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

    // 绘制点阵
    drawDots();
  };

  const handleResize = () => {
    initializeCanvas();
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

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [dotSpacing, dotSize, dotColor, backgroundColor]);

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
