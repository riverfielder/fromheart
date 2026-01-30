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

// Extracted Card Component for consistency between Display and Export
const ShareCardContent = ({ result, poem }: { result: Output, poem: string | null }) => (
  <>
    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-900/5 rounded-bl-full pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-14 h-14 bg-emerald-900/5 rounded-tr-full pointer-events-none" />
    <div className="absolute inset-0 bg-[url('/bagua.svg')] bg-no-repeat bg-center opacity-[0.03] bg-[length:90%] pointer-events-none" />

    {/* Header */}
    <div className="flex flex-col items-center gap-2 relative z-10 w-full pb-4 border-b border-stone-200">
        <Image src="/logo.svg" alt="logo" width={36} height={36} className="opacity-80 grayscale" />
        <div className="text-center">
          <h2 className="text-base font-bold text-gray-800 tracking-[0.2em] uppercase">一问</h2>
          <p className="text-[9px] text-gray-400 font-serif tracking-widest uppercase mt-0.5">From Heart</p>
        </div>
    </div>

    {/* Content */}
    <div className="flex flex-col items-center gap-4 relative z-10 py-1 w-full text-center flex-1 justify-center">
        {/* Direct Answer */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <span className="text-[9px] text-emerald-800/60 font-medium tracking-wide border border-emerald-800/20 px-1.5 py-px rounded-full inline-block">指引</span>
          <h3 className="text-xl font-serif text-gray-900 leading-relaxed font-medium px-2 inline-block">
            {result.direct_answer}
          </h3>
        </div>

        {/* Hexagram Visuals */}
        <div className="flex items-center justify-center space-x-6 py-2">
          <div className="flex flex-col items-center gap-1">
              <Hexagram name={result.ben_gua} size="sm" />
              <span className="text-[10px] text-stone-500 font-serif tracking-widest">{result.ben_gua}</span>
          </div>
          <span className="text-stone-300 font-light text-xs">→</span>
          <div className="flex flex-col items-center gap-1">
              <Hexagram name={result.bian_gua} size="sm" />
              <span className="text-[10px] text-stone-500 font-serif tracking-widest">{result.bian_gua}</span>
          </div>
        </div>
        
        {/* Poem */}
        {poem && (
          <div className="relative py-2 px-4">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl text-stone-200 font-serif opacity-50">❝</span>
            <p className="text-sm font-serif text-gray-700 italic whitespace-pre-line leading-7 relative z-10">
              {poem}
            </p>
          </div>
        )}
    </div>

    {/* Footer */}
    <div className="w-full pt-4 border-t border-stone-200 flex justify-between items-end relative z-10 mt-auto">
        <div className="flex flex-col items-start gap-0.5 text-left">
          <p className="text-[9px] text-gray-400">扫码问心</p>
            {/* Placeholder for QR Code */}
          <div className="w-12 h-12 bg-white p-1 border border-stone-100 mt-0.5 shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://fromheart.riverfielder.com')}&color=064e3b`} 
                alt="QR" 
                className="w-full h-full object-contain opacity-90" 
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
  </>
);

export default function ShareModal({ show, onClose, result, poem }: ShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setGenerating(true);
    try {
      // Small delay to ensure render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 3, // Higher resolution
        backgroundColor: "#FAFAFA",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 375, // Explicit width matching the container
      });
      const link = document.createElement("a");
      link.download = `fromheart-divination-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
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
            {/* The Visible Card (Responsive) */}
            <div 
              className="w-[300px] bg-[#FAFAFA] rounded-none px-5 py-6 flex flex-col items-center space-y-4 shadow-2xl relative overflow-hidden min-h-[480px]"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
               <ShareCardContent result={result} poem={poem} />
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

          {/* The Hidden Export Card (Fixed Size, Off-screen) */}
          <div className="fixed left-[-9999px] top-0 pointer-events-none">
             <div 
                ref={exportRef}
                className="w-[375px] bg-[#FAFAFA] px-8 py-10 flex flex-col items-center space-y-6 relative overflow-hidden h-auto min-h-[600px]"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
             >
                <ShareCardContent result={result} poem={poem} />
             </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
