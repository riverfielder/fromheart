'use client';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <Link href="/" className="text-xl font-serif font-bold text-ink-800">一问</Link>
      <div className="text-sm">
        {user ? (
          <div className="flex gap-4 items-center">
            <span className="text-stone-600">{user.username}</span>
            <button onClick={logout} className="text-ink-500 hover:text-ink-800 underline">登出</button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="text-ink-500 hover:text-ink-800">登录</Link>
            <Link href="/register" className="text-ink-500 hover:text-ink-800">注册</Link>
          </div>
        )}
      </div>
    </div>
  );
}
