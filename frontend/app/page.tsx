import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">一问</h1>
        <p className="text-sm text-gray-500">from heart · 每日只问一题</p>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <label className="text-sm text-gray-600">今日问题</label>
        <textarea
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          rows={4}
          placeholder="写下今天唯一的问题"
        />
        <button className="bg-emerald-600 text-white px-5 py-2 rounded-xl">
          今日问
        </button>
      </section>

      <section className="bg-jade rounded-2xl p-6 space-y-2">
        <p className="text-sm">卦象结果将展示在这里。</p>
        <p className="text-xs text-gray-500">仅供参考，不构成现实决策依据。</p>
      </section>

      <div>
        <Link className="text-sm text-emerald-700" href="/history">
          查看历史记录 →
        </Link>
      </div>
    </main>
  );
}