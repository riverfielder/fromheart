"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getDivination } from "../../../lib/api";
import { Divination } from "../../../types";

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
            <div className="flex items-center space-x-3 text-lg font-serif">
              <span>{data.BenGua}</span>
              <span className="text-stone-300">→</span>
              <span>{data.BianGua}</span>
              {data.ChangingLines && (
                <>
                  <span className="text-stone-300">·</span>
                  <span className="text-emerald-600">{data.ChangingLines}</span>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-stone-100">
               <p className="text-stone-600 leading-7 whitespace-pre-wrap">{data.FinalOutput}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}