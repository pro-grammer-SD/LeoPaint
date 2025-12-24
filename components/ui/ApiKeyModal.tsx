import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ArrowRight, ShieldCheck, ExternalLink, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.length < 20) {
      setError("This API key looks too short. Please check again.");
      return;
    }
    setError('');
    onSave(keyInput.trim());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-noir-950/95 backdrop-blur-md p-6"
        onClick={() => onClose && onClose()} // Allow backdrop click to close if closable
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-stone-100 dark:bg-stone-900 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
        >
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors z-10"
            >
              <X size={20} />
            </button>
          )}

          <div className="p-8">
            <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6 mx-auto text-stone-900 dark:text-stone-100">
              <Key size={24} />
            </div>

            <h2 className="text-2xl font-serif text-center text-stone-900 dark:text-stone-100 mb-2 italic">
              Authentication Required
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 text-sm mb-8 font-sans">
              To activate the LeoPaint neural interface, please provide your personal Google GenAI API Key.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md py-3 px-4 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-mono text-sm"
                    autoFocus
                  />
                  <div className="absolute right-3 top-3 text-green-500 opacity-0 transition-opacity" style={{ opacity: keyInput.length > 20 ? 1 : 0 }}>
                    <ShieldCheck size={18} />
                  </div>
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={!keyInput}
                className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-md font-medium text-sm uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Initialize System</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 flex justify-center">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors"
              >
                <span>Get API Key from Google AI Studio</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          
          <div className="bg-stone-200 dark:bg-stone-800 py-3 px-6 text-center">
             <p className="text-[10px] text-stone-500 uppercase tracking-widest">
               Stored securely in your browser cookies
             </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};