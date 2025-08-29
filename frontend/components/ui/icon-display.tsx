/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import * as LucideIcons from 'lucide-react';

interface IconDisplayProps {
  iconName: string;
  className?: string;
}

export function IconDisplay({
  iconName,
  className = 'h-4 w-4',
}: IconDisplayProps) {
  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    if (!iconName) return null;

    // 转换为 PascalCase
    const pascalCase = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return (LucideIcons as any)[pascalCase];
  };

  const IconComponent = getIconComponent(iconName);

  if (!IconComponent) {
    // 如果图标不存在，显示默认图标
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <IconComponent className={className} />;
}
