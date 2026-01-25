"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getHistory } from "../../lib/api";

type Divination = {
  ID: number;
  BenGua: string;
  BianGua: string;
  CreatedAt: string;
};

export default function HistoryPage() {
  const [items, setItems] = useState<Divination[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = "fh_device";
    const deviceHash = window.localStorage.getItem(key) || "anonymous";
    getHistory(deviceHash)
      .then((res) => setItems(res.items || []))
      .catch(() => setError("加载失败"));
  }, []);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">历史记录</h1>
        <p className="text-sm text-gray-500">近 20 条</p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-gray-500">暂无记录</li>
        )}
        {items.map((item) => (
          <li key={item.ID} className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-600">
              {new Date(item.CreatedAt).toLocaleDateString()}
            </p>
            <p className="text-base">
              {item.BenGua} → {item.BianGua}
            </p>
            <Link className="text-sm text-emerald-700" href={`/divination/${item.ID}`}>
              查看详情
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}