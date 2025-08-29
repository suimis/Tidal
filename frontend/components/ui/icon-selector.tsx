/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// 常用应用图标列表
const ICON_CATEGORIES = {
  应用: [
    'app-window',
    'smartphone',
    'monitor',
    'tablet',
    'laptop',
    'desktop',
    'mobile',
    'computer',
  ],
  工具: [
    'settings',
    'wrench',
    'hammer',
    'cog',
    'tool',
    'screwdriver',
    'gear',
    'construction',
  ],
  通信: [
    'message-square',
    'mail',
    'phone',
    'video',
    'message-circle',
    'phone-call',
    'mail-open',
    'send',
  ],
  数据: [
    'database',
    'server',
    'cloud',
    'hard-drive',
    'folder',
    'file',
    'archive',
    'save',
  ],
  商务: [
    'briefcase',
    'building',
    'users',
    'bar-chart',
    'trending-up',
    'pie-chart',
    'line-chart',
    'building-2',
  ],
  创意: [
    'palette',
    'camera',
    'image',
    'music',
    'paintbrush',
    'pen-tool',
    'edit',
    'brush',
  ],
  网络: [
    'globe',
    'wifi',
    'link',
    'share',
    'network',
    'router',
    'signal',
    'antenna',
  ],
  安全: [
    'shield',
    'lock',
    'key',
    'eye',
    'fingerprint',
    'shield-check',
    'key-round',
    'shield-alert',
  ],
};

// 将所有图标扁平化
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

interface IconSelectorProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

export function IconSelector({
  value,
  onChange,
  placeholder = '选择图标',
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  // 过滤图标
  const filteredIcons = useMemo(() => {
    let icons =
      selectedCategory === '全部'
        ? ALL_ICONS
        : ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] ||
          [];

    if (searchTerm) {
      icons = icons.filter((icon) =>
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return icons;
  }, [searchTerm, selectedCategory]);

  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    // 转换为 PascalCase
    const pascalCase = iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return (LucideIcons as any)[pascalCase];
  };

  // 渲染当前选中的图标
  const renderSelectedIcon = () => {
    if (!value) return null;
    const IconComponent = getIconComponent(value);
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 h-10 px-3"
        >
          {renderSelectedIcon()}
          <span className="text-sm">{value || placeholder}</span>
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>选择图标</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索图标..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === '全部' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('全部')}
              >
                全部
              </Badge>
              {Object.keys(ICON_CATEGORIES).map((category) => (
                <Badge
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>

            {/* 图标网格 */}
            <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2">
              {filteredIcons.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                if (!IconComponent) return null;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                      hover:bg-gray-50 hover:border-blue-300
                      ${
                        value === iconName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }
                    `}
                    title={iconName}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-xs text-gray-600 truncate w-full text-center">
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                没有找到匹配的图标
              </div>
            )}

            {/* 手动输入 */}
            <div className="border-t pt-4">
              <Label htmlFor="manual-icon">或手动输入图标名称：</Label>
              <Input
                id="manual-icon"
                placeholder="例如: message-square"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
