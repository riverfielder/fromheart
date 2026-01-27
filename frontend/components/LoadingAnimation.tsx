import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  loading: boolean;
}

export default function LoadingAnimation({ loading }: LoadingAnimationProps) {
  const [loadingText, setLoadingText] = useState("推演中");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      const texts = [
        "沐浴焚香",
        "诚心起卦",
        "推演天机",
        "撰写卦辞",
        "云开雾散",
      ];
      let i = 0;
      setLoadingText(texts[0]);
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        if (i === texts.length - 1) clearInterval(interval); // Stop at last step
        setLoadingText(texts[i]);
      }, 3000); // Change every 3 seconds
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <span className="flex items-center gap-2">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="inline-block w-4 h-4"
      >
        <Image
          src="/bagua.svg"
          alt="loading"
          width={16}
          height={16}
          className="opacity-80"
        />
      </motion.span>
      <span>{loadingText}...</span>
    </span>
  );
}
