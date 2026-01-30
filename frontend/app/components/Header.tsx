'use client';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import DonationModal from '../../components/DonationModal';
import { getBlessing } from '../../lib/api';

export default function Header() {
  const { user, logout } = useAuth();
  const [showDonation, setShowDonation] = useState(false);
  const [blessing, setBlessing] = useState<string | null>(null);

  const handleOpenDonation = async () => {
    setShowDonation(true);
    if (!blessing) {
       try {
         const res = await getBlessing();
         setBlessing(res.blessing);
       } catch {}
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8 relative z-50">
        <Link href="/" className="text-xl font-serif font-bold text-ink-800">一问</Link>
        <div className="flex items-center gap-6">
          {/* Navigation Icons - Moved from Home Page */}
          <div className="flex items-center gap-3 mr-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-stone-100/50 shadow-sm">
             {/* Profile Icon */}
             <Link href="/profile" className="group no-underline block">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center justify-center w-8"
                >
                    <span className="text-xl opacity-90 leading-none filter drop-shadow-sm">👤</span>
                    <span className="text-[9px] text-stone-500 font-serif -mt-0.5 transform scale-90">命理</span>
                </motion.div>
             </Link>

             {/* Love Icon */}
             <Link href="/love" className="group block no-underline">
                 <motion.div 
                 whileHover={{ scale: 1.1 }}
                 className="flex flex-col items-center justify-center w-8"
                 >
                     <span className="text-xl opacity-90 leading-none filter drop-shadow-sm">🌸</span>
                     <span className="text-[9px] text-stone-500 font-serif -mt-0.5 transform scale-90">桃花</span>
                 </motion.div>
             </Link>

            {/* Wish Tree Icon */}
            <Link href="/wishing-tree" className="group block no-underline">
                <motion.div 
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center justify-center w-8"
                >
                    <span className="text-xl opacity-90 leading-none filter drop-shadow-sm">🎋</span>
                    <span className="text-[9px] text-stone-500 font-serif -mt-0.5 transform scale-90">祈福</span>
                </motion.div>
            </Link>

            {/* Incense Icon */}
            <motion.div 
                className="group cursor-pointer w-8"
                onClick={handleOpenDonation}
                whileHover={{ scale: 1.1 }}
            >
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xl leading-none filter drop-shadow-sm">🕯️</span>
                    <span className="text-[9px] text-stone-500 font-serif -mt-0.5 transform scale-90">香火</span>
                </div>
            </motion.div>
          </div>

          <div className="text-sm">
            {user ? (
              <div className="flex gap-4 items-center">
                <span className="text-stone-600 font-serif">{user.username}</span>
                <button onClick={logout} className="text-stone-400 hover:text-stone-600 text-xs">登出</button>
              </div>
            ) : (
              <div className="flex gap-4 font-serif">
                <Link href="/login" className="text-stone-500 hover:text-stone-800">登录</Link>
                <Link href="/register" className="text-stone-500 hover:text-stone-800">注册</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <DonationModal 
        show={showDonation} 
        onClose={() => setShowDonation(false)} 
        blessing={blessing} 
      />
    </>
  );
}
