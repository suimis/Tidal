// src/hooks/useGreeting.ts
import { useState, useEffect } from 'react';

const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 0 && currentHour < 6) return '凌晨好';
  if (currentHour < 12) return '上午好';
  if (currentHour < 18) return '下午好';
  return '晚上好';
};

export default function useGreeting() {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting());

    // 每分钟检查一次时间
    const timer = setInterval(updateGreeting, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  return greeting;
}
