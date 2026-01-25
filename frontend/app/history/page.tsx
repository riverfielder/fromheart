import Link from "next/link";

export default function HistoryPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">历史记录</h1>
        <p className="text-sm text-gray-500">近 20 条</p>
      </header>

      <ul className="space-y-3">
        <li className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">2026-01-25</p>
          <p className="text-base">是否应该开始新的计划？</p>
          <Link className="text-sm text-emerald-700" href="/divination/1">
            查看详情
          </Link>
        </li>
      </ul>
    </main>
  );
}