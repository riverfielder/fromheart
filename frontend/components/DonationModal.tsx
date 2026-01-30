import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface DonationModalProps {
  show: boolean;
  onClose: () => void;
  blessing: string | null;
}

export default function DonationModal({ show, onClose, blessing }: DonationModalProps) {
  const [showQR, setShowQR] = useState<"none" | "wechat" | "alipay">("none");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-6 text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-serif text-emerald-800">
              福源广进
            </h3>

            {blessing ? (
              <p className="text-stone-600 font-serif text-lg leading-loose italic">
                {blessing}
              </p>
            ) : (
              <p className="text-gray-400 text-sm animate-pulse">
                送诗一句...
              </p>
            )}

            <div className="pt-4 space-y-4">
              <button
                onClick={() =>
                  setShowQR(showQR === "wechat" ? "none" : "wechat")
                }
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-emerald-200 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                <span>🙏</span> 施舍香火以获福源
              </button>

              <AnimatePresence mode="wait">
                {showQR !== "none" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-center gap-4 mb-4 text-xs font-medium text-gray-500">
                      <button
                        onClick={() => setShowQR("wechat")}
                        className={`${
                          showQR === "wechat"
                            ? "text-emerald-600 border-b-2 border-emerald-600"
                            : ""
                        } pb-1`}
                      >
                        微信支付
                      </button>
                      <button
                        onClick={() => setShowQR("alipay")}
                        className={`${
                          showQR === "alipay"
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : ""
                        } pb-1`}
                      >
                        支付宝
                      </button>
                    </div>

                    <div className="relative w-48 h-48 mx-auto bg-gray-50 rounded-lg p-2 border border-gray-100">
                      {showQR === "wechat" && (
                        <Image
                          src="/weixin.png"
                          alt="WeChat Pay"
                          fill
                          className="object-contain"
                        />
                      )}
                      {showQR === "alipay" && (
                        <Image
                          src="/zfb.jpg"
                          alt="Alipay"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      心诚则灵，随缘施舍
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
