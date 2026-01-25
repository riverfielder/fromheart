"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getDivination } from "../../lib/api";

type Divination = {
  ID: number;
  BenGua: string;
  BianGua: string;
  ChangingLines: string;
  FinalOutput: string;
};

export default function DivinationDetailPage() {
  const params = useParams();
  const [data, setData] = useState<Divination | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) return;
    getDivination(id)
      .then((res) => setData(res))
      .catch(() => setError("加载失败"));
  }, [params]);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">卦象详情</h1>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
          <div className="text-sm text-gray-500">本卦 / 变卦 / 动爻</div>
          <div className="text-lg">
            {data.BenGua} → {data.BianGua} · {data.ChangingLines}
          </div>
          <div className="text-sm text-gray-700">断语：{data.FinalOutput}</div>
        </section>
      )}

      <section className="bg-jade rounded-2xl p-6">
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>行动建议：放慢节奏</li>
          <li>行动建议：先稳后动</li>
          <li>忌讳：避免冲动</li>
        </ul>
      </section>
    </main>
  );
}