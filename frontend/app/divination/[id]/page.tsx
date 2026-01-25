export default function DivinationDetailPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">卦象详情</h1>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
        <div className="text-sm text-gray-500">本卦 / 变卦 / 动爻</div>
        <div className="text-lg">乾 → 坤 · 动爻 3</div>
        <div className="text-sm text-gray-700">断语：守中不躁，静待时机。</div>
      </section>

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