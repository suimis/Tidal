'use client';

import CanvasBackground from '@/components/canvas-background';

export default function AdBackground() {
  return (
    <div className="w-full h-full">
      <CanvasBackground
        gridSize={25}
        animationSpeed={0.18}
        direction="down-left"
        gridColor="rgba(50, 100, 200, 0.12)"
        gridLineWidth={1}
        enableComponentTracking={false}
        showComponentLabels={false}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 0,
          opacity: 1,
          backgroundImage:
            'linear-gradient(to top, rgba(255,255,255,0.7), transparent)',
          backgroundSize: '100% 45vh',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          height: '45vh',
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 0,
          opacity: 1,
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)',
          backgroundSize: '100% 45vh',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
          height: '45vh',
        }}
      />
    </div>
  );
}
