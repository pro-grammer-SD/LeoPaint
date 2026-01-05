import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 0.2 }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex flex-col items-center justify-center z-10"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
            transition={{ duration: 0.15, delay }}
            className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} px-3 py-1.5 bg-stone-900/90 dark:bg-stone-100/90 text-stone-100 dark:text-stone-900 text-xs font-sans rounded shadow-xl backdrop-blur-sm whitespace-nowrap pointer-events-none z-[100] border border-stone-700 dark:border-stone-300`}
          >
            {content}
            {/* Arrow */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-stone-900/90 dark:bg-stone-100/90 border-stone-700 dark:border-stone-300 ${position === 'top' ? 'bottom-[-4px] border-r border-b' : 'top-[-4px] border-l border-t'}`}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};