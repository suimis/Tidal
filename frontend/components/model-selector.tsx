/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { getCookie, setCookie } from '@/lib/utils/cookies';
import { useEffect, useState, memo } from 'react';
import { Model } from '@/lib/types/models';
import { createModelId } from '@/lib/utils/index';
import Image from 'next/image';
import { Check, ChevronDown, Lightbulb } from 'lucide-react';
import isEqual from 'lodash/isEqual';
import { isReasoningModel } from '@/lib/utils/registry';

function groupModelsByProvider(models: Model[]) {
  return models
    .filter((model) => model.enabled)
    .reduce<Record<string, Model[]>>((groups, model) => {
      const provider = model.provider;
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
      return groups;
    }, {});
}

interface ModelSelectorProps {
  models: Model[];
}

export default memo(
  function ModelSelector({ models }: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    useEffect(() => {
      const savedModel = getCookie('selectedModel');
      if (savedModel) {
        try {
          const model = JSON.parse(savedModel) as Model;
          setValue(createModelId(model));
        } catch (e) {
          console.error('Failed to parse saved model:', e);
        }
      }
    }, []);

    const handleModelSelect = (id: string) => {
      const newValue = id === value ? '' : id;
      setValue(newValue);

      const selectedModel = models.find(
        (model) => createModelId(model) === newValue
      );
      if (selectedModel) {
        setCookie('selectedModel', JSON.stringify(selectedModel));
      } else {
        setCookie('selectedModel', '');
      }

      setOpen(false);
    };

    const selectedModel = models.find(
      (model) => createModelId(model) === value
    );
    const groupedModels = groupModelsByProvider(models);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="mr-2 h-[2rem] flex cursor-pointer items-center justify-center gap-1.5 bg-neutral-200 px-2.5 duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 dark:bg-neutral-600/10 rounded-xl"
          >
            {selectedModel ? (
              <div className="flex items-center space-x-1">
                <Image
                  src={`/providers/logos/${selectedModel.providerId}.svg`}
                  alt={selectedModel.provider}
                  width={18}
                  height={18}
                  className="bg-white rounded-full border"
                />
                <span className="text-xs font-medium">
                  {selectedModel.name}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 font-geist-mono">
                选择模型
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 mt-1 p-0">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              {Object.entries(groupedModels).map(([provider, models]) => (
                <CommandGroup key={provider} heading={provider}>
                  {models.map((model) => {
                    const modelId = createModelId(model);
                    return (
                      <CommandItem
                        key={modelId}
                        value={modelId}
                        onSelect={handleModelSelect}
                        className="flex justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Image
                            src={`/providers/logos/${model.providerId}.svg`}
                            alt={model.provider}
                            width={18}
                            height={18}
                            className="bg-white rounded-full border"
                          />
                          <span className="text-xs font-medium">
                            {model.name}
                          </span>
                        </div>
                        <Check
                          className={`h-4 w-4 ${
                            value === modelId ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps.models, nextProps.models)
);
