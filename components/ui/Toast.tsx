import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="flex items-center gap-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-6 py-4 rounded-md shadow-2xl shadow-stone-900/20 dark:shadow-none border border-stone-800 dark:border-stone-200 min-w-[300px] backdrop-blur-md">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={16} className="text-green-500 dark:text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-lg leading-none">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-stone-500 hover:text-stone-300 dark:hover:text-stone-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
