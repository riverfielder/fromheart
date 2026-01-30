"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLoveDetail, chatLove } from "../../../lib/api";

type LoveDetail = {
    id: number;
    analysis: any;
    hexagram: string;
    story: string;
    name_a: string;
    name_b: string;
    created_at: string;
};

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function LoveDetailPage() {
    const { id } = useParams();
    const [detail, setDetail] = useState<LoveDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        const key = "fh_device";
        const hash = window.localStorage.getItem(key) || "anonymous";
        
        getLoveDetail(Number(id), hash)
            .then(setDetail)
            .catch(() => setError("记录未找到"))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (chatOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, chatOpen]);

    const handleSend = async () => {
        if (!input.trim() || chatLoading || !detail) return;
        
        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setChatLoading(true);

        try {
            // Filter history for API
            const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await chatLove(detail.id, userMsg, historyForApi);
            setMessages(prev => [...prev, { role: "assistant", content: res.response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "网络仿佛有些拥挤，请稍后再试..." }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fff0f5]">
            <div className="text-[#d45d79] animate-pulse">加载回忆...</div>
        </div>
    );

    if (error || !detail) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff0f5] space-y-4">
            <div className="text-stone-400">{error || "未知错误"}</div>
            <Link href="/history" className="text-[#d45d79] border-b border-[#d45d79]">返回历史</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fff0f5] relative font-serif text-stone-800 pb-20">
             <header className="fixed top-0 w-full p-4 flex justify-between items-center z-20 bg-[#fff0f5]/80 backdrop-blur-md border-b border-pink-100">
                <Link href="/history" className="text-stone-500 hover:text-[#d45d79] transition-colors">
                    ← 列表
                </Link>
                <h1 className="text-lg tracking-widest text-[#d45d79] font-medium">
                    {detail.name_a} & {detail.name_b}
                </h1>
                <div className="w-10"/>
            </header>

            <main className="container mx-auto px-4 pt-20 max-w-lg space-y-6">
                 {/* Story Card */}
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50">
                    <h3 className="text-xs text-[#d45d79] font-bold uppercase tracking-wider mb-2">缘起</h3>
                    <p className="text-sm text-stone-600 leading-relaxed italic">
                        “{detail.story}”
                    </p>
                 </div>

                 {/* Result Card */}
                 <div className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-xl border border-white space-y-6">
                    {/* Header Score */}
                    <div className="text-center relative py-4 border-b border-pink-100">
                        <div className="text-4xl font-bold text-[#d45d79] mb-1">
                            {detail.analysis?.score || "???"}
                        </div>
                        <div className="text-stone-500 text-[10px] tracking-widest uppercase">缘分指数</div>
                    </div>

                    {/* Poem */}
                    <div className="text-center px-4">
                        <p className="text-base text-stone-700 italic leading-relaxed">
                            “{detail.analysis?.poem}”
                        </p>
                    </div>

                     {/* Analysis Sections */}
                    <div className="space-y-4">
                        <div className="bg-pink-50/50 p-4 rounded-xl">
                            <h3 className="text-[#d45d79] font-bold mb-2 flex items-center gap-2 text-sm">
                                <span>🔮</span> 命理合盘
                            </h3>
                            <p className="text-stone-700 text-xs leading-loose text-justify">
                                {detail.analysis?.bazi_analysis}
                            </p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-xl">
                            <h3 className="text-emerald-700 font-bold mb-2 flex items-center gap-2 text-sm">
                                <span>📜</span> 卦象指引 ({detail.hexagram})
                            </h3>
                            <p className="text-stone-700 text-xs leading-loose text-justify">
                                {detail.analysis?.hexagram_analysis}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Toggle */}
                {!chatOpen && (
                    <div className="text-center py-4">
                        <button 
                            onClick={() => setChatOpen(true)}
                            className="bg-[#d45d79] text-white px-8 py-3 rounded-full shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all text-sm tracking-widest"
                        >
                            💬 对此结果有疑惑？追问大师
                        </button>
                    </div>
                )}

                {/* Chat Section */}
                <AnimatePresence>
                    {chatOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100"
                        >
                            <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex justify-between items-center">
                                <span className="text-xs text-[#d45d79] font-bold">大师对话中</span>
                                <button onClick={() => setChatOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                            </div>
                            
                            <div className="h-64 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                                {messages.length === 0 && (
                                    <div className="text-center text-stone-300 text-xs py-10">
                                        关于这段缘分，还有什么想问的吗？
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            m.role === 'user' 
                                            ? 'bg-[#d45d79] text-white rounded-br-none' 
                                            : 'bg-white border border-stone-100 text-stone-700 rounded-bl-none shadow-sm'
                                        }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-[#d45d79] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}/>
                                                <div className="w-1.5 h-1.5 bg-[#d45d79] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}/>
                                                <div className="w-1.5 h-1.5 bg-[#d45d79] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}/>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="p-3 border-t border-stone-100 bg-white flex gap-2">
                                <input
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#d45d79]"
                                    placeholder="输入你的追问..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    disabled={chatLoading}
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || chatLoading}
                                    className="w-10 h-10 bg-[#d45d79] text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#c04b65] transition-colors"
                                >
                                    ↑
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
