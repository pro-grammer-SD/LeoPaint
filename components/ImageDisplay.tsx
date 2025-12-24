import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Loader2, PencilLine } from 'lucide-react';
import { AspectRatio } from '../types';
import { ShareModal } from './ui/ShareModal';

interface ImageDisplayProps {
  imageUrl: string | null;
  remoteUrl: string | null;
  loading: boolean;
  prompt?: string;
  aspectRatio: AspectRatio;
  onEdit?: () => void;
  isVersioned?: boolean;
}

const QUOTES = [
  "Art is the lie that enables us to realize the truth.",
  "Creativity takes courage.",
  "Every artist was first an amateur.",
  "To create one's own world takes courage.",
  "Vision is the art of seeing what is invisible to others.",
  "Simplicity is the ultimate sophistication."
];

// Complex blob paths centered at (0,0) for smooth morphing
const BLOB_PATHS = [
  "M45.7,-78.3C58.9,-71.1,69.1,-60.6,76.6,-48.8C84.1,-37,88.9,-23.8,87.6,-11.2C86.3,1.3,78.9,13.3,71.1,24.6C63.3,35.9,55.2,46.6,45.4,55.9C35.6,65.2,24.1,73.1,11.3,76.3C-1.5,79.5,-15.6,78,-28.9,73.2C-42.2,68.4,-54.7,60.3,-64.7,49.9C-74.7,39.5,-82.2,26.8,-83.8,13.2C-85.4,-0.4,-81.1,-14.9,-73.4,-27.3C-65.7,-39.7,-54.6,-50,-42.6,-57.8C-30.6,-65.6,-17.7,-70.9,-3.9,-75.6C9.9,-80.3,23.7,-84.4,45.7,-78.3Z",
  "M38.1,-65.6C49.5,-58.3,59.1,-49.4,66.9,-39.1C74.7,-28.8,80.7,-17.1,80.9,-5.3C81.1,6.5,75.5,18.4,67.6,28.9C59.7,39.4,49.5,48.5,38.3,55.9C27.1,63.3,14.9,69,2.2,65.2C-10.5,61.4,-23.7,48.1,-35.6,38.2C-47.5,28.3,-58.1,21.8,-63.9,11.9C-69.7,2,-70.7,-11.3,-64.8,-22.3C-58.9,-33.3,-46.1,-42,-34.5,-49.2C-22.9,-56.4,-12.5,-62.1,0.2,-62.5C12.9,-62.8,26.7,-68,38.1,-65.6Z",
  "M46.7,-63.9C59.6,-55.8,68.9,-43.3,72.4,-30.1C75.9,-16.9,73.6,-3,70.2,10.2C66.8,23.4,62.3,35.9,53.2,46.1C44.1,56.3,30.4,64.2,16.6,67.2C2.8,70.2,-11.1,68.3,-23.7,62.5C-36.3,56.7,-47.6,47,-56.7,35.5C-65.8,24,-72.7,10.7,-73.5,-3.3C-74.3,-17.3,-69,-32,-59.6,-43.3C-50.2,-54.6,-36.7,-62.5,-23.2,-68.8C-9.7,-75.1,3.8,-79.8,46.7,-63.9Z",
  "M50.2,-68.6C64.6,-60.7,75.5,-46.9,80.8,-31.8C86.1,-16.7,85.8,-0.3,81.7,14.9C77.6,30.1,69.7,44.1,58.4,54.6C47.1,65.1,32.4,72.1,17.2,74.7C2,77.3,-13.7,75.5,-27.9,69.5C-42.1,63.5,-54.8,53.3,-63.9,41C-73,28.7,-78.5,14.3,-78.4,0.1C-78.3,-14.1,-72.6,-28.1,-63.1,-39.7C-53.6,-51.3,-40.3,-60.5,-26.6,-68.9C-12.9,-77.3,1.2,-84.9,50.2,-68.6Z"
];

