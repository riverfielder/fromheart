"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminQuestions, getAllLoveProbes } from "../../lib/api";
import Link from "next/link";

interface AdminQuestion {
  id: number;
  question_text: string;
  question_date: string;
  username: string;
  is_guest: boolean;
  answer: string;
  created_at: string;
}

interface LoveProbe {
  id: number;
  name_a: string;
  gender_a: string;
  birth_date_a: string;
  name_b: string;
  gender_b: string;
  birth_date_b: string;
  story: string;
  created_at: string;
  hexagram: string;
  analysis: {
      score: number;
      keyword: string;
      bazi_analysis: string;
      hexagram_analysis: string;
      story_interpretation: string;
      advice: string[];
  } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'love'>('questions');
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loveProbes, setLoveProbes] = useState<LoveProbe[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const secret = window.localStorage.getItem("fh_secret");
    if (!secret || secret !== "loveriver") {
      router.push("/");
      return;
    }

    setLoading(true);
    if (activeTab === 'questions') {
        getAdminQuestions(secret)
        .then((res) => setQuestions(res.items || []))
        .catch((err) => setError("Authentication failed or server error"))
        .finally(() => setLoading(false));
    } else {
        getAllLoveProbes(secret)
        .then((res) => setLoveProbes(res || []))
        .catch((err) => setError("Failed to fetch love probes"))
        .finally(() => setLoading(false));
    }
  }, [router, activeTab]);

  return (
    <main className="min-h-screen p-8 bg-stone-50 font-serif text-stone-900">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
               <h1 className="text-2xl font-bold text-stone-800">万象镜</h1>
               <div className="flex bg-stone-200 rounded-lg p-1 text-sm">
                   <button 
                    onClick={() => setActiveTab('questions')}
                    className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'questions' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                   >
                       一问
                   </button>
                   <button 
                    onClick={() => setActiveTab('love')}
                    className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'love' ? 'bg-white shadow text-pink-600' : 'text-stone-500 hover:text-stone-700'}`}
                   >
                       桃花
                   </button>
               </div>
          </div>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
            Exit
          </Link>
        </header>

        {loading && <div className="text-center text-stone-500 py-10 animate-pulse">Scanning timeline...</div>}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && activeTab === 'questions' && (
          <div className="space-y-4">
            <p className="text-right text-xs text-stone-400">Total: {questions.length}</p>
            {questions.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                         <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_guest ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.username}
                         </span>
                         <span className="text-xs text-stone-400">
                            {new Date(item.created_at).toLocaleString()}
                         </span>
                    </div>
                </div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                    {item.question_text}
                </h3>
                <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 leading-relaxed max-h-40 overflow-y-auto">
                    {item.answer ? item.answer : <span className="text-stone-300 italic">No answer generated</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && activeTab === 'love' && (
             <div className="space-y-6">
                 <p className="text-right text-xs text-stone-400">Total: {loveProbes.length}</p>
                 {loveProbes.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-pink-100 hover:shadow-md hover:border-pink-200 transition-all">
                        {/* Header */}
                         <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-4">
                            <div className="flex gap-8">
                                {/* Party A */}
                                <div>
                                    <div className="text-xs text-stone-400 mb-1">甲方</div>
                                    <div className="font-bold text-stone-800 flex items-center gap-2">
                                        {item.name_a} 
                                        <span className={`text-[10px] px-1.5 rounded ${item.gender_a === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                                            {item.gender_a === 'male' ? '男' : '女'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-stone-500 mt-1">{item.birth_date_a.replace("T", " ")}</div>
                                </div>
                                <div className="text-xl text-pink-200 pt-2">❤️</div>
                                {/* Party B */}
                                <div>
                                    <div className="text-xs text-stone-400 mb-1">乙方</div>
                                    <div className="font-bold text-stone-800 flex items-center gap-2">
                                        {item.name_b}
                                        <span className={`text-[10px] px-1.5 rounded ${item.gender_b === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                                            {item.gender_b === 'male' ? '男' : '女'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-stone-500 mt-1">{item.birth_date_b.replace("T", " ")}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-stone-400">{new Date(item.created_at).toLocaleString()}</div>
                                <div className="text-2xl font-bold text-pink-600 mt-1">{item.analysis?.score ?? '-'}</div>
                            </div>
                         </div>

                        {/* Story */}
                        <div className="mb-4">
                            <div className="text-xs text-stone-400 mb-1 uppercase tracking-wider">Story</div>
                            <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-700 leading-relaxed italic">
                                "{item.story}"
                            </div>
                        </div>

                        {/* Analysis & Bazi */}
                         <div className="grid grid-cols-2 gap-4 text-xs">
                             <div>
                                 <h4 className="font-bold text-stone-600 mb-1">八字命理</h4>
                                 <p className="text-stone-500 leading-relaxed max-h-32 overflow-y-auto">
                                     {item.analysis?.bazi_analysis || "解析中..."}
                                 </p>
                             </div>
                             <div>
                                 <h4 className="font-bold text-stone-600 mb-1">卦象 ({item.hexagram})</h4>
                                  <p className="text-stone-500 leading-relaxed max-h-32 overflow-y-auto">
                                     {item.analysis?.hexagram_analysis || "..."}
                                 </p>
                             </div>
                         </div>
                    </div>
                 ))}
             </div>
        )}
      </div>
    </main>
  );
}
