import {
  Aperture,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Diamond,
  LucideProps,
  Sparkles,
  ToyBrick,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEffect, useState } from 'react';
import { getCookie, setCookie } from '@/lib/utils/cookies';

interface modeType {
  mode: string;
  mode_eng: string;
  icon: keyof typeof iconMap;
  describe: string;
}

const modeList: modeType[] = [
  {
    mode: '常规模式',
    mode_eng: 'normal',
    icon: 'diamond',
    describe: '最常规的 AI 生成模式，外挂知识库功能。',
  },
  {
    mode: '计划模式',
    mode_eng: 'plan',
    icon: 'sparkles',
    describe: '根据您的要求，使用 AI 自动拆分计划。',
  },
  {
    mode: '提示词模式',
    mode_eng: 'prompt',
    icon: 'aperture',
    describe: '使用 AI 优化你的原始提示词。',
  },
  // {
  //   mode: '比较模式',
  //   mode_eng: 'compare',
  //   icon: 'arrowLeftRight',
  //   describe: '让多个顶级 AI 模型并行回复你的问题。',
  // },
  // {
  //   mode: '插件模式',
  //   mode_eng: 'plugin',
  //   icon: 'toybrick',
  //   describe: '为 AI 外挂插件或外部工具。',
  // },
];

// 1. 创建图标名称到组件的映射
const iconMap = {
  diamond: Diamond,
  sparkles: Sparkles,
  aperture: Aperture,
  arrowLeftRight: ArrowLeftRight,
  toybrick: ToyBrick,
};

const DynamicIcon = ({
  iconName,
  ...props
}: LucideProps & { iconName: keyof typeof iconMap }) => {
  const IconComponent = iconMap[iconName];
  return <IconComponent {...props} />;
};

export default function ModeSelector({
  mode,
  handleSelectMode,
}: {
  mode: string;
  handleSelectMode: (mode: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 从 cookie 初始化模式
    const savedMode = getCookie('mode');
    if (savedMode && modeList.some((mode) => mode.mode_eng === savedMode)) {
      handleSelectMode(savedMode);
    }
  }, []);

  const handleSelect = (mode: string) => {
    handleSelectMode(mode);
    setCookie('mode', mode);
    setOpen(false);
  };

  const currentMode =
    modeList.find((item) => item.mode_eng === mode) || modeList[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="mr-2 h-[2rem] flex cursor-pointer items-center justify-center gap-1.5 bg-neutral-200 px-2.5 duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 dark:bg-neutral-600/10 rounded-xl"
        >
          <DynamicIcon
            iconName={currentMode.icon}
            className="h-4 w-4 shrink-0 opacity-50"
          />
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">{currentMode.mode}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-138 mt-3.5 p-2!" align="start">
        <section className="grid grid-cols-3 gap-2">
          {modeList.map((item) => {
            const { mode, mode_eng, icon, describe } = item;
            const isSelected = mode_eng === mode;

            return (
              <div
                key={mode_eng}
                onClick={() => handleSelect(mode_eng)}
                className={`flex flex-col gap-2 cursor-pointer rounded-md p-2 w-[11rem] h-[6rem] duration-300 transition-all border ${
                  isSelected
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'border-neutral-300/80'
                } bg-gradient-to-br from-white to-neutral-50/80`}
              >
                <div className="flex gap-2 items-center">
                  <DynamicIcon iconName={icon} className="size-3" />
                  <span className="text-xs font-medium">{mode}</span>
                  {isSelected && (
                    <span className="flex items-center justify-center ml-auto bg-indigo-500/80 rounded-full size-[0.9rem]">
                      <Check className="size-2 text-white" />
                    </span>
                  )}
                </div>
                <div className="font-geist-mono tracking-tight transition-colors duration-300 line-clamp-2 text-[11px] leading-[12px] text-neutral-600 dark:text-neutral-300">
                  {describe}
                </div>
              </div>
            );
          })}
        </section>
      </PopoverContent>
    </Popover>
  );
}
