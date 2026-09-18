// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setErrorMsg('Sai email hoặc mật khẩu!');
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-xl space-y-6 text-gray-800">
        <div className="text-center space-y-1">
          <div className="text-4xl">🔑</div>
          <h1 className="text-2xl font-black text-slate-800">Đăng Nhập</h1>
          <p className="text-xs text-gray-500">Truy cập bộ từ vựng cá nhân của bạn</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-blue-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-blue-600 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </main>
  );
}