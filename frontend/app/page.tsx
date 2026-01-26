"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { askQuestion, getDailyPoem, getUsage, getBlessing } from "../lib/api";

type Output = {
  direct_answer: string;
  summary: string;
  advice: string[];
  warnings: string[];
  keywords: string[];
  raw: string;
};

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
  const [blessing, setBlessing] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<"none" | "wechat" | "alipay">("none");

  useEffect(() => {
    getDailyPoem().then((res) => setPoem(res.poem)).catch(() => {});

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

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("请输入问题");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await askQuestion(question.trim(), deviceHash);
      setResult(res.result);
      setDivinationId(res.divination_id);
      setUsageCount(res.usage_count);
      alert("气运能量 -1");
    } catch (err: any) {
      if (err.message === "daily_limit_reached") {
        setError("不可贪念天机");
      } else {
        setError("请求失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <main className="space-y-8 max-w-lg mx-auto p-4 sm:p-6 relative">
      {/* Incense Icon */}
      <motion.div 
        className="absolute top-4 right-4 cursor-pointer z-10"
        onClick={handleOpenDonation}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 + (usageCount * 0.25) }}
        whileHover={{ scale: 1.1 }}
      >
        <div className="flex flex-col items-center">
            <span className="text-2xl filter drop-shadow-md">🕯️</span>
            <span className="text-[10px] text-stone-500 font-serif">香火</span>
        </div>
      </motion.div>

      {/* Donation Modal */}
      <AnimatePresence>
        {showDonation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDonation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-6 text-center shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-serif text-emerald-800">福源广进</h3>
              
              {blessing ? (
                 <p className="text-stone-600 font-serif text-lg leading-loose italic">{blessing}</p>
              ) : (
                 <p className="text-gray-400 text-sm animate-pulse">祈福中...</p>
              )}

              <div className="pt-4 space-y-4">
                 <button 
                   onClick={() => setShowQR(showQR === "wechat" ? "none" : "wechat")}
                   className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-emerald-200 transition-all font-medium text-sm flex items-center justify-center gap-2"
                 >
                   <span>🙏</span> 施舍香火以获福源
                 </button>
                 
                 <AnimatePresence mode="wait">
                   {showQR !== "none" && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                     >
                       <div className="flex justify-center gap-4 mb-4 text-xs font-medium text-gray-500">
                          <button onClick={() => setShowQR("wechat")} className={`${showQR==="wechat"?"text-emerald-600 border-b-2 border-emerald-600":""} pb-1`}>微信支付</button>
                          <button onClick={() => setShowQR("alipay")} className={`${showQR==="alipay"?"text-blue-600 border-b-2 border-blue-600":""} pb-1`}>支付宝</button>
                       </div>
                       
                       <div className="relative w-48 h-48 mx-auto bg-gray-50 rounded-lg p-2 border border-gray-100">
                          {showQR === "wechat" && <Image src="/wechat.jpg" alt="WeChat Pay" fill className="object-contain" />}
                          {showQR === "alipay" && <Image src="/alipay.jpg" alt="Alipay" fill className="object-contain" />}
                       </div>
                       <p className="text-[10px] text-gray-400 mt-2">心诚则灵，随缘施舍</p>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4 border border-white/20"
      >
        <label className="text-sm text-gray-600 font-medium ml-1">今日问题</label>
        <textarea
          className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all duration-300 resize-none shadow-inner"
          rows={4}
          placeholder="写下今天唯一的问题..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="flex justify-end">
        <button
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            loading 
              ? "bg-emerald-50 text-emerald-600 cursor-not-allowed" 
              : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 shadow-emerald-100 shadow-md"
          }`}
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? (
             <span className="flex items-center gap-2">
               <motion.span
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                 className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full"
               />
               推演中
             </span>
          ) : "今日问"}
        </button>
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100"
          >
            {error}
          </motion.p>
        )}
      </motion.section>

      <AnimatePresence mode="wait">
        <motion.section 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-emerald-50/50 backdrop-blur-md rounded-3xl p-6 space-y-4 border border-emerald-100/50"
        >
          {!result ? (
             <div className="flex flex-col items-center justify-center py-8 text-emerald-800/40 space-y-4">
                <motion.div 
                  className="relative w-16 h-16 opacity-40"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                  <Image src="/bagua.svg" alt="Bagua" fill className="object-contain" />
                </motion.div>
                <p className="text-sm font-serif tracking-widest text-emerald-800/60">卦象待显</p>
             </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
            >
              <div className="border-b border-emerald-100/60 pb-4 mb-4">
                 <p className="text-xl font-serif text-emerald-900 leading-relaxed tracking-wide">{result.direct_answer}</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-700 leading-7 text-justify">{result.summary}</p>
                
                <div className="flex flex-wrap gap-2">
                   {result.keywords.map(k => (
                     <span key={k} className="px-2.5 py-1 bg-white/60 text-emerald-700 text-xs rounded-full border border-emerald-100/50 shadow-sm">{k}</span>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/40 p-3 rounded-xl border border-white/50">
                    <h3 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">建议</h3>
                    <ul className="space-y-1">
                      {result.advice.map((item) => (
                        <li key={item} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">▪</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/40 p-3 rounded-xl border border-white/50">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">忌讳</h3>
                    <ul className="space-y-1">
                      {result.warnings.map((item) => (
                        <li key={item} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-red-300 mt-0.5">▪</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {divinationId && (
                  <div className="pt-2 flex justify-end">
                    <Link className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 group" href={`/divination/${divinationId}`}>
                      查看详情 
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          <p className="text-[10px] text-center text-gray-400 pt-2 opacity-60">仅供参考，不构成现实决策依据。</p>
        </motion.section>
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <Link className="text-sm text-gray-400 hover:text-emerald-600 transition-colors border-b border-transparent hover:border-emerald-600 pb-0.5" href="/history">
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center pb-4 mt-8"
      >
         <p className="text-[10px] text-gray-300 font-serif tracking-widest opacity-60 hover:opacity-100 transition-opacity select-none cursor-default">
            River
         </p>
      </motion.div>
    </main>
  );
}