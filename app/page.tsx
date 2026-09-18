// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [totalVocab, setTotalVocab] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { count } = await supabase
          .from('vocabularies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (count !== null) setTotalVocab(count);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400 bg-white">
        Đang tải dữ liệu...
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 bg-white">
      {/* Banner Chào Mừng Tone Xanh - Tím Nổi Bật Trên Nền Trắng */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-md flex flex-col md:flex-row justify-between items-center">
        <div className="space-y-2 text-center md:text-left mb-6 md:mb-0">
          <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
            🔥 Chuỗi học tập: 1 Ngày liên tiếp
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {user ? `Xin chào, ${user.email?.split('@')[0]}!` : 'Hệ Thống Học Tiếng Trung Ghi Nhớ Sâu'}
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Ôn tập từ vựng mỗi ngày bằng phương pháp Lặp lại ngắt quãng (SRS), tự động tạo Pinyin và luyện phát âm chuẩn.
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            href={user ? "/learn" : "/login"}
            className="px-6 py-3.5 bg-white text-blue-600 font-extrabold rounded-2xl shadow-sm hover:bg-blue-50 transition-all active:scale-95 text-sm"
          >
            🎴 Học Flashcard Ngay
          </Link>
          <Link
            href={user ? "/vocab/add" : "/login"}
            className="px-6 py-3.5 bg-blue-700/50 hover:bg-blue-700 text-white font-extrabold rounded-2xl backdrop-blur-md transition-all active:scale-95 text-sm"
          >
            ➕ Thêm Từ Vựng
          </Link>
        </div>
      </div>

      {/* Grid Thống Kê 3 Cột (Viền Mỏng Trên Nền Trắng) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl text-2xl">📚</div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Tổng từ vựng đã lưu</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalVocab} Từ</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl text-2xl">🎯</div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Từ cần ôn hôm nay</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalVocab} Từ</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-2xl">🏆</div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Trạng thái hệ thống</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">Sẵn sàng</h3>
          </div>
        </div>
      </div>

      {/* Lối Tắt Các Chức Năng Main */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href={user ? "/learn" : "/login"}
          className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl text-2xl">🎴</div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Giao Diện Ôn Tập Flashcard
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Hỗ trợ phím tắt bàn phím (Space để lật, phím 1-4 để đánh giá) và phát âm chuẩn.
            </p>
          </div>
          <span className="text-xl font-bold text-gray-300 group-hover:text-blue-600 transition-colors">➔</span>
        </Link>

        <Link
          href={user ? "/vocab/add" : "/login"}
          className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-green-200 transition-all flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="p-3 bg-green-50 text-green-600 w-fit rounded-2xl text-2xl">✍️</div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-green-600 transition-colors">
              Bộ Công Cụ Nhập Từ Thông Minh
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Tự động phân tích và tạo Pinyin có dấu ngay khi gõ Chữ Hán.
            </p>
          </div>
          <span className="text-xl font-bold text-gray-300 group-hover:text-green-600 transition-colors">➔</span>
        </Link>
      </div>
    </main>
  );
}