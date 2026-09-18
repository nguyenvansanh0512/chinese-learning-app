// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Đặt useEffect LÊN TRƯỚC các câu lệnh return sớm
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 🔴 SỬA LỖI: Dòng kiểm tra trang để return null PHẢI ĐẶT DƯỚI TẤT CẢ HOOKS
  if (pathname === '/login' || pathname === '/register') return null;

  const navLinks = [
    { label: 'Trang Chủ', href: '/' },
    { label: 'Ôn Tập Flashcard', href: '/learn' },
    { label: 'Thêm Từ Mới', href: '/vocab/add' },
    { label: 'Sổ Từ Vựng', href: '/vocab' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
            中
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Học Tiếng Trung Web</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                ✉️ {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3.5 py-2 rounded-xl transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-xs text-gray-700 hover:text-blue-600 font-bold px-3.5 py-2 rounded-xl"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}