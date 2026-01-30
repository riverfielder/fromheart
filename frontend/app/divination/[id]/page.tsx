"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getDivination, chatStream, ChatMessage, getDailyPoem } from "../../../lib/api";
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
    const userMsg = input.trim();
    setInput("");
    
    // Optimistic user update
    const newHistory = [...messages, { role: "user", content: userMsg } as ChatMessage];
    setMessages(newHistory);
    
    // Placeholder for assistant
    setMessages(prev => [...prev, { role: "assistant", content: "" } as ChatMessage]);
    setChatLoading(true);

    try {
      // Use streaming chat
      const historyForApi = newHistory.map(m => ({ role: m.role, content: m.content }));
      
      await chatStream(Number(params?.id), userMsg, historyForApi, (token) => {
         setMessages(prev => {
             const last = prev[prev.length - 1];
             if (last.role === "assistant") {
                 return [...prev.slice(0, -1), { ...last, content: last.content + token }];
             }
             return prev;
         });
      });
      
    } catch (e) {
      // Error handling
       let errorMessage = "[网络连接中断，请重试]";
       if (e instanceof Error) {
           if (e.message === "daily_chat_limit_reached") {
               errorMessage = "今日追问次数已用完，明日再来吧 🙏";
           } else if (e.message === "server_busy") {
               errorMessage = "服务器正忙，正在排队中，请稍后重试...";
           }
       }
       
       setMessages(prev => {
         const last = prev[prev.length - 1];
         return [...prev.slice(0, -1), { ...last, content: last.content + "\n" + errorMessage }];
       });
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    getDailyPoem().then((res) => setPoem(res.poem)).catch(() => {});
    
    const id = Number(params?.id);
    if (!id) return;
    
    const token = window.localStorage.getItem("fh_device") || "anonymous";

    getDivination(id, token)
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
      .catch((err) => {
        // If 403 or 404, we want to show the specific "Access Denied / Spy on Heaven" page.
        // Since api.ts throws generic Error("request failed") for 403 currently in getDivination, 
        // we should try to detect if it's an access issue or just network error.
        // But the simplest way to render the Not Found page is using Next.js notFound()
        // However, notFound() only works in Server Components or during initial render logic, 
        // but here we are in useEffect (Client Component).
        // So we can set a specific error state and render the NotFound component, 
        // or redirect.
        setError("load_failed");
      });
  }, [params]);

  if (error === "load_failed") {
    return <NotFoundUI />;
  }

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
        result={parsedRaw && data ? { ...parsedRaw, ben_gua: data.BenGua, bian_gua: data.BianGua } : parsedRaw} 
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

          {/* 哲理建议 */}
          {parsedRaw?.philosophical_suggestion && (
              <div className="mt-6 pt-6 border-t border-stone-100">
                  <h3 className="text-sm font-bold text-stone-500 mb-2">君子之道</h3>
                  <p className="text-stone-700 leading-7 bg-stone-50 p-4 rounded-lg border border-stone-200">
                      {parsedRaw.philosophical_suggestion}
                  </p>
              </div>
          )}
        </div>
      )}

      {/* 追问部分 */}
      {parsedRaw && (
        <section className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-stone-100">
          <h2 className="text-lg font-serif mb-4">追问大师</h2>
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-sm ${
                msg.role === 'user' ? 'bg-stone-100 ml-8' : 'bg-emerald-50 mr-8 border border-emerald-100'
              }`}>
                <p className="font-bold mb-1 text-xs opacity-50">{msg.role === 'user' ? '缘主' : '大师'}</p>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
               <div className="p-3 bg-emerald-50 mr-8 rounded-lg border border-emerald-100 animate-pulse">
                  <span className="text-xs text-emerald-800">大师正在推演...</span>
               </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="对卦象有疑问？可以继续追问..."
              className="flex-1 px-4 py-2 rounded-full border border-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={chatLoading}
            />
            <button 
              onClick={handleSend}
              disabled={chatLoading}
              className="bg-emerald-800 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50"
            >
              请教
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function NotFoundUI() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="text-4xl text-emerald-900/20 font-serif">☁</div>
        <div className="space-y-2">
            <h2 className="text-lg font-serif text-stone-800 tracking-widest font-medium">
                勿探天机
            </h2>
            <p className="text-xs text-stone-500 font-serif leading-relaxed">
                缘分未到，不必强求。<br/>
                此卦象不属于您，或已散佚于天地之间。
            </p>
        </div>
        <a 
            href="/"
            className="px-6 py-2 rounded-full border border-stone-200 text-stone-600 text-xs tracking-widest hover:bg-stone-50 transition-colors"
        >
            返回问道
        </a>
    </div>
  );
}