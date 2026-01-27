import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Output } from "../types";

interface ResultDisplayProps {
  result: Output | null;
  divinationId: number | null;
}

export default function ResultDisplay({ result, divinationId }: ResultDisplayProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-emerald-800/40 space-y-4">
        <motion.div
          className="relative w-16 h-16 opacity-40"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          <Image src="/bagua.svg" alt="Bagua" fill className="object-contain" />
        </motion.div>
        <p className="text-sm font-serif tracking-widest text-emerald-800/60">
          卦象待显
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="border-b border-emerald-100/60 pb-4 mb-4">
        <p className="text-xl font-serif text-emerald-900 leading-relaxed tracking-wide">
          {result.direct_answer}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-7 text-justify">
          {result.summary}
        </p>

        <div className="flex flex-wrap gap-2">
          {result.keywords.map((k) => (
            <span
              key={k}
              className="px-2.5 py-1 bg-white/60 text-emerald-700 text-xs rounded-full border border-emerald-100/50 shadow-sm"
            >
              {k}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-white/40 p-3 rounded-xl border border-white/50">
            <h3 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
              建议
            </h3>
            <ul className="space-y-1">
              {result.advice.map((item) => (
                <li
                  key={item}
                  className="text-xs text-gray-600 flex items-start gap-1.5"
                >
                  <span className="text-emerald-400 mt-0.5">▪</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/40 p-3 rounded-xl border border-white/50">
            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              忌讳
            </h3>
            <ul className="space-y-1">
              {result.warnings.map((item) => (
                <li
                  key={item}
                  className="text-xs text-gray-600 flex items-start gap-1.5"
                >
                  <span className="text-red-300 mt-0.5">▪</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {divinationId && (
          <div className="pt-2 flex justify-end">
            <Link
              className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 group"
              href={`/divination/${divinationId}`}
            >
              查看详情
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
