"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { askQuestion, getDailyPoem } from "../lib/api";

type Output = {
  summary: string;
  advice: string[];
  warnings: string[];
  keywords: string[];
  raw: string;
};

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [deviceHash, setDeviceHash] = useState("anonymous");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Output | null>(null);
  const [divinationId, setDivinationId] = useState<number | null>(null);
  const [poem, setPoem] = useState<string | null>(null);

  useEffect(() => {
    getDailyPoem().then((res) => setPoem(res.poem)).catch(() => {});

    const key = "fh_device";
    const stored = window.localStorage.getItem(key);
    if (stored) {
      setDeviceHash(stored);
      return;
    }
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fh_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, generated);
    setDeviceHash(generated);
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("请输入问题");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await askQuestion(question.trim(), deviceHash);
      setResult(res.result);
      setDivinationId(res.divination_id);
    } catch {
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">一问</h1>
        <p className="text-sm text-gray-500">from heart</p>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <label className="text-sm text-gray-600">今日问题</label>
        <textarea
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          rows={4}
          placeholder="写下今天唯一的问题"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="bg-emerald-600 text-white px-5 py-2 rounded-xl disabled:opacity-50"
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? "推演中" : "今日问"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>

      <section className="bg-jade rounded-2xl p-6 space-y-3">
        {!result ? (
          <p className="text-sm">卦象结果将展示在这里。</p>
        ) : (
          <>
            <p className="text-sm">{result.summary}</p>
            <div className="text-xs text-gray-600">
              关键词：{result.keywords.join(" · ")}
            </div>
            <ul className="text-xs text-gray-700 list-disc list-inside">
              {result.advice.map((item) => (
                <li key={item}>建议：{item}</li>
              ))}
              {result.warnings.map((item) => (
                <li key={item}>忌讳：{item}</li>
              ))}
            </ul>
            {divinationId && (
              <Link className="text-sm text-emerald-700" href={`/divination/${divinationId}`}>
                查看详情 →
              </Link>
            )}
          </>
        )}
        <p className="text-xs text-gray-500">仅供参考，不构成现实决策依据。</p>
      </section>

      <div>
        <Link className="text-sm text-emerald-700" href="/history">
          查看历史记录 →
        </Link>
      </div>

      {poem && (
        <footer className="mt-12 text-center space-y-2">
            <div className="w-16 h-px bg-gray-200 mx-auto"></div>
            <p className="text-xs text-gray-400 font-serif whitespace-pre-line leading-relaxed italic">
                {poem}
            </p>
        </footer>
      )}
    </main>
  );
}