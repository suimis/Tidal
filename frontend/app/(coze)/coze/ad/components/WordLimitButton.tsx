'use client';

import { useState } from 'react';
import { LetterText } from 'lucide-react';
import WordLimitSliderCard from './WordLimitSliderCard';

interface WordLimitButtonProps {
  currentValue: number;
  onChange: (value: number) => void;
}

export default function WordLimitButton({
  currentValue,
  onChange,
}: WordLimitButtonProps) {
  const [showSlider, setShowSlider] = useState(false);

  const handleToggleSlider = () => {
    setShowSlider(!showSlider);
  };

  const handleCloseSlider = () => {
    setShowSlider(false);
  };

  const handleValueChange = (value: number) => {
    onChange(value);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleSlider}
        className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed group"
        title={`字数限制: ${currentValue}字`}
      >
        <LetterText
          size={14}
          className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
        />
      </button>

      {showSlider && (
        <WordLimitSliderCard
          currentValue={currentValue}
          onChange={handleValueChange}
          onClose={handleCloseSlider}
        />
      )}
    </div>
  );
}
