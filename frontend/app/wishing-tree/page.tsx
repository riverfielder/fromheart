"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getWishes, createWish, blessWish, Wish } from "../../lib/api";

// --- Components ---

function TreeBackground() {
  return (
    <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none opacity-80">
      {/* Abstract Tree CSS Art */}
      <div className="relative w-full max-w-lg h-[80vh]">
        {/* Trunk */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-64 bg-stone-700 rounded-t-lg" />
        {/* Branch Left */}
        <div className="absolute bottom-40 left-1/2 -translate-x-full w-32 h-4 bg-stone-700 rotate-[30deg] origin-right rounded-full" />
         {/* Branch Right */}
         <div className="absolute bottom-52 left-1/2 w-32 h-4 bg-stone-700 -rotate-[30deg] origin-left rounded-full" />
        
        {/* Canopy Layers */}
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-800/80 rounded-full blur-xl" />
        <div className="absolute bottom-64 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-700/80 rounded-full blur-xl" />
        <div className="absolute bottom-80 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-600/80 rounded-full blur-xl" />
      </div>
    </div>
  );
}

function WishCard({ wish, style, onBless }: { wish: Wish; style: React.CSSProperties; onBless: (id: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [blessed, setBlessed] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={style}
      className="absolute z-10"
    >
      <div className="relative flex flex-col items-center">
        {/* String */}
        <div className="w-0.5 h-8 bg-amber-200/50 absolute -top-8 left-1/2 -translate-x-1/2" />
        
        {/* Card */}
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-16 bg-red-700 rounded shadow-lg border border-amber-400/30 flex flex-col items-center justify-center cursor-pointer text-[10px] text-amber-200 font-serif writing-vertical-rl overflow-hidden p-1"
        >
           <span className="truncate">{wish.type === 'love' ? '姻缘' : wish.type === 'health' ? '安康' : wish.type === 'wealth' ? '财运' : '心愿'}</span>
        </motion.button>
      </div>

      {/* Expanded View Modal */}
      <AnimatePresence>
        {isOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0" onClick={() => setIsOpen(false)} /> {/* Backdrop */}
             <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-red-50 relative z-50 w-full max-w-xs rounded-lg shadow-xl p-6 border-2 border-red-800"
             >
                <div className="text-center space-y-4">
                   <div className="text-2xl text-red-800 font-serif">
                      {wish.type === 'love' ? '❤️' : wish.type === 'health' ? '🍵' : wish.type === 'wealth' ? '💰' : '✨'}
                   </div>
                   <p className="text-stone-800 font-serif text-lg leading-relaxed">
                     {wish.content}
                   </p>
                   <div className="pt-4 flex justify-between items-center text-sm text-stone-500">
                     <span>{new Date(wish.created_at).toLocaleDateString()}</span>
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if(!blessed) {
                                // Optimistically update correct count locally inside card, 
                                // avoiding 'double count' visual if parent re-renders.
                                // Actually, standard pattern: parent updates state, prop changes.
                                // But to avoid jumping: we rely on parent update or ensure logic matches.
                                onBless(wish.id);
                                setBlessed(true);
                            }
                        }}
                        disabled={blessed}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${blessed ? 'bg-red-100 text-red-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
                     >
                       <span>🙏</span> {wish.blessing_count} 祈福
                     </button>
                   </div>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewWishModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (content: string, type: string) => void }) {
    const [content, setContent] = useState("");
    const [type, setType] = useState("family");
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
            >
                <h3 className="text-xl font-serif text-center text-stone-800">许下心愿</h3>
                <textarea
                    className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                    placeholder="写下你的愿望，诚心则灵..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={140}
                />
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['family', 'health', 'love', 'wealth', 'study'].map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm border ${type === t ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-600 border-stone-200'}`}
                        >
                            {t === 'family' ? '家宅' : t === 'health' ? '健康' : t === 'love' ? '姻缘' : t === 'wealth' ? '财运' : '学业'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 text-stone-500 font-medium">取消</button>
                    <button
                        onClick={() => onSubmit(content, type)}
                        disabled={!content.trim()}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-lg font-medium disabled:opacity-50"
                    >
                        挂上许愿牌
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// --- Main Page ---

export default function WishingTreePage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deviceHash, setDeviceHash] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load Device Hash
    const key = "fh_device";
    let currentHash = window.localStorage.getItem(key);
    if (!currentHash) {
        currentHash = `fh_${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(key, currentHash);
    }
    setDeviceHash(currentHash);

    // 2. Fetch Wishes
    loadWishes();
  }, []);

  const loadWishes = () => {
      getWishes()
        .then(setWishes)
        .catch(console.error);
  };

  const handleSubmit = async (content: string, type: string) => {
      try {
          await createWish(content, type, deviceHash);
          setShowModal(false);
          loadWishes(); // Reload
      } catch (e) {
          setError("许愿失败，请稍后再试");
          setTimeout(() => setError(null), 3000);
      }
  };

  const handleBless = async (id: number) => {
      // Optimistic Update immediately to prevent UI lag
      setWishes(prev => prev.map(w => w.id === id ? {...w, blessing_count: w.blessing_count + 1} : w));
      
      try {
          await blessWish(id);
          // Allow background sync to eventually be consistent, but don't force reload to avoid jumping
      } catch (e) {
         console.error(e);
         // Revert on error
         setWishes(prev => prev.map(w => w.id === id ? {...w, blessing_count: w.blessing_count - 1} : w));
         setError("祈福失败");
         setTimeout(() => setError(null), 2000);
      }
  };

  return (
    <div className="min-h-screen bg-stone-100 relative overflow-hidden flex flex-col items-center">
        {/* Header */}
        <header className="absolute top-0 w-full p-4 flex justify-between items-center z-20">
            <Link href="/" className="text-stone-600 bg-white/50 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-medium">
                ← 返回
            </Link>
            <h1 className="text-xl font-serif text-stone-800 tracking-widest">祈福树</h1>
            <div className="w-16" />
        </header>

        {/* Error Toast */}
        <AnimatePresence>
            {error && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
                <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 flex flex-col items-center gap-2 ring-1 ring-stone-100 min-w-[160px]">
                <span className="text-3xl opacity-80">🎋</span>
                <span className="text-sm font-serif text-stone-600 tracking-widest font-medium">{error}</span>
                </div>
            </motion.div>
            )}
        </AnimatePresence>

        {/* Tree & Background */}
        <TreeBackground />

        {/* Wishes Layer */}
        <div className="relative w-full max-w-lg h-[80vh] mt-auto pointer-events-none">
            {wishes.map((wish, i) => {
                // Simple distribution logic
                // Center roughly at 50% width.
                // Height spread between 20% and 70% from bottom.
                // Use hash of ID to determine position for stability across re-renders
                const pseudoRandom = (Math.sin(wish.id) + 1) / 2; 
                const left = 20 + pseudoRandom * 60; // 20% to 80%
                const bottom = 30 + ((Math.cos(wish.id) + 1)/2) * 50; // 30% to 80%

                return (
                    <WishCard 
                        key={wish.id} 
                        wish={wish} 
                        style={{ left: `${left}%`, bottom: `${bottom}%`, pointerEvents: 'auto' }}
                        onBless={handleBless}
                    />
                );
            })}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 z-30">
            <button
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full shadow-xl font-serif text-lg tracking-widest flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95"
            >
                <span>🖋️</span> 我要许愿
            </button>
        </div>

        <NewWishModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit} />
    </div>
  );
}
