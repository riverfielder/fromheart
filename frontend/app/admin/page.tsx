"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminQuestions } from "../../lib/api";
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

export default function AdminPage() {
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const secret = window.localStorage.getItem("fh_secret");
    if (!secret || secret !== "loveriver") {
      router.push("/");
      return;
    }

    getAdminQuestions(secret)
      .then((res) => setItems(res.items || []))
      .catch((err) => setError("Authentication failed or server error"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen p-8 bg-stone-50 font-serif">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-stone-800">万象镜 (Admin)</h1>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
            Current Date: 2026-01-27
          </Link>
        </header>

        {loading && <div className="text-center text-stone-500 py-10">Searching the cosmos...</div>}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <p className="text-right text-xs text-stone-400">Total: {items.length}</p>
            {items.map((item) => (
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
      </div>
    </main>
  );
}
