"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { submitLoveProbe, LoveProbeResponse } from "../../lib/api";

type Step = "input" | "loading" | "result";

export default function LovePage() {
  const [step, setStep] = useState<Step>("input");
  
  // Form State
  const [nameA, setNameA] = useState("");
  const [genderA, setGenderA] = useState("male");
  const [birthA, setBirthA] = useState("");
  
  const [nameB, setNameB] = useState("");
  const [genderB, setGenderB] = useState("female");
  const [birthB, setBirthB] = useState("");
  
  const [story, setStory] = useState("");
  const [result, setResult] = useState<LoveProbeResponse | null>(null);

  const handleSubmit = async () => {
    if (!nameA || !nameB || !story || !birthA || !birthB) return;
    
    setStep("loading");
    
    // Get device hash
    const key = "fh_device";
    let hash = window.localStorage.getItem(key);
    if (!hash) {
       hash = `fh_${Math.random().toString(36).slice(2)}`;
       window.localStorage.setItem(key, hash);
    }

    try {
      const res = await submitLoveProbe({
        deviceHash: hash,
        name_a: nameA, gender_a: genderA, birth_date_a: birthA,
        name_b: nameB, gender_b: genderB, birth_date_b: birthB,
        story
      });
      setResult(res);
      setStep("result");
    } catch (e) {
      console.error(e);
      alert("请求失败，请稍后重试");
      setStep("input");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff0f5] relative font-serif text-stone-800 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
          <Link href="/" className="text-stone-500 hover:text-stone-800 transition-colors">
             ← 返回
          </Link>
          <h1 className="text-2xl tracking-widest text-[#d45d79] font-medium">桃花·问情</h1>
          <div className="w-10"/>
      </header>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-lg min-h-screen flex flex-col">
        
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 bg-white/60 p-8 rounded-3xl shadow-xl backdrop-blur-sm border border-white"
            >
              <div className="text-center space-y-2 mb-8">
                 <p className="text-stone-500 text-sm">合八字 · 测姻缘 · 解疑惑</p>
                 <div className="h-px w-20 bg-[#d45d79]/30 mx-auto" />
              </div>

              {/* Me */}
              <div className="space-y-4">
                <h3 className="text-[#d45d79] text-sm font-bold tracking-wider uppercase">甲方 (你)</h3>
                <div className="grid grid-cols-2 gap-4">
                   <input 
                     placeholder="姓名" 
                     className="bg-white/50 border-b border-stone-200 p-2 focus:border-[#d45d79] outline-none transition-colors"
                     value={nameA} onChange={e => setNameA(e.target.value)}
                   />
                   <select 
                     className="bg-white/50 border-b border-stone-200 p-2 outline-none"
                     value={genderA} onChange={e => setGenderA(e.target.value)}
                   >
                     <option value="male">男</option>
                     <option value="female">女</option>
                   </select>
                </div>
                <input 
                   type="datetime-local" 
                   className="w-full bg-white/50 border-b border-stone-200 p-2 outline-none text-stone-600"
                   value={birthA} onChange={e => setBirthA(e.target.value)}
                />
                <p className="text-xs text-stone-400">* 准确的时辰对八字推演至关重要</p>
              </div>

              {/* Them */}
              <div className="space-y-4 pt-4">
                <h3 className="text-[#d45d79] text-sm font-bold tracking-wider uppercase">乙方 (TA)</h3>
                <div className="grid grid-cols-2 gap-4">
                   <input 
                     placeholder="姓名" 
                     className="bg-white/50 border-b border-stone-200 p-2 focus:border-[#d45d79] outline-none transition-colors"
                     value={nameB} onChange={e => setNameB(e.target.value)}
                   />
                   <select 
                     className="bg-white/50 border-b border-stone-200 p-2 outline-none"
                     value={genderB} onChange={e => setGenderB(e.target.value)}
                   >
                     <option value="female">女</option>
                     <option value="male">男</option>
                   </select>
                </div>
                <input 
                   type="datetime-local" 
                   className="w-full bg-white/50 border-b border-stone-200 p-2 outline-none text-stone-600"
                    value={birthB} onChange={e => setBirthB(e.target.value)}
                />
              </div>

              {/* Story */}
              <div className="space-y-4 pt-4">
                  <h3 className="text-[#d45d79] text-sm font-bold tracking-wider uppercase">故事与困惑</h3>
                  <textarea 
                    className="w-full bg-white/50 rounded-xl p-4 border border-stone-100 focus:border-[#d45d79] outline-none resize-none h-32"
                    placeholder="写下你们相遇的瞬间，或此刻心中的疑惑..."
                    value={story}
                    onChange={e => setStory(e.target.value)}
                  />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!nameA || !nameB || !story || !birthA || !birthB}
                className="w-full py-4 bg-[#d45d79] text-white rounded-full shadow-lg shadow-pink-300 hover:shadow-pink-400 hover:-translate-y-0.5 transition-all text-lg tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                缔结良缘
              </button>

            </motion.div>
          )}

          {step === "loading" && (
             <motion.div
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8"
             >
                {/* Red String Animation */}
                <div className="relative w-full h-20">
                     <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "50%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute left-0 top-1/2 h-0.5 bg-red-400/50"
                     />
                     <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "50%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute right-0 top-1/2 h-0.5 bg-red-400/50"
                     />
                     <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, rotate: 360 }}
                        transition={{ delay: 1.8, duration: 1 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-red-500"
                     >
                        ❤️
                     </motion.div>
                </div>
                
                <p className="text-[#d45d79] text-lg animate-pulse">
                    正在推演八字与卦象...
                </p>
                <p className="text-stone-400 text-sm">
                    缘分天注定，事在人为
                </p>
             </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-2xl border border-white space-y-6"
            >
                {/* Header Score */}
                <div className="text-center relative py-6 border-b border-pink-100">
                    <div className="text-5xl font-bold text-[#d45d79] mb-2">{result.analysis.score}</div>
                    <div className="text-stone-500 text-sm tracking-widest uppercase">缘分指数</div>
                    <div className="mt-4 inline-block px-4 py-1 bg-pink-100 text-[#d45d79] rounded-full text-sm font-bold">
                        {result.analysis.keyword}
                    </div>
                </div>

                {/* Poem */}
                <div className="text-center px-8">
                    <p className="text-lg text-stone-700 italic leading-relaxed font-serif">
                        “{result.analysis.poem}”
                    </p>
                </div>

                {/* Analysis Sections */}
                <div className="space-y-6">
                    <div className="bg-pink-50/50 p-4 rounded-xl">
                        <h3 className="text-[#d45d79] font-bold mb-2 flex items-center gap-2">
                            <span>🔮</span> 命理合盘
                        </h3>
                        <p className="text-stone-700 text-sm leading-loose text-justify">
                            {result.analysis.bazi_analysis}
                        </p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl">
                        <h3 className="text-emerald-700 font-bold mb-2 flex items-center gap-2">
                             <span>📜</span> 卦象指引 ({result.hexagram})
                        </h3>
                        <p className="text-stone-700 text-sm leading-loose text-justify">
                            {result.analysis.hexagram_analysis}
                        </p>
                    </div>
                    
                    <div>
                         <h3 className="text-stone-800 font-bold mb-3">大师建议</h3>
                         <ul className="space-y-3">
                             {result.analysis.advice.map((advisor, i) => (
                                 <li key={i} className="flex gap-3 text-sm text-stone-600 bg-white p-3 rounded-lg border border-stone-100">
                                     <span className="text-[#d45d79] font-bold">{i+1}.</span>
                                     {advisor}
                                 </li>
                             ))}
                         </ul>
                    </div>
                </div>

                <div className="pt-8 text-center">
                    <button onClick={() => setStep("input")} className="text-stone-400 hover:text-[#d45d79] transition-colors text-sm">
                        再算一卦
                    </button>
                </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
