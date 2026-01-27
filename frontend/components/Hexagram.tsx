import React from 'react';

// Trigram structures: [Top, Middle, Bottom]
// Based on binary values where Bottom is LSB.
// Qian (111=7) -> [1,1,1]
// Dui (011=3)  -> [0,1,1]
// Li (101=5)   -> [1,0,1]
// Zhen (001=1) -> [0,0,1]
// Xun (110=6)  -> [1,1,0]
// Kan (010=2)  -> [0,1,0]
// Gen (100=4)  -> [1,0,0]
// Kun (000=0)  -> [0,0,0]
const TRIGRAMS = [
  null,
  [1, 1, 1], // 1: Qian
  [0, 1, 1], // 2: Dui
  [1, 0, 1], // 3: Li
  [0, 0, 1], // 4: Zhen
  [1, 1, 0], // 5: Xun
  [0, 1, 0], // 6: Kan
  [1, 0, 0], // 7: Gen
  [0, 0, 0], // 8: Kun
];

// Matrix [Upper][Lower] -> Name
// Indexes are 0-based in array, corresponding to Trigram ID 1-8
const HEXAGRAM_LOOKUP = [
  ["乾", "履", "同人", "无妄", "姤", "讼", "遁", "否"],
  ["夬", "兑", "革", "随", "大过", "困", "咸", "萃"],
  ["大有", "睽", "离", "噬嗑", "鼎", "未济", "旅", "晋"],
  ["大壮", "归妹", "丰", "震", "恒", "解", "小过", "豫"],
  ["小畜", "中孚", "家人", "益", "巽", "涣", "渐", "观"],
  ["需", "节", "既济", "屯", "井", "坎", "蹇", "比"],
  ["大畜", "损", "贲", "颐", "蛊", "蒙", "艮", "剥"],
  ["泰", "临", "明夷", "复", "升", "师", "谦", "坤"],
];

const NAME_TO_STRUCTURE: Record<string, number[]> = {};

// Build map
HEXAGRAM_LOOKUP.forEach((row, upperIdx) => {
    row.forEach((name, lowerIdx) => {
        // upperIdx is 0-7, corresponds to TRIGRAMS[upperIdx+1]
        const upper = TRIGRAMS[upperIdx + 1];
        const lower = TRIGRAMS[lowerIdx + 1];
        if (upper && lower) {
            NAME_TO_STRUCTURE[name] = [...upper, ...lower];
        }
    });
});

export default function Hexagram({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) {
    const lines = NAME_TO_STRUCTURE[name];
    if (!lines) return <div className="text-xs text-red-500">Unknown Hexagram</div>;
    
    // Size configs
    const w = size === "sm" ? "w-8" : size === "md" ? "w-12" : "w-16";
    const h = size === "sm" ? "h-1" : size === "md" ? "h-2" : "h-3";
    const gap = size === "sm" ? "gap-[2px]" : size === "md" ? "gap-1" : "gap-1.5";

    return (
        <div className={`flex flex-col ${gap} ${w} bg-white/50 p-1 rounded`}>
            {lines.map((isYang, i) => (
                <div key={i} className={`${h} w-full flex justify-between`}>
                    {isYang === 1 ? (
                        <div className="w-full bg-stone-800 rounded-sm"></div>
                    ) : (
                         <>
                            <div className="w-[42%] bg-stone-800 rounded-sm"></div>
                            <div className="w-[42%] bg-stone-800 rounded-sm"></div>
                         </>
                    )}
                </div>
            ))}
        </div>
    );
}
