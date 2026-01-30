"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getHistory, HistoryItem } from "../../lib/api";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = "fh_device";
    const deviceHash = window.localStorage.getItem(key) || "anonymous";
    getHistory(deviceHash)
      .then((res) => setItems(res.items || []))
      .catch(() => setError("加载失败"));
  }, []);

  return (
    <main className="space-y-6 pt-8 px-4 max-w-lg mx-auto min-h-screen pb-12">
      <header className="flex justify-between items-baseline mb-6 border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-serif text-stone-800 tracking-wider">历史记录</h1>
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
            ← 返回
        </Link>
      </header>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <ul className="space-y-4">
        {items.length === 0 && (
          <li className="text-center py-12 text-stone-400 text-sm font-serif">
             暂无机缘<br/>请往首页一问
          </li>
        )}
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'love' ? 'bg-pink-100 text-pink-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {item.type === 'love' ? '🌸 桃花' : '🍃 一问'}
                </span>
                <span className="text-xs text-stone-400 font-serif">
                   {new Date(item.date).toLocaleDateString()}
                </span>
            </div>
            
            <h3 className="text-lg font-medium text-stone-800 line-clamp-1 mb-1 font-serif">
                {item.title || "无题"}
            </h3>
            
            <p className="text-sm text-stone-500 mb-3">
              {item.summary}
            </p>
            
            <div className="text-right">
                <Link 
                    className={`text-sm tracking-widest font-serif ${item.type === 'love' ? 'text-pink-500 hover:text-pink-600' : 'text-emerald-600 hover:text-emerald-700'}`} 
                    href={item.type === 'love' ? `/love/${item.id}` : `/divination/${item.id}`}
                >
                查看推演 →
                </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}