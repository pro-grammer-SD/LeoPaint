import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2 } from 'lucide-react';
import { EditorialButton } from './Controls';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
  loading: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = () => {
    if (instruction.trim()) {
      onSubmit(instruction);
      setInstruction(''); // Clear after submit, parent will handle close usually
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-noir-950/90 backdrop-blur-sm p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-stone-100 dark:bg-stone-900 rounded-lg shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800"
        >
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="font-serif text-3xl text-stone-900 dark:text-stone-100 italic">Refine Vision</h3>
                  <p className="text-sm text-stone-500 mt-2 font-sans">What would you like to change about this image?</p>
               </div>
               <button onClick={onClose} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                  <X size={24} />
               </button>
            </div>

            <textarea
              autoFocus
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Make it sunset, add a cat in the foreground, change the background to a city..."
              className="w-full bg-stone-50 dark:bg-stone-950/50 border border-stone-300 dark:border-stone-700 rounded-md p-4 text-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all resize-none min-h-[120px] font-serif"
            />

            <div className="flex justify-end pt-2">
              <EditorialButton 
                onClick={handleSubmit} 
                loading={loading}
                disabled={!instruction.trim()}
                className="w-full sm:w-auto px-8"
              >
                {loading ? "Processing..." : "Apply Changes"}
              </EditorialButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
