import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";

export default function WoodenFish() {
  const [merit, setMerit] = useState(0);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [statusText, setStatusText] = useState(LOADING_TEXTS[0]);

  useEffect(() => {
      let i = 0;
      const timer = setInterval(() => {
          i = (i + 1) % LOADING_TEXTS.length;
          setStatusText(LOADING_TEXTS[i]);
      }, 3000);
      return () => clearInterval(timer);
  }, []);

  // Sound effect (optional, maybe distinct 'tock' sound if we had files, skipping for now to keep it simple/silent or user browser api)
  // We will just do visual feedback.

  const handleKnock = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to stop double firing on touch devices if needed
    // e.preventDefault(); 
    
    setMerit((m) => m + 1);
    
    // Get coordinates relative to the click or center
    // Using random slight offset for "floating" feel if specific coords not imperative, 
    // but centering on click is nice.
    // For simplicity in this constrained component, let's float from center-top of the fish.
    
    const id = Date.now();
    setClicks((prev) => [...prev, { id, x: 0, y: 0 }]); // x,y handled in animation relative to container

    // Cleanup click after animation
    setTimeout(() => {
        setClicks(prev => prev.filter(c => c.id !== id));
    }, 1000);
    
    // Vibrate device if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6 select-none">
      <div className="relative cursor-pointer" onClick={handleKnock}>
        {/* Floating Merits */}
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: -20, scale: 0.5 }}
              animate={{ opacity: 0, y: -80, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-600 font-bold whitespace-nowrap z-20 pointer-events-none"
            >
              功德 +1
            </motion.div>
          ))}
        </AnimatePresence>

        {/* The Wooden Fish (Simple SVG Shape) */}
        <motion.div
          whileTap={{ scale: 0.9, rotate: -5 }}
          className="relative z-10 drop-shadow-xl"
        >
             <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Body */}
                <path d="M15 50C15 25 35 10 60 10C90 10 110 30 110 50C110 75 90 90 60 90C40 90 15 75 15 50Z" fill="#D97706" /> {/* Amber-600 */}
                <path d="M15 50C15 25 35 10 60 10C90 10 110 30 110 50C110 75 90 90 60 90C40 90 15 75 15 50Z" fill="url(#wood-gradient)" fillOpacity="0.8" />
                
                {/* Details */}
                <circle cx="90" cy="40" r="8" fill="#78350F" /> {/* Eye */}
                <path d="M25 50 Q 40 50 45 65" stroke="#92400E" strokeWidth="3" strokeLinecap="round" /> {/* Mouth/Carving */}
                
                {/* Highlight */}
                <path d="M40 20 Q 60 15 80 20" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
                
                <defs>
                   <radialGradient id="wood-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 40) rotate(90) scale(60 80)">
                      <stop stopColor="#F59E0B" />
                      <stop offset="1" stopColor="#B45309" />
                   </radialGradient>
                </defs>
             </svg>
             
             {/* Mallet Hit Marker (Optional) */}
        </motion.div>
      </div>

      <p className="text-xs text-stone-500 font-serif tracking-widest animate-pulse min-h-[1.5em] text-center">
        {statusText}
      </p>
      
      <div className="text-[10px] text-stone-400 font-mono">
         本次功德: {merit}
      </div>
    </div>
  );
}

const LOADING_TEXTS = [
    "推演中... 点击木鱼积攒功德",
    "正在排队请教大师...",
    "天机浩渺，请耐心等待...",
    "心诚则灵，稍安勿躁...",
    "正在解析卦象...",
];
