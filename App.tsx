import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, GitBranch, Bell, BellOff, Key } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateImage, enhancePrompt, editImage, getStoredApiKey, setStoredApiKey, clearStoredApiKey } from './services/genAiService';
import { GenerationConfig, GenerationResult, HistoryItem, AspectRatio } from './types';
import { EditorialButton, AspectRatioSelector, PromptEnhancer } from './components/ui/Controls';
import { ImageDisplay } from './components/ImageDisplay';
import { EditModal } from './components/ui/EditModal';
import { Toast } from './components/ui/Toast';
import { ApiKeyModal } from './components/ui/ApiKeyModal';

const App: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: "Astronaut in a jungle, cold color palette, muted colors, detailed, anime style",
    aspectRatio: "1:1"
  });

  // Current Active Image State
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  // Transient Loading/Error State
  const [generationState, setGenerationState] = useState<{loading: boolean; error: string | null}>({
    loading: false,
    error: null
  });

  const [enhancing, setEnhancing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [ripple, setRipple] = useState<{ x: number, y: number } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Auth & Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    // 1. Check for API Key on load
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setHasKey(true);
    } else {
      setHasKey(false);
      setShowApiKeyModal(true);
    }

    // 2. Check for URL params to load shared config
    const params = new URLSearchParams(window.location.search);
    const sharedPrompt = params.get('prompt');
    const sharedAr = params.get('ar') as AspectRatio;

    if (sharedPrompt) {
      setConfig(prev => ({
        ...prev,
        prompt: sharedPrompt,
        aspectRatio: sharedAr || "1:1"
      }));
    }

    // 3. Load history
    const saved = localStorage.getItem('leopaint_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
           setActiveItem(parsed[0]);
           setConfig({ prompt: parsed[0].prompt, aspectRatio: parsed[0].aspectRatio });
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    // 4. Theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
       setIsDark(false);
       document.documentElement.classList.remove('dark');
       document.body.classList.add('light-mode-bg');
    }

    // 5. Notification Permissions Check
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setStoredApiKey(key);
    setHasKey(true);
    setShowApiKeyModal(false);
    setShowToast(true); // Feedback
  };

  const handleApiKeyClick = () => {
    // Directly open the modal to allow user to view/update key
    setShowApiKeyModal(true);
  };

  const toggleTheme = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setRipple({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    
    setTimeout(() => {
      const newDark = !isDark;
      setIsDark(newDark);
      if (newDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light-mode-bg');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light-mode-bg');
      }
      setRipple(null);
    }, 400); 
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Logic for enabling
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification("LeoPaint", { 
            body: "System notifications active.",
          });
        }
      } else {
        // Permission denied
        alert("Notifications are blocked by your browser. Please enable them in site settings.");
      }
    } else {
      // Logic for disabling (just local state)
      setNotificationsEnabled(false);
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: isDark ? ['#d6d3d1', '#78716c', '#ffffff'] : ['#1c1917', '#57534e', '#000000'],
      disableForReducedMotion: true
    });
    
    setShowToast(true);

    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification("Vision Synthesized", {
        body: "Your artwork has been successfully generated.",
      });
    }
  };

  const addToHistory = (imageUrl: string, remoteUrl: string | null, sourceConfig: GenerationConfig, parentId?: string | null) => {
    let version = 1;
    if (parentId) {
      const parent = history.find(h => h.id === parentId);
      if (parent) version = parent.version + 1;
    }

    const newItem: HistoryItem = {
      ...sourceConfig,
      imageUrl,
      remoteUrl: null, // Cloud upload removed as requested
      id: Date.now().toString(),
      timestamp: Date.now(),
      version,
      parentId
    };

    const newHistory = [newItem, ...history].slice(0, 15);
    setHistory(newHistory);
    setActiveItem(newItem);
    localStorage.setItem('leopaint_history', JSON.stringify(newHistory));
    return newItem;
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setActiveItem(item);
    setConfig({
      prompt: item.prompt,
      aspectRatio: item.aspectRatio || "1:1"
    });
    setGenerationState({ loading: false, error: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnhancePrompt = async () => {
    if (!config.prompt.trim()) return;
    setEnhancing(true);
    try {
      const enhanced = await enhancePrompt(config.prompt);
      setConfig({ ...config, prompt: enhanced });
    } catch (e) {
      console.error(e);
      // If error is auth related, prompt might need key
      if (!getStoredApiKey()) setShowApiKeyModal(true);
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;

    // Pre-check for API Key
    if (!getStoredApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    setGenerationState({ loading: true, error: null });
    
    try {
      const localUrl = await generateImage(config);
      
      addToHistory(localUrl, null, config, null);
      
      setGenerationState({ loading: false, error: null });
      triggerCelebration();

    } catch (err: any) {
      setGenerationState({ loading: false, error: err.message || "Something went wrong" });
      if (err.message.includes("API Key")) {
        setShowApiKeyModal(true);
      }
    }
  };

  const handleEditSubmit = async (instruction: string) => {
    if (!activeItem || !activeItem.imageUrl) return;
    
    if (!getStoredApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    setIsEditModalOpen(false);
    setGenerationState({ loading: true, error: null });

    try {
      const localUrl = await editImage(activeItem.imageUrl, instruction, activeItem.aspectRatio);
      
      const newConfig = { ...config, prompt: instruction };
      addToHistory(localUrl, null, newConfig, activeItem.id);

      setGenerationState({ loading: false, error: null });
      triggerCelebration();

    } catch (err: any) {
      setGenerationState({ loading: false, error: err.message || "Failed to edit image" });
      if (err.message.includes("API Key")) {
        setShowApiKeyModal(true);
      }
    }
  };

  return (
    <div className="min-h-screen w-full font-serif selection:bg-stone-500/30 selection:text-inherit overflow-x-hidden transition-colors duration-500">
      
      <AnimatePresence>
        {ripple && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 150 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ 
              left: ripple.x, 
              top: ripple.y,
              position: 'fixed',
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: isDark ? '#f5f5f4' : '#050505',
              zIndex: 50,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0 bg-noise opacity-30 mix-blend-overlay"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-6 flex justify-between items-center bg-gradient-to-b from-noir-950/80 to-transparent dark:from-noir-950/80 from-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center text-stone-100 dark:text-stone-900 font-serif italic font-bold text-xl">
             L
           </div>
           <span className="text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">LeoPaint</span>
        </div>
        
        <div className="flex items-center gap-4">
           {/* API Key Button */}
           <button 
            onClick={handleApiKeyClick}
            className={`transition-colors ${hasKey ? 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400' : 'text-amber-500 hover:text-amber-600 animate-pulse'}`}
            title="Manage API Key"
          >
            <Key size={20} />
          </button>

          <button 
            onClick={toggleNotifications}
            className={`transition-all duration-300 ${notificationsEnabled ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
            title={notificationsEnabled ? "System Notifications On" : "Enable System Notifications"}
          >
            {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>

          <button 
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors z-50 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <Moon size={18} className="text-stone-100" />
                </motion.div>
              ) : (
                <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Sun size={18} className="text-stone-900" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-12 order-2 lg:order-1">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-light leading-[1] tracking-tight text-stone-900 dark:text-stone-100">
              Where words <br/>
              <span className="italic font-normal font-serif text-stone-500 dark:text-stone-400">become worlds.</span>
            </h1>
            <p className="text-stone-600 dark:text-stone-500 font-serif text-lg leading-relaxed max-w-md">
              A premium neural interface for visual synthesis.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-10"
          >
            {/* Prompt */}
            <div className="space-y-4">
              <label className="text-sm tracking-widest uppercase text-stone-500 dark:text-noir-500 font-sans font-medium">Prompt Directive</label>
              <div className="relative group">
                <textarea 
                  value={config.prompt}
                  onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                  placeholder="Describe your vision..."
                  className="w-full bg-transparent border-b border-stone-300 dark:border-noir-700 py-4 text-xl md:text-2xl leading-normal text-stone-800 dark:text-stone-300 placeholder-stone-400 dark:placeholder-stone-800 focus:outline-none focus:border-stone-500 dark:focus:border-stone-400 transition-all duration-300 min-h-[140px] resize-none font-serif pr-10"
                  disabled={generationState.loading}
                />
                <PromptEnhancer 
                  onClick={handleEnhancePrompt} 
                  loading={enhancing} 
                  disabled={generationState.loading || !config.prompt.trim()}
                />
              </div>
            </div>

            <AspectRatioSelector 
              value={config.aspectRatio}
              onChange={(r) => setConfig({ ...config, aspectRatio: r })}
              disabled={generationState.loading}
            />

            <div className="pt-4">
              <EditorialButton 
                onClick={handleGenerate} 
                loading={generationState.loading}
                disabled={!config.prompt.trim()}
                className="shadow-xl shadow-stone-900/5 dark:shadow-none"
              >
                {generationState.loading ? "Synthesizing..." : "Generate Artwork"}
              </EditorialButton>
              
              {generationState.error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-red-700 dark:text-red-900/70 text-sm font-sans tracking-wide border-l-2 border-red-500 dark:border-red-900/50 pl-3 py-1"
                >
                  Error: {generationState.error}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Output & History */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-12">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.4 }}
             className="relative sticky top-32"
           >
             <ImageDisplay 
               imageUrl={activeItem?.imageUrl || null} 
               remoteUrl={activeItem?.remoteUrl || null} // Now always null
               loading={generationState.loading}
               prompt={activeItem?.prompt || config.prompt}
               aspectRatio={activeItem?.aspectRatio || config.aspectRatio}
               onEdit={() => setIsEditModalOpen(true)}
               isVersioned={!!(activeItem && activeItem.version > 1)}
             />
             
             <div className="mt-4 flex justify-between items-center text-xs text-stone-500 dark:text-noir-500 font-sans tracking-[0.2em] uppercase">
                <div className="flex gap-4">
                  <span>Google Nano Banana</span>
                  {activeItem && activeItem.version > 1 && (
                     <span className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
                        <GitBranch size={10} /> v{activeItem.version}
                     </span>
                  )}
                </div>
                <span>{activeItem ? 'Status: Active' : 'Status: Idle'}</span>
             </div>
           </motion.div>

           {/* History Gallery */}
           {history.length > 0 && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="pt-12 border-t border-stone-200 dark:border-noir-700"
             >
               <h3 className="text-sm tracking-widest uppercase text-stone-500 dark:text-noir-500 mb-6 font-sans">Visual Archives</h3>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                 {history.map((item) => {
                   const isActive = activeItem?.id === item.id;
                   return (
                     <motion.button
                       key={item.id}
                       onClick={() => selectHistoryItem(item)}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className={`
                         overflow-hidden relative group transition-all duration-300
                         ${item.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}
                         ${isActive ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-2 ring-offset-black' : 'border border-transparent'}
                       `}
                     >
                       <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                       
                       {/* Overlay */}
                       <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'bg-transparent' : 'bg-black/20 hover:bg-transparent'}`} />
                       
                       {/* Version Badge for history items */}
                       {item.version > 1 && (
                         <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-full z-10 font-sans">
                           v{item.version}
                         </div>
                       )}
                     </motion.button>
                   );
                 })}
               </div>
             </motion.div>
           )}
        </div>
        
        <EditModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          loading={generationState.loading}
        />

        <ApiKeyModal
          isOpen={showApiKeyModal}
          onSave={handleSaveApiKey}
          onClose={hasKey ? () => setShowApiKeyModal(false) : undefined}
        />

        <Toast 
          message={showApiKeyModal ? null : "System Ready"}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

      </main>
    </div>
  );
};

export default App;