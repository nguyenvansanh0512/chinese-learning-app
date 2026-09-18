// app/register/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Đăng ký thành công! Đang chuyển hướng...' });
      setTimeout(() => router.push('/'), 1500);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-xl space-y-6 text-gray-800">
        <div className="text-center space-y-1">
          <div className="text-4xl">✨</div>
          <h1 className="text-2xl font-black text-slate-800">Tạo Tài Khoản</h1>
          <p className="text-xs text-gray-500">Bắt đầu lưu trữ từ vựng tiếng Trung</p>
        </div>

        {msg.text && (
          <div
            className={`p-3 text-xs rounded-xl font-medium text-center ${
              msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-blue-600 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang tạo...' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}