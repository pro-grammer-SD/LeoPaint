import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Share2, Users, QrCode, Download, Share } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUrl: string | null; // Unused but kept for interface compatibility
  imageUrl: string | null; // Local Data URI
  prompt: string;
}

// Simple L Logo for QR center
const LEO_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231c1917'/%3E%3Ctext x='50' y='50' font-family='serif' font-style='italic' font-weight='bold' font-size='60' fill='white' text-anchor='middle' dy='.35em'%3EL%3C/text%3E%3C/svg%3E";

const APP_QUOTE = "\"Imagination is the only weapon in the war against reality.\"";

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageUrl, prompt }) => {
  const [activeTab, setActiveTab] = useState<'social' | 'qr'>('social');
  const [sharing, setSharing] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;
    setSharing(true);

    try {
      const blob = dataURItoBlob(imageUrl);
      const file = new File([blob], `leopaint-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'LeoPaint Creation',
          text: `${APP_QUOTE}\n\nGenerated with LeoPaint: ${prompt}`,
          files: [file]
        });
      } else {
        // Fallback for desktop or unsupported browsers: Copy to clipboard
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert("Image copied to clipboard! You can now paste it into your messaging app.");
        } catch (err) {
           alert("Your device doesn't support direct image sharing. Please download the image manually.");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setSharing(false);
    }
  };

  const downloadQrCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'leopaint-smart-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("QR Download Error:", e);
        alert("Failed to download QR code.");
      }
    } else {
      alert("QR Code not ready or could not be generated.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-noir-950/80 backdrop-blur-md p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-stone-100 dark:bg-stone-900 rounded-lg shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
            <h3 className="font-serif text-2xl text-stone-900 dark:text-stone-100 italic">Share Creation</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-stone-200 dark:bg-stone-950/50 mx-6 mt-6 rounded-md">
            <button
              onClick={() => setActiveTab('social')}
              className={`py-2 text-sm font-medium rounded-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'social' 
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <Users size={14} /> Social Online
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-2 text-sm font-medium rounded-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qr' 
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <QrCode size={14} /> Smart Code
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {activeTab === 'social' ? (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 text-center"
              >
                 <div className="p-6 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg">
                    <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 mb-4">
                      {APP_QUOTE}
                    </p>
                    <div className="w-16 h-px bg-stone-300 dark:bg-stone-700 mx-auto mb-4"></div>
                    <p className="text-xs font-sans uppercase tracking-widest text-stone-400">LeoPaint Generated</p>
                 </div>

                 <button
                   onClick={handleNativeShare}
                   disabled={sharing}
                   className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-md font-medium text-lg font-serif italic hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg"
                 >
                   {sharing ? "Preparing..." : (
                     <>
                       <Share size={20} /> Share to Apps
                     </>
                   )}
                 </button>
                 <p className="text-[10px] text-stone-400 font-sans">
                   Attaches the full-resolution image directly to your compatible apps.
                 </p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center space-y-6"
              >
                <div 
                  ref={qrRef}
                  className="p-4 bg-white rounded-lg shadow-xl border border-stone-200 relative group"
                >
                  <QRCodeCanvas
                    value={imageUrl || prompt} // Encodes the image data (if robust) or prompt fallback
                    size={220}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="L" // Lower error correction allows for more data density
                    includeMargin={true}
                    imageSettings={{
                      src: LEO_LOGO,
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg">
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="font-serif text-lg italic text-stone-800 dark:text-stone-200">Visual DNA</p>
                  <p className="text-xs text-stone-500 font-sans max-w-[200px] mx-auto">
                    Contains the full data blueprint.
                  </p>
                </div>

                <button
                   onClick={downloadQrCode}
                   className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-md font-medium text-sm uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                 >
                   <Download size={16} /> Download Code
                 </button>
              </motion.div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-stone-950/30 border-t border-stone-200 dark:border-stone-800 text-center">
             <p className="text-xs text-stone-400 font-sans">
              LeoPaint Neural Sharing
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};