"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getMetaReport, generateMetaReport, MetaReport } from "../../lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [report, setReport] = useState<MetaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQrUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/report");
      return;
    }
    if (user) {
        loadReport();
    }
  }, [user, authLoading]);

  const loadReport = async () => {
    try {
      const data = await getMetaReport();
      setReport(data);
    } catch (e) {
      // Not found is fine, just means we need to generate
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateMetaReport();
      setReport(data);
    } catch (e: any) {
      if (e.message && e.message.includes("完善")) {
          setError(e.message);
          setTimeout(() => router.push("/profile"), 2000);
      } else {
          setError("生成失败，请稍后重试");
      }
    } finally {
      setGenerating(false);
    }
  };

  const parseKeywords = (jsonStr: string) => {
      try {
          return JSON.parse(jsonStr) as string[];
      } catch {
          return jsonStr.split(",");
      }
  };

  if (authLoading || loading) {
     return <div className="min-h-screen bg-stone-900 flex items-center justify-center text-stone-500">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-serif relative overflow-hidden selection:bg-purple-900/50">
      {/* Mystic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[100px]" />
         <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>

      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-30">
        <Link href="/" className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1 text-sm text-stone-300">
           <span>← 返回</span>
        </Link>
        <span className="text-stone-500 text-xs tracking-[0.2em] uppercase">Soul Portrait</span>
        <div className="w-16" />
      </header>
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 py-20">
        <AnimatePresence mode="wait">
           {!report ? (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="text-center max-w-md mx-auto"
               >
                  <div className="mb-8 relative inline-block">
                     <span className="text-6xl filter brightness-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">🔮</span>
                     <motion.div 
                       animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                       transition={{ duration: 3, repeat: Infinity }}
                       className="absolute inset-0 bg-purple-500 blur-2xl -z-10"
                     />
                  </div>
                  <h1 className="text-3xl font-light tracking-wider mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-stone-400">灵魂画像</h1>
                  <p className="text-stone-500 mb-8 leading-relaxed">
                     基于荣格心理学类型 (MBTI)<br/>与古老星象学 (Zodiac)<br/>重构你的精神图腾
                  </p>
                  
                  {error ? (
                      <div className="bg-red-900/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                          {error}
                      </div>
                  ) : (
                      <button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="group relative px-8 py-3 bg-stone-100 text-stone-900 rounded-full font-medium tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {generating ? (
                             <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin"/>
                                正在通灵...
                             </span>
                         ) : (
                             <>
                                <span className="relative z-10">生成我的画像</span>
                                <div className="absolute inset-0 rounded-full blur bg-white/50 opacity-0 group-hover:opacity-50 transition-opacity" />
                             </>
                         )}
                      </button>
                  )}
               </motion.div>
           ) : (
               <motion.div
                 key="report"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="max-w-md w-full perspective-1000"
               >
                   {/* POSTER CARD */}
                   <div 
                     ref={posterRef}
                     className="bg-[#121212] border border-white/10 p-1 rounded-2xl shadow-2xl shadow-black relative overflow-hidden group"
                   >
                      {/* Gradient Border content */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 opacity-50 pointer-events-none" />
                      
                      <div className="bg-[#0f0f10] rounded-xl p-8 relative overflow-hidden flex flex-col items-center text-center">
                          {/* Grainy texture overlay */}
                          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                          
                          {/* Header Date */}
                          <div className="w-full flex justify-between text-[10px] text-stone-600 tracking-[0.2em] mb-10 border-b border-white/5 pb-4 uppercase">
                              <span>From Heart</span>
                              <span>{new Date().toLocaleDateString('en-US').replace(/\//g, '.')}</span>
                              <span>NO.{report.id.toString().padStart(4, '0')}</span>
                          </div>

                          {/* Main Identity */}
                          <div className="mb-8">
                              <div className="text-sm text-purple-400/80 mb-2 tracking-widest font-bold">TYPE</div>
                              <h2 className="text-3xl font-light text-white mb-1">
                                 {report.mbti} <span className="mx-2 text-stone-600">×</span> {report.zodiac}
                              </h2>
                          </div>

                          {/* Soul Color */}
                          <div className="mb-8 w-full">
                              <div className="flex items-center justify-center gap-4 mb-2">
                                 <div className="h-px bg-white/10 flex-1" />
                                 <span className="text-xs text-stone-500 tracking-widest uppercase">Soul Color</span>
                                 <div className="h-px bg-white/10 flex-1" />
                              </div>
                              <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200 font-medium">
                                 {report.soul_color}
                              </div>
                          </div>

                          {/* Past Life */}
                          <div className="mb-8 w-full">
                              <span className="text-xs text-stone-500 tracking-widest uppercase block mb-2">Past Life</span>
                              <div className="text-xl text-stone-300 font-light italic font-serif">
                                 “{report.past_life}”
                              </div>
                          </div>

                          {/* Keywords (Tags) */}
                          <div className="flex justify-center gap-3 mb-10 flex-wrap">
                              {parseKeywords(report.keywords).map((k, i) => (
                                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-stone-400 tracking-wider">
                                     #{k}
                                  </span>
                              ))}
                          </div>

                          {/* Description */}
                          <div className="mb-10 relative">
                              <span className="absolute -top-4 -left-2 text-4xl text-white/5 font-serif">“</span>
                              <p className="text-sm text-stone-400 leading-loose text-justify px-4 font-light relative z-10">
                                 {report.description}
                              </p>
                              <span className="absolute -bottom-8 -right-2 text-4xl text-white/5 font-serif">”</span>
                          </div>

                          {/* Footer */}
                          <div className="mt-auto pt-6 border-t border-white/5 w-full flex justify-between items-end">
                              <div className="text-left">
                                  <div className="text-[10px] text-stone-600 mb-1">Generated by</div>
                                  <div className="text-xs text-stone-400 font-bold tracking-widest">一问 FROM HEART</div>
                              </div>
                              {/* QR Code */}
                              <div className="bg-white p-1 rounded-sm">
                                  {qrUrl && <QRCodeSVG value={qrUrl} size={40} />}
                              </div>
                          </div>
                      </div>
                   </div>

                   <div className="mt-8 text-center space-y-4">
                       <p className="text-xs text-stone-600">截屏保存海报分享至朋友圈</p>
                       <button
                         onClick={handleGenerate} 
                         className="text-stone-500 hover:text-stone-300 text-sm border-b border-stone-800 hover:border-stone-500 transition-colors pb-0.5"
                       >
                           重新生成
                       </button>
                   </div>
               </motion.div>
           )}
        </AnimatePresence>
      </main>
    </div>
  );
}
