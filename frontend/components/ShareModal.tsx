import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import Image from "next/image";
import { Output } from "../types";
import Hexagram from "./Hexagram";

interface ShareModalProps {
  show: boolean;
  onClose: () => void;
  result: Output | null;
  poem: string | null;
}

export default function ShareModal({ show, onClose, result, poem }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        backgroundColor: "#F6F7F9",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `fromheart-divination-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Failed to generate image", e);
    } finally {
      setGenerating(false);
    }
  };

  if (!show || !result) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
            onClick={e => e.stopPropagation()}
          >
            {/* The Card to Capture */}
            <div 
              ref={cardRef} 
              className="w-full bg-[#FAFAFA] rounded-none p-8 flex flex-col items-center space-y-6 shadow-2xl relative overflow-hidden"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-900/5 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-900/5 rounded-tr-full pointer-events-none" />
              <div className="absolute inset-0 bg-[url('/bagua.svg')] bg-no-repeat bg-center opacity-[0.03] bg-[length:80%] pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col items-center gap-3 relative z-10 w-full pb-6 border-b border-stone-200">
                 <Image src="/logo.svg" alt="logo" width={48} height={48} className="opacity-80 grayscale" />
                 <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-800 tracking-[0.2em] uppercase">一问</h2>
                    <p className="text-[10px] text-gray-400 font-serif tracking-widest uppercase mt-1">From Heart</p>
                 </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-6 relative z-10 py-2">
                 {/* Direct Answer */}
                 <div className="space-y-2">
                    <span className="text-[10px] text-emerald-800/60 font-medium tracking-wide border border-emerald-800/20 px-2 py-0.5 rounded-full">指引</span>
                    <h3 className="text-2xl font-serif text-gray-900 leading-relaxed font-medium">
                      {result.direct_answer}
                    </h3>
                 </div>

                 {/* Hexagram Visuals */}
                 <div className="flex items-center justify-center space-x-8 py-2">
                    <div className="flex flex-col items-center gap-2">
                        <Hexagram name={result.ben_gua} size="sm" />
                        <span className="text-[10px] text-stone-500 font-serif tracking-widest">{result.ben_gua}</span>
                    </div>
                    <span className="text-stone-300 font-light text-sm">→</span>
                    <div className="flex flex-col items-center gap-2">
                        <Hexagram name={result.bian_gua} size="sm" />
                        <span className="text-[10px] text-stone-500 font-serif tracking-widest">{result.bian_gua}</span>
                    </div>
                 </div>
                 
                 {/* Poem */}
                 {poem && (
                   <div className="relative py-4">
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl text-stone-200 font-serif">❝</span>
                      <p className="text-sm font-serif text-gray-600 italic whitespace-pre-line leading-loose px-4">
                        {poem}
                      </p>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl text-stone-200 font-serif rotate-180">❝</span>
                   </div>
                 )}
              </div>

              {/* Footer */}
              <div className="w-full pt-6 border-t border-stone-200 flex justify-between items-end relative z-10">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] text-gray-400">扫码问心</p>
                     {/* Placeholder for QR Code */}
                    <div className="w-16 h-16 bg-white p-1 border border-stone-100">
                       {/* Using a simple open API to generate QR code for the current site */}
                       <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.origin : 'https://github.com/riverfielder/fromheart'}&color=064e3b`} 
                          alt="QR" 
                          className="w-full h-full object-contain opacity-80" 
                          crossOrigin="anonymous"
                       />
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-gray-400 tracking-wider">
                       {new Date().toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-xs font-serif text-emerald-800 mt-1">心诚则灵</p>
                 </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
               <button 
                 onClick={onClose}
                 className="px-6 py-2.5 rounded-full bg-white/20 text-white text-sm backdrop-blur-md border border-white/20 hover:bg-white/30 transition-colors"
               >
                 关闭
               </button>
               <button 
                 onClick={handleDownload}
                 disabled={generating}
                 className="px-6 py-2.5 rounded-full bg-emerald-500 text-white text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all font-medium flex items-center gap-2"
               >
                 {generating ? (
                    <span className="animate-spin text-white">⟳</span>
                 ) : (
                    <span>📥</span>
                 )}
                 保存图片
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
