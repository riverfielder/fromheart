"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { askQuestion, getDailyPoem, getUsage, getBlessing } from "../lib/api";
import { Output } from "../types";
import ResultDisplay from "../components/ResultDisplay";
import LoadingAnimation from "../components/LoadingAnimation";
import DonationModal from "../components/DonationModal";
import ShareModal from "../components/ShareModal";
import WoodenFish from "../components/WoodenFish";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [deviceHash, setDeviceHash] = useState("anonymous");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Output | null>(null);
  const [divinationId, setDivinationId] = useState<number | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [showDonation, setShowDonation] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [blessing, setBlessing] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [wiggleIncense, setWiggleIncense] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devSecret, setDevSecret] = useState("");
  const [devModeActive, setDevModeActive] = useState(false);
  const [devToast, setDevToast] = useState<string | null>(null);

  // Persistence State
  const [isLoaded, setIsLoaded] = useState(false);

  // Ritual State
  const [pressProgress, setPressProgress] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getDailyPoem().then((res) => setPoem(res.poem)).catch(() => {});

    // Check dev mode
    if (window.localStorage.getItem("fh_secret") === "loveriver") {
      setDevModeActive(true);
    }

    const key = "fh_device";
    const stored = window.localStorage.getItem(key);
    let currentHash = stored;

    if (!currentHash) {
      currentHash = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fh_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, currentHash);
    }
    setDeviceHash(currentHash);

    getUsage(currentHash)
      .then(res => setUsageCount(res.count))
      .catch(() => {});
  }, []);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("fh_home_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.question) setQuestion(parsed.question);
        if (parsed.result) setResult(parsed.result);
        if (parsed.divinationId) setDivinationId(parsed.divinationId);
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const state = {
      question,
      result,
      divinationId
    };
    sessionStorage.setItem("fh_home_state", JSON.stringify(state));
  }, [question, result, divinationId, isLoaded]);

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("请输入问题");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const secret = window.localStorage.getItem("fh_secret") || undefined;
      const res = await askQuestion(question.trim(), deviceHash, secret);
      setResult(res.result);
      setDivinationId(res.divination_id);
      setUsageCount(res.usage_count);
      
      // Trigger animations
      setShowToast(true);
      setWiggleIncense(true);
      setTimeout(() => setShowToast(false), 1800);
      setTimeout(() => setWiggleIncense(false), 1000);

    } catch (err: any) {
      if (err.message === "daily_limit_reached") {
        setError("不可贪多");
      } else {
        setError("请求失败");
      }
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePressStart = () => {
    if (loading || !question.trim()) {
       if (!question.trim()) setError("请输入问题");
       return;
    }
    setError(null);
    setPressProgress(0);
    
    // Start filling
    const id = setInterval(() => {
      setPressProgress((prev) => {
        if (prev >= 100) {
           clearInterval(id);
           return 100;
        }
        return prev + 4; // Approx 2.5s to fill
      });
    }, 50);
    setIntervalId(id);
  };

  const handlePressEnd = () => {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);

    // If fully pressed, submit
    if (pressProgress >= 100) {
       handleAsk();
    } 
    // Reset
    setPressProgress(0);
  };
  
  const handleOpenDonation = async () => {
    setShowDonation(true);
    if (!blessing) {
       try {
         const res = await getBlessing();
         setBlessing(res.blessing);
       } catch {}
    }
  };

  const handleDevSubmit = () => {
    if (devSecret === "loveriver") {
      window.localStorage.setItem("fh_secret", "loveriver");
      setDevModeActive(true);
      setShowDevModal(false);
      setDevToast("天机已开");
      setTimeout(() => setDevToast(null), 3000);
    } else {
      setDevToast("机缘未到");
      setShowDevModal(false);
      setTimeout(() => setDevToast(null), 3000);
    }
  };

  return (
    <main className="min-h-screen relative p-4 sm:p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#F6F7F9] via-[#E9F3F0] to-[#F6F7F9] animate-gradient" />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] opacity-30 pointer-events-none bg-[url('/bagua.svg')] bg-no-repeat bg-[center_top_5rem] bg-[length:600px_600px] blur-3xl" />

      <div className="max-w-lg mx-auto space-y-8 relative">
      
      
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
             {/* Toast Content Removed */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 flex items-center gap-3 ring-1 ring-stone-100">
               <span className="text-xl opacity-80">🍃</span>
               <span className="text-sm font-serif text-stone-600 tracking-widest font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Action Bar - Aligned */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-start z-10 pointer-events-none">
          {/* Profile Icon */}
          <Link href="/profile" className="pointer-events-auto group no-underline block w-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center relative"
            >
                <div className="h-8 flex items-center justify-center">
                   <span className="text-2xl filter drop-shadow-md opacity-90 leading-none">👤</span>
                </div>
                <span className="text-[10px] text-stone-500 font-serif mt-1">命理</span>
            </motion.div>
          </Link>

          {/* Incense Icon */}
          <motion.div 
            className="pointer-events-auto group w-10 cursor-pointer"
            onClick={handleOpenDonation}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1, 
              scale: wiggleIncense ? [1, 1.4, 0.9, 1.1, 1] : 1,
              rotate: wiggleIncense ? [0, -15, 15, -10, 10, 0] : 0,
              filter: `grayscale(${Math.max(0, 1 - usageCount * 0.33) * 100}%) opacity(${0.5 + Math.min(usageCount, 3) * 0.16})`,
            }}
            transition={{ 
                opacity: { duration: 0.5 },
                filter: { duration: 0.5 },
                scale: { duration: 0.6, type: "spring" },
                rotate: { duration: 0.5 }
            }}
            whileHover={{ scale: 1.1 }}
          >
            <div className="flex flex-col items-center relative">
                <div className="h-8 flex items-center justify-center">
                    <span className="text-2xl filter drop-shadow-md leading-none">🕯️</span>
                </div>
                <span className="text-[10px] text-stone-500 font-serif mt-1">香火</span>
            </div>
          </motion.div>
      </div>

      {/* Donation Modal */}
      <DonationModal 
        show={showDonation} 
        onClose={() => setShowDonation(false)} 
        blessing={blessing} 
      />

      {/* Share Modal */}
      <ShareModal 
        show={showShare} 
        onClose={() => setShowShare(false)} 
        result={result} 
        poem={poem}
      />

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center space-y-4 pt-8"
      >
        <motion.div 
          className="relative w-24 h-24"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Image src="/logo.svg" alt="From Heart Logo" fill className="object-contain" priority />
        </motion.div>
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">一问</h1>
          <p className="text-sm text-gray-500 font-serif tracking-widest uppercase">from heart</p>
        </div>
      </motion.header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4 border border-white/40 ring-1 ring-white/50"
      >
        <label className="text-sm text-gray-500 font-medium ml-1 tracking-wide">今日问题</label>
        <textarea
          className="w-full bg-white/50 border-transparent rounded-2xl p-4 text-gray-700 placeholder:text-gray-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-100/50 focus:bg-white/80 transition-all duration-300 resize-none shadow-sm hover:shadow-md hover:bg-white/60"
          rows={4}
          placeholder="写下今天唯一的问题..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="flex justify-end items-center relative">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
              if (loading) return;
              if (pressProgress < 100) {
                 // Trigger directly on click
                 handleAsk();
              }
          }}
          className={`px-8 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden select-none tap-highlight-transparent ${
            loading 
              ? "bg-stone-50 text-stone-400 cursor-not-allowed border border-stone-100" 
              : "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-emerald-200/50 shadow-lg"
          }`}
          disabled={loading}
        >
          {/* Progress Fill Background - Removed for Short Press */}
          
          <span className="relative z-10 select-none">
          {loading ? (
             "等待中..."
          ) : (
             "诚心一问"
          )}
          </span>
        </motion.button>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {loading ? (
           <motion.section
             key="wooden-fish"
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="bg-stone-50/80 backdrop-blur-md rounded-3xl p-6 border border-stone-200/50 flex flex-col items-center"
           >
              <WoodenFish />
           </motion.section>
        ) : (
        <motion.section 
          key="result-section"
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-emerald-50/50 backdrop-blur-md rounded-3xl p-6 space-y-4 border border-emerald-100/50"
        >
          <ResultDisplay result={result} divinationId={divinationId} />
          
          {result && (
            <div className="flex justify-center pt-2 pb-1">
               <button 
                 onClick={() => setShowShare(true)}
                 className="text-xs text-emerald-600/60 hover:text-emerald-700 font-serif tracking-wider border-b border-dashed border-emerald-600/30 hover:border-emerald-600 transition-all flex items-center gap-1"
               >
                 <span>📷</span> 生成分享卡片
               </button>
            </div>
          )}

          <p className="text-[10px] text-center text-gray-400 pt-2 opacity-60">仅供参考，不构成现实决策依据。</p>
        </motion.section>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center pt-4"
      >
        <Link className="text-xs text-stone-400 hover:text-emerald-600 transition-all duration-300 border-b border-transparent hover:border-emerald-600 pb-0.5 tracking-widest font-serif inline-block hover:-translate-y-0.5" href="/history">
          查看历史记录
        </Link>
      </motion.div>

      {poem && (
        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-12 text-center space-y-4 pb-8"
        >
            <div className="w-12 h-px bg-emerald-900/10 mx-auto"></div>
            <p className="text-xs text-gray-500 font-serif whitespace-pre-line leading-loose italic opacity-80 select-none">
                {poem}
            </p>
        </motion.footer>
      )}

      {/* Dev Mode Toast */}
      <AnimatePresence>
        {devToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-emerald-100 flex items-center gap-3 ring-1 ring-emerald-50">
               <span className="text-xl">🗝️</span>
               <span className="text-sm font-serif text-emerald-900 tracking-widest font-medium">{devToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center pb-4 mt-8"
      >
         <p 
            onClick={() => setShowDevModal(true)}
            className="text-[10px] text-emerald-900/40 font-serif tracking-widest hover:text-emerald-700 transition-colors select-none cursor-pointer"
         >
            River
         </p>
      </motion.div>

      {/* Dev Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDevModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur rounded-2xl p-6 w-full max-w-[280px] space-y-4 shadow-2xl border border-white/40"
              onClick={e => e.stopPropagation()}
            >
               <h3 className="text-center text-sm font-serif text-gray-500 tracking-widest">开发者模式</h3>
               {!devModeActive ? (
                 <>
                   <input 
                     type="password"
                     value={devSecret}
                     onChange={(e) => setDevSecret(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center text-sm focus:outline-none focus:border-emerald-300 focus:bg-white transition-all"
                     placeholder="输入密钥"
                   />
                   <button 
                     onClick={handleDevSubmit}
                     className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs tracking-wider hover:bg-emerald-700 transition-colors"
                   >
                     确认
                   </button>
                 </>
               ) : (
                 <div className="space-y-3">
                    <div className="text-center py-2">
                        <span className="text-2xl">👁️</span>
                        <p className="text-xs text-emerald-600 mt-1 font-medium">天眼已开</p>
                    </div>
                    <Link href="/admin" className="block w-full py-2.5 bg-stone-800 text-white text-center rounded-lg text-xs tracking-wider shadow-md hover:bg-stone-700 transition-all">
                      进入万象镜 (Admin)
                    </Link>
                    <button 
                        onClick={() => {
                            window.localStorage.removeItem("fh_secret");
                            setDevModeActive(false);
                            setShowDevModal(false);
                        }} 
                        className="w-full py-2 text-stone-400 text-xs hover:text-red-500 transition-colors"
                    >
                        关闭天眼
                    </button>
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}