// src/components/greeting.tsx
'use client';

import useGreeting from '@/hooks/useGreeting';

export default function Greeting() {
  const greeting = useGreeting();

  return (
    <h1 className="mb-4 text-2xl tracking-tight text-transparent font-geist-mono md:text-3xl bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400">
      {greeting}！
    </h1>
  );
}
