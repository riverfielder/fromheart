"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getMe, updateProfile, logout } from "../../lib/api";
import { User } from "../../types";

const ZODIACS = [
  "白羊座", "金牛座", "双子座", "巨蟹座",
  "狮子座", "处女座", "天秤座", "天蝎座",
  "射手座", "摩羯座", "水瓶座", "双鱼座"
];

const MBTIS = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    birth_date: "",
    gender: "",
    zodiac: "",
    mbti: "",
  });

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setForm({
          birth_date: u.birth_date || "",
          gender: u.gender || "",
          zodiac: u.zodiac || "",
          mbti: u.mbti || "",
        });
      })
      .catch(() => router.push("/login")) // Redirect if not logged in
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setToast("个人命理档案已更新");
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-400 font-serif">加载中...</div>;
  }

  return (
    <main className="min-h-screen bg-[#F6F7F9] p-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="fixed top-0 left-0 w-full h-full z-0 opacity-10 pointer-events-none bg-[url('/bagua.svg')] bg-no-repeat bg-[center_top_10%] bg-[length:500px_500px]" />

        <div className="max-w-md mx-auto relative z-10">
            <header className="mb-8 flex items-center justify-between">
                <Link href="/" className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-stone-200/50 text-stone-600 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 text-sm font-serif">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                   <span className="pr-1">返回</span>
                </Link>
                <h1 className="text-xl font-serif text-stone-800 tracking-widest font-bold">命理档案</h1>
                <div className="w-12"></div>
            </header>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-white/50 space-y-8">
                <div className="text-center space-y-2 pb-6 border-b border-stone-100">
                    <div className="w-16 h-16 bg-stone-100 rounded-full mx-auto flex items-center justify-center text-2xl border border-stone-200">
                        👤
                    </div>
                    <h2 className="text-lg font-bold text-stone-700">{user?.username}</h2>
                    <p className="text-xs text-stone-400 font-serif">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">已登录</span>
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Birth Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">生辰 (八字推演基础)</label>
                        <input 
                            type={form.birth_date ? "datetime-local" : "text"}
                            placeholder="年/月/日 时:分"
                            onFocus={(e) => e.currentTarget.type = "datetime-local"}
                            onBlur={(e) => {
                                if (!e.currentTarget.value) e.currentTarget.type = "text";
                            }}
                            value={form.birth_date}
                            onChange={e => setForm({...form, birth_date: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-all font-serif placeholder:text-stone-400"
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                         <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">性别 (阴阳取象)</label>
                         <div className="flex gap-4">
                            {["male", "female"].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setForm({...form, gender: g})}
                                    className={`flex-1 py-3 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                                        form.gender === g 
                                        ? "bg-stone-800 text-white border-stone-800 shadow-md" 
                                        : "bg-white text-stone-400 border-stone-200 hover:bg-stone-50"
                                    }`}
                                >
                                    <span className="text-xl">{g === "男" ? "♂" : "♀"}</span>
                                    <span className="text-sm font-serif">{g}</span>
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* Zodiac */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">星座 (星盘归属)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ZODIACS.map(z => (
                                <button
                                    key={z}
                                    onClick={() => setForm({...form, zodiac: z})}
                                    className={`py-2 rounded-lg text-xs font-serif transition-all border ${
                                        form.zodiac === z
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-white text-stone-500 border-stone-100 hover:bg-stone-50 hover:border-stone-200"
                                    }`}
                                >
                                    {z}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MBTI */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">MBTI (心性类别)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {MBTIS.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setForm({...form, mbti: m})}
                                    className={`py-2 rounded-lg text-[10px] font-medium tracking-wider transition-all border ${
                                        form.mbti === m
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-white text-stone-500 border-stone-100 hover:bg-stone-50 hover:border-stone-200"
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200/50 font-medium tracking-wide hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {saving ? "保存中..." : "保存命理档案"}
                    </button>
                    <p className="text-[10px] text-center text-stone-400 mt-4 leading-relaxed">
                        您的信息仅用于当次卜卦的定制化解读<br/>这也是大师“更懂你”的关键
                    </p>
                </div>

                {/* New Feature Promo */}
                <div className="mt-8 relative group cursor-pointer overflow-hidden rounded-xl" onClick={() => router.push('/report')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-90 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    <div className="relative p-5 flex items-center justify-between text-white">
                        <div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <span>🔮</span> 灵魂画像生成器
                            </div>
                            <div className="text-[10px] opacity-80 mt-1">基于MBTI与星盘的深度解析</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                            →
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                 <button 
                    onClick={async () => {
                        await logout();
                        window.location.href = "/";
                    }}
                    className="text-xs text-stone-400 hover:text-red-400 transition-colors border-b border-dashed border-stone-200 hover:border-red-200 pb-0.5"
                 >
                    退出登录
                 </button>
            </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-xl z-50 flex items-center gap-2"
                >
                    <span>✨</span> {toast}
                </motion.div>
            )}
        </AnimatePresence>
    </main>
  );
}
