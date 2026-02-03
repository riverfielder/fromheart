"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { submitYearlyForecast, YearlyResponse } from "../../lib/api";

type Step = "input" | "loading" | "result";

interface AnalysisData {
  score: number;
  keyword: string;
  overview: string;
  career_finance: string;
  love_relationship: string;
  health: string;
  months: Array<{ month: string; desc: string }>;
  advice: string[];
}

export default function YearlyPage() {
  const [step, setStep] = useState<Step>("input");

  // Form
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birth, setBirth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear() + 1); // Default to next year

  const [result, setResult] = useState<YearlyResponse | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loadingText, setLoadingText] = useState("正在排盘推演...");

  useEffect(() => {
    if (step === "loading") {
      const msgs = [
        "正在排盘推演...",
        "观天象，测流年...",
        "紫微斗数，运筹帷幄...",
        "五行生克，详批流年...",
        "乾坤运转，静候天机..."
      ];
      let i = 0;
      setLoadingText(msgs[0]);
      const timer = setInterval(() => {
        i = (i + 1) % msgs.length;
        setLoadingText(msgs[i]);
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!name || !gender || !birth) {
      setError("请完整填写信息");
      setTimeout(() => setError(null), 2000);
      return;
    }

    setStep("loading");

    try {
      const res = await submitYearlyForecast({
        name,
        gender,
        birth,
        year
      });
      setResult(res);
      // Parse JSON
      try {
        // Handle potential markdown code block wrapping
        let cleanJson = res.final_response.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanJson);
        setParsedAnalysis(data);
      } catch (e) {
        console.error("JSON parse error", e);
        // Fallback if parsing fails?
      }
      setStep("result");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "请求失败，请稍后重试");
      setTimeout(() => setError(null), 3000);
      setStep("input");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf5] relative font-serif text-amber-950 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-30 pointer-events-none">
        <Link href="/" className="pointer-events-auto bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-amber-200/50 text-amber-800 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 text-sm font-serif">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          <span className="pr-1">返回</span>
        </Link>
        <h1 className="text-2xl tracking-widest text-amber-700 font-bold pointer-events-auto">流年·运势</h1>
        <div className="w-10" />
      </header>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center relative z-10 pt-20 pb-10"
          >
            <div className="w-full max-w-lg bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-amber-900/5">
              <div className="text-center mb-10">
                <span className="text-4xl mb-4 block">🐲</span>
                <h2 className="text-xl font-medium text-amber-900/80 mb-2">八字流年详批</h2>
                <p className="text-sm text-amber-800/60">观天之道，执天之行，尽在其中</p>
              </div>

              <div className="space-y-6">
                {/* Year Select */}
                <div className="flex justify-center mb-6">
                  <div className="relative inline-flex items-center px-4 py-2 rounded-full bg-amber-50 border border-amber-200 shadow-inner">
                    <span className="text-amber-800 mr-2">测算年份：</span>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="bg-transparent text-amber-900 font-bold focus:outline-none appearance-none pr-8 cursor-pointer"
                    >
                      {[0, 1, 2].map(offset => {
                        const y = new Date().getFullYear() + offset;
                        return <option key={y} value={y}>{y}年</option>
                      })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600 text-xs">▼</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-amber-800/60 ml-1">您的姓名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="姓名"
                      className="w-full bg-white/60 border border-amber-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-200/50 transition-all text-amber-900 placeholder:text-amber-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-amber-800/60 ml-1">性别</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white/60 border border-amber-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-200/50 transition-all text-amber-900 appearance-none"
                    >
                      <option value="" disabled>选择性别</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-amber-800/60 ml-1">出生日期 (公历)</label>
                  <input
                    type="datetime-local"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    className="w-full bg-white/60 border border-amber-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-200/50 transition-all text-amber-900"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-4 font-medium shadow-lg shadow-orange-500/20 mt-4 tracking-wide"
                >
                  开启流年运势
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[#fffdf5]/90 backdrop-blur-sm"
          >
            <div className="relative mb-8">
              <span className="text-6xl animate-pulse grayscale opacity-50">🧭</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] border-2 border-dashed border-amber-400 rounded-full opacity-60"
              />
            </div>
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-amber-800/80 font-medium text-lg"
            >
              {loadingText}
            </motion.p>
          </motion.div>
        )}

        {step === "result" && parsedAnalysis && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-4 py-24 min-h-screen z-10 relative max-w-2xl"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-10 border border-amber-100 shadow-2xl shadow-amber-900/10">
              
              {/* Header Info */}
              <div className="flex justify-between items-start mb-8 border-b border-amber-100 pb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-amber-900 mb-1">{result?.year}年 流年运势</h2>
                    <p className="text-sm text-amber-700/60">
                        {result?.name} ({result?.gender}) · {result?.ben_gua} 之 {result?.bian_gua}
                    </p>
                 </div>
                 <div className="flex flex-col items-center justify-center bg-amber-50 rounded-2xl p-3 border border-amber-100/50">
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">年度评分</span>
                    <span className="text-3xl font-bold text-amber-600">{parsedAnalysis.score}</span>
                 </div>
              </div>

              {/* Keyword & Overview */}
              <div className="mb-8">
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm font-bold mb-4">
                   #{parsedAnalysis.keyword}
                </div>
                <p className="text-amber-900/80 leading-relaxed text-justify">
                   {parsedAnalysis.overview}
                </p>
              </div>

              {/* Detail Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                 <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <h3 className="font-bold text-orange-800 mb-2 text-sm flex items-center">
                        <span className="mr-2">💼</span>事业财运
                    </h3>
                    <p className="text-xs text-orange-900/70 leading-relaxed">{parsedAnalysis.career_finance}</p>
                 </div>
                 <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                    <h3 className="font-bold text-pink-800 mb-2 text-sm flex items-center">
                        <span className="mr-2">💗</span>感情人际
                    </h3>
                    <p className="text-xs text-pink-900/70 leading-relaxed">{parsedAnalysis.love_relationship}</p>
                 </div>
                 <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h3 className="font-bold text-emerald-800 mb-2 text-sm flex items-center">
                        <span className="mr-2">🍵</span>健康平安
                    </h3>
                    <p className="text-xs text-emerald-900/70 leading-relaxed">{parsedAnalysis.health}</p>
                 </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="mb-8">
                 <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center">
                    <span className="w-1 h-6 bg-amber-400 rounded-full mr-3"></span>
                    重点月份运程
                 </h3>
                 <div className="space-y-3">
                    {parsedAnalysis.months.map((m, idx) => (
                        <div key={idx} className="flex gap-4 p-3 hover:bg-amber-50/50 rounded-lg transition-colors group">
                           <div className="w-20 pt-1 text-sm font-bold text-amber-700/70 flex-shrink-0 group-hover:text-amber-700">{m.month}</div>
                           <div className="text-sm text-amber-900/70 leading-relaxed">{m.desc}</div>
                        </div>
                    ))}
                 </div>
              </div>

              {/* Advice */}
              <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="font-bold mb-4 opacity-90 border-b border-white/20 pb-2 inline-block">大师寄语</h3>
                    <ul className="space-y-2">
                        {parsedAnalysis.advice.map((t, i) => (
                           <li key={i} className="text-sm opacity-90 flex gap-2">
                              <span>•</span>
                              <span>{t}</span>
                           </li>
                        ))}
                    </ul>
                 </div>
                 {/* Decor */}
                 <div className="absolute -right-5 -bottom-10 text-9xl opacity-10 pointer-events-none rotate-12">🧞‍♂️</div>
              </div>

            </div>
            
            <div className="text-center mt-8">
                <button
                  onClick={() => {
                     setStep("input");
                     setResult(null);
                     setParsedAnalysis(null);
                  }}
                  className="text-amber-700/50 hover:text-amber-700 text-sm transition-colors py-2 px-6 rounded-full hover:bg-amber-100/50"
                >
                    再算一挂
                </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