const getAspectRatioClass = (ratio: AspectRatio): string => {
  switch (ratio) {
    case '1:1': return 'aspect-square';
    case '3:4': return 'aspect-[3/4]';
    case '4:3': return 'aspect-[4/3]';
    case '9:16': return 'aspect-[9/16]';
    case '16:9': return 'aspect-[16/9]';
    default: return 'aspect-square';
  }
};

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, remoteUrl, loading, prompt, aspectRatio, onEdit, isVersioned }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const slug = prompt 
        ? prompt.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-') 
        : 'leopaint';
      link.download = `${slug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  return (
    <>
      <motion.div 
        layout
        className={`relative w-full ${getAspectRatioClass(aspectRatio)} bg-noir-800/20 overflow-hidden border border-noir-700/50 flex items-center justify-center group rounded-sm dark:bg-noir-800/20 bg-stone-200/50 dark:border-noir-700/50 border-stone-300 transition-all duration-500 ease-in-out`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8 text-center"
            >
              {/* Dynamic Shapeshifting Flux Orb */}
              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                  <defs>
                    <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="text-stone-300 dark:text-stone-600" stopColor="currentColor" stopOpacity="0.8" />
                      <stop offset="100%" className="text-stone-500 dark:text-stone-800" stopColor="currentColor" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  
                  <g transform="translate(100 100)">
                    <motion.path 
                      fill="url(#blob-gradient)"
                      d={BLOB_PATHS[0]}
                      animate={{
                        d: [BLOB_PATHS[0], BLOB_PATHS[2], BLOB_PATHS[1], BLOB_PATHS[3], BLOB_PATHS[0]],
                        rotate: [0, 90, 180, 270, 360],
                        scale: [0.9, 1.1, 0.95, 1.05, 0.9]
                      }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }}
                      className="blur-sm"
                    />
                    <motion.path 
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-stone-600 dark:text-stone-400 opacity-60"
                      d={BLOB_PATHS[1]}
                      animate={{
                        d: [BLOB_PATHS[3], BLOB_PATHS[0], BLOB_PATHS[2], BLOB_PATHS[1], BLOB_PATHS[3]],
                        rotate: [360, 270, 180, 90, 0],
                        scale: [1.1, 0.9, 1.15, 0.9, 1.1]
                      }}
                      transition={{ repeat: Infinity, duration: 12, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }}
                    />
                  </g>
                </svg>
              </div>
              
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8 }}
                className="absolute top-1/2 mt-20"
              >
                <p className="font-serif italic text-stone-600 dark:text-stone-400 text-lg md:text-xl tracking-wide max-w-xs leading-relaxed">
                  "{QUOTES[quoteIndex]}"
                </p>
              </motion.div>
            </motion.div>
          ) : imageUrl ? (
            <motion.div 
              key="image"
              initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-full"
            >
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-10 bg-noise mix-blend-overlay"></div>
              <img src={imageUrl} alt="Generated Art" className="w-full h-full object-cover" />

              {/* Version Badge */}
              {isVersioned && (
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 z-20 font-sans tracking-wider uppercase">
                  Edited Version
                </div>
              )}

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-900/90 to-transparent z-20 flex justify-end gap-3"
              >
                 <button 
                    onClick={onEdit}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 backdrop-blur-md transition-all flex items-center justify-center relative overflow-hidden" 
                    title="Edit Image"
                 >
                    <PencilLine size={20} strokeWidth={1.5} />
                 </button>

                 <button 
                    onClick={() => setShowShare(true)} 
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 backdrop-blur-md transition-all flex items-center justify-center relative overflow-hidden group" 
                    title={remoteUrl ? "Share Creation" : "Uploading..."}
                 >
                   <AnimatePresence mode="wait">
                     {(!remoteUrl && !loading) ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Loader2 size={20} className="animate-spin" strokeWidth={1.5} />
                        </motion.div>
                     ) : (
                        <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Share2 size={20} strokeWidth={1.5} />
                        </motion.div>
                     )}
                   </AnimatePresence>
                 </button>
                 
                 <button onClick={downloadImage} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 backdrop-blur-md transition-all" title="Download Image">
                   <Download size={20} strokeWidth={1.5} />
                 </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 opacity-30 dark:opacity-30 opacity-40"
            >
              <div className="w-px h-16 bg-stone-500 mx-auto mb-4"></div>
              <p className="font-serif italic text-xl tracking-wide">Awaiting Vision</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        imageUrl={imageUrl}
        remoteUrl={remoteUrl}
        prompt={prompt || ""}
      />
    </>
  );
};
