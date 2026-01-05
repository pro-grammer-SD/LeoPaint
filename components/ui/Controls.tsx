import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Square, RectangleHorizontal, RectangleVertical, Sparkles } from 'lucide-react';
import { AspectRatio } from '../../types';
import { Tooltip } from './Tooltip';

// --- Aspect Ratio Selector ---
interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, disabled }) => {
  const ratios: { label: string; value: AspectRatio; icon: React.ReactNode; desc: string }[] = [
    { label: "Square", value: "1:1", icon: <Square size={18} />, desc: "Balanced (1:1)" },
    { label: "Portrait", value: "3:4", icon: <RectangleVertical size={18} />, desc: "Classic Portrait (3:4)" },
    { label: "Landscape", value: "4:3", icon: <RectangleHorizontal size={18} />, desc: "Classic Landscape (4:3)" },
    { label: "Tall", value: "9:16", icon: <RectangleVertical size={18} className="scale-y-125" />, desc: "Mobile Fullscreen (9:16)" },
    { label: "Wide", value: "16:9", icon: <RectangleHorizontal size={18} className="scale-x-125" />, desc: "Cinematic (16:9)" },
  ];

  return (
    <div className="space-y-4">
      <label className="text-sm tracking-widest uppercase text-stone-500 dark:text-noir-500 font-sans font-medium">
        Frame Ratio
      </label>
      <div className="flex flex-wrap gap-3">
        {ratios.map((r) => (
          <Tooltip key={r.value} content={r.desc}>
            <button
              onClick={() => onChange(r.value)}
              disabled={disabled}
              className={`
                relative flex items-center gap-2 px-4 py-3 rounded-sm border transition-all duration-300
                ${value === r.value 
                  ? 'bg-stone-200 dark:bg-noir-800 border-stone-400 dark:border-stone-600 text-stone-900 dark:text-stone-100' 
                  : 'bg-transparent border-stone-300 dark:border-noir-700 text-stone-500 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-600'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={`Select ${r.label} aspect ratio`}
            >
              {r.icon}
              <span className="text-sm font-serif italic">{r.value}</span>
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

// --- Prompt Enhancer Button ---
interface PromptEnhancerProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const PromptEnhancer: React.FC<PromptEnhancerProps> = ({ onClick, loading, disabled }) => {
  return (
    <Tooltip content="Enhance prompt with AI" position="bottom">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="absolute right-2 bottom-2 p-2 text-stone-500 hover:text-amber-500 dark:text-stone-500 dark:hover:text-amber-400 transition-colors disabled:opacity-30 group"
        aria-label="Enhance prompt"
      >
        <motion.div
          animate={loading ? { rotate: 360 } : {}}
          transition={loading ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
        >
          <Sparkles size={20} className={loading ? "text-amber-500" : ""} />
        </motion.div>
      </button>
    </Tooltip>
  );
};

// --- Primary Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const EditorialButton: React.FC<ButtonProps> = ({ children, loading, className, ...props }) => {
  return (
    <Tooltip content="Start image synthesis" position="top">
      <button
        {...props}
        disabled={props.disabled || loading}
        className={`
          relative overflow-hidden group w-full py-5 px-8
          bg-stone-100 dark:bg-stone-200 
          font-serif text-lg tracking-widest uppercase
          disabled:opacity-50 disabled:cursor-not-allowed
          border border-transparent
          ${className}
        `}
      >
        {/* Liquid Fill Background */}
        <span className="absolute inset-0 bg-stone-900 dark:bg-noir-950 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out origin-left z-0" />
        
        {/* Content Layer */}
        <div className="relative z-10 flex items-center justify-center gap-3 transition-colors duration-500 group-hover:text-stone-100 text-stone-900 dark:text-stone-900 dark:group-hover:text-stone-200">
          {loading && <Loader2 className="animate-spin" size={18} />}
          <span>{children}</span>
        </div>
      </button>
    </Tooltip>
  );
};