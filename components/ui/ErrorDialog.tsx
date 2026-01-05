import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, X, AlertOctagon } from 'lucide-react';

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string | object | null;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ isOpen, onClose, title = "System Error", message, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  // Format details if it's an object
  const formattedDetails = typeof details === 'object' && details !== null 
    ? JSON.stringify(details, null, 2) 
    : String(details || '');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-noir-950/80 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-stone-100 dark:bg-stone-900 rounded-lg shadow-2xl border border-red-200 dark:border-red-900 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 flex items-center gap-3 border-b border-red-100 dark:border-red-900/30">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="flex-1 font-serif text-xl text-red-900 dark:text-red-200 font-medium">
              {title}
            </h3>
            <button 
              onClick={onClose}
              className="text-stone-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-stone-700 dark:text-stone-300 font-sans text-sm leading-relaxed">
              {message}
            </p>

            {formattedDetails && formattedDetails !== 'undefined' && (
              <div className="mt-6">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors"
                >
                  {isExpanded ? 'Hide Technical Details' : 'Show Technical Details'}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-stone-200 dark:bg-black/40 rounded p-3 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-all">
                          {formattedDetails}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 dark:bg-stone-950/50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};