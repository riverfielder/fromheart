'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError('登录失败，请检查用户名或密码');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-serif text-ink-900 mb-8 text-center text-stone-800">登录</h1>
      {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-stone-500 focus:border-stone-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-stone-500 focus:border-stone-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500"
        >
          登录
        </button>
      </form>
      <div className="mt-6 text-center text-sm font-serif">
         <p className="text-stone-500 mb-2">
            登录并完善档案，解锁基于<span className="text-emerald-700 font-bold">生辰八字</span>与<span className="text-emerald-700 font-bold">心性</span>的专属命理推演。
         </p>
         <p className="text-stone-500">
             还没有账号? <Link href="/register" className="text-stone-800 underline">注册</Link>
         </p>
      </div>
    </div>
  );
}
