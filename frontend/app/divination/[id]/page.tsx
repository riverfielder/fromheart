"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getDivination, chat, ChatMessage, getDailyPoem } from "../../../lib/api";
import { Divination, Output } from "../../../types";
import Hexagram from "../../../components/Hexagram";
import ShareModal from "../../../components/ShareModal";

export default function DivinationDetailPage() {
  const params = useParams();
  const [data, setData] = useState<Divination | null>(null);
  const [parsedRaw, setParsedRaw] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Share state
  const [showShare, setShowShare] = useState(false);
  const [poem, setPoem] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    
    // Add user message immediately
    const userMsg = { role: "user", content: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setChatLoading(true);

    try {
      const res = await chat(Number(params?.id), userMsg.content, messages);
      setMessages([...newHistory, { role: "assistant", content: res.response }]);
    } catch (e) {
      console.error(e);
      // Optional: show error to user
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    getDailyPoem().then((res) => setPoem(res.poem)).catch(() => {});
    
    const id = Number(params?.id);
    if (!id) return;
    getDivination(id)
      .then((res) => {
        setData(res);
        if (res.RawOutput) {
          try {
            // Robust JSON parsing: clean markdown or extra text
            let rawStr = res.RawOutput.trim();
            const start = rawStr.indexOf('{');
            const end = rawStr.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                rawStr = rawStr.substring(start, end + 1);
            }
            const parsed = JSON.parse(rawStr);
            setParsedRaw(parsed);
          } catch (e) {
            console.error("Failed to parse output", e);
          }
        }
      })
      .catch(() => setError("加载失败"));
  }, [params]);

  return (
    <main className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">卦象详情</h1>
        {parsedRaw && (
            <button 
                onClick={() => setShowShare(true)}
                className="text-xs text-emerald-600/80 hover:text-emerald-700 font-serif tracking-wider border border-emerald-600/20 hover:border-emerald-600/50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 bg-emerald-50/30"
            >
                <span>📷</span> 分享
            </button>
        )}
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}
      
      <ShareModal 
        show={showShare} 
        onClose={() => setShowShare(false)} 
        result={parsedRaw} 
        poem={poem}
      />

      {data && (
        <div className="space-y-6">
          {/* 问题回顾 */}
          {data.daily_question && (
            <section className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-xs font-medium text-stone-400 mb-2 uppercase tracking-wide">
                所问何事
              </h2>
              <p className="text-xl font-serif text-stone-800 leading-relaxed">
                {data.daily_question.QuestionText}
              </p>
            </section>
          )}

          {/* 卦象结果 */}
          <section className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4">
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              卦象推演
            </h2>
            <div className="flex items-center space-x-6 text-lg font-serif justify-center py-4 bg-stone-50/50 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Hexagram name={data.BenGua} />
                <span>{data.BenGua}</span>
                <span className="text-xs text-stone-400">本卦</span>
              </div>
              <span className="text-stone-300">→</span>
              <div className="flex flex-col items-center gap-2">
                <Hexagram name={data.BianGua} />
                <span>{data.BianGua}</span>
                <span className="text-xs text-stone-400">变卦</span>
              </div>
            </div>
            
             <div className="bg-stone-50/80 p-3 rounded-lg border border-stone-100 mb-4 text-center">
                <p className="text-secondary text-xs font-serif text-stone-500">
                    — 此卦推演依据 —
                </p>
                <p className="text-xs text-stone-600 mt-1">
                   梅花易数 · 以先天之数起卦 · 结合时空与心念
                </p>
            </div>

            {data.ChangingLines && (
               <div className="text-sm text-emerald-600 mt-2 text-center">
                  动爻：{data.ChangingLines}
               </div>
            )}
            
            {/* 通俗解释 */}
            {parsedRaw?.colloquial_explanation && (
                <div className="mt-6 pt-6 border-t border-stone-100">
                    <h3 className="text-sm font-bold text-stone-500 mb-2">白话解签</h3>
                    <p className="text-stone-700 leading-7 bg-stone-50 p-4 rounded-lg border border-stone-200">
                        {parsedRaw.colloquial_explanation}
                    </p>
                </div>
            )}

            <div className="pt-6 border-t border-stone-100">
               <h3 className="text-sm font-bold text-stone-500 mb-2">详细推演</h3>
               <p className="text-stone-600 leading-7 whitespace-pre-wrap">{data.FinalOutput}</p>
            </div>
          </section>

          {/* 追问聊天区域 */}
          <section className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-xs font-medium text-stone-400 mb-4 uppercase tracking-wide">
              向大师追问
            </h2>
            
            <div className="space-y-4 mb-6">
                {messages.length === 0 && (
                   <div className="text-center text-stone-400 py-4 text-sm font-serif italic">
                      “若有未尽之意，尽可问来...”
                   </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            m.role === 'user' 
                            ? 'bg-stone-800 text-stone-50 rounded-br-none' 
                            : 'bg-stone-100 text-stone-700 rounded-bl-none'
                        }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {chatLoading && (
                    <div className="flex justify-start animate-pulse">
                       <div className="bg-stone-50 rounded-2xl px-4 py-3 text-sm text-stone-400">
                         大师正在沉思...
                       </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="对卦象有疑问？继续追问..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all font-serif"
                    disabled={chatLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={chatLoading || !input.trim()}
                    className="bg-stone-800 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 disabled:hover:bg-stone-800 transition-colors"
                >
                    发送
                </button>
            </div>
          </section>

        </div>
      )}
    </main>
  );
}