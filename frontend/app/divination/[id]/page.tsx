"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getDivination } from "../../../lib/api";
import { Divination, Output } from "../../../types";
import Hexagram from "../../../components/Hexagram";

export default function DivinationDetailPage() {
  const params = useParams();
  const [data, setData] = useState<Divination | null>(null);
  const [parsedRaw, setParsedRaw] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) return;
    getDivination(id)
      .then((res) => {
        setData(res);
        if (res.RawOutput) {
          try {
            const parsed = JSON.parse(res.RawOutput);
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
            <div className="flex items-center space-x-6 text-lg font-serif">
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
            {data.ChangingLines && (
               <div className="text-sm text-emerald-600 mt-2">
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
        </div>
      )}
    </main>
  );
}