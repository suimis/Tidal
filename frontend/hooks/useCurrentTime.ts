import { useEffect, useState } from 'react';

// 补零函数
export const padZero = (num: number): string => {
  return num < 10 ? `0${num}` : num.toString();
};

// 获取格式化时间
export const getFormattedTime = (date: Date = new Date()): string => {
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());

  return `${month}-${day} ${hours}:${minutes}`;
};

export const useCurrentTime = (updateInterval = 1000) => {
  const [currentTime, setCurrentTime] = useState(getFormattedTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  return currentTime;
};
