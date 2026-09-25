// app/vocab/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Vocabulary } from '@/components/Flashcard';
import Link from 'next/link';

export default function VocabListPage() {
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocab = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setVocabList(data as Vocabulary[]);
      setLoading(false);
    };

    fetchVocab();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ vựng này khỏi sổ tay?')) return;

    const { error } = await supabase.from('vocabularies').delete().eq('id', id);
    if (!error) {
      setVocabList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Thống kê số lượng từ vựng gom nhóm theo chủ đề
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    let uncategorizedCount = 0;

    vocabList.forEach((item) => {
      const cat = item.category_id?.trim();
      if (cat) {
        stats[cat] = (stats[cat] || 0) + 1;
      } else {
        uncategorizedCount++;
      }
    });

    const list = Object.entries(stats).map(([name, count]) => ({ name, count }));
    if (uncategorizedCount > 0) {
      list.push({ name: 'Chưa phân loại', count: uncategorizedCount });
    }
    return list;
  }, [vocabList]);

  // Lọc danh sách theo chủ đề và từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    return vocabList.filter((item) => {
      // 1. Lọc theo chủ đề được chọn
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'Chưa phân loại') {
          if (item.category_id && item.category_id.trim() !== '') return false;
        } else if (item.category_id !== selectedCategory) {
          return false;
        }
      }

      // 2. Lọc theo từ khóa tìm kiếm
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      return (
        item.hanzi.includes(term) ||
        item.pinyin?.toLowerCase().includes(term) ||
        item.meaning_vi?.toLowerCase().includes(term) ||
        item.example_sentence?.toLowerCase().includes(term) ||
        item.example_pinyin?.toLowerCase().includes(term) ||
        item.example_meaning?.toLowerCase().includes(term)
      );
    });
  }, [vocabList, selectedCategory, searchTerm]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* HEADER TRANG & NÚT TẠO TỪ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📚 Sổ Từ Vựng Cá Nhân</h1>
          <p className="text-xs text-gray-500 mt-1">
            Tổng cộng <span className="font-bold text-slate-800">{vocabList.length} từ vựng</span> chia trong{' '}
            <span className="font-bold text-blue-600">
              {categoryStats.filter((c) => c.name !== 'Chưa phân loại').length} chủ đề
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link
            href="/learn"
            className="flex-1 md:flex-none px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all text-center"
          >
            🎯 Học Flashcard
          </Link>
          <Link
            href="/vocab/add"
            className="flex-1 md:flex-none px-5 py-3 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all text-center"
          >
            + Thêm Từ Mới
          </Link>
        </div>
      </div>

      {/* TỔNG QUAN THỐNG KÊ THEO CHỦ ĐỀ & THANH LỌC TAB */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Thống kê theo chủ đề
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Làm mới bộ lọc
            </button>
          )}
        </div>

        {/* THẺ TABS CÁC CHỦ ĐỀ */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              selectedCategory === 'all'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {vocabList.length}
            </span>
          </button>

          {categoryStats.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedCategory === cat.name
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>📁 {cat.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  selectedCategory === cat.name
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* THANH TÌM KIẾM & BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
        
        {/* Ô Nhập Tìm Kiếm */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <span className="text-gray-400 pl-2">🔍</span>
          <input
            type="text"
            placeholder="Tìm chữ Hán, Pinyin, nghĩa tiếng Việt, ví dụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold px-2"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Nội dung Bảng */}
        {loading ? (
          <p className="text-center text-xs text-gray-400 py-16">Đang tải sổ từ vựng...</p>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🔍</p>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy từ vựng nào</p>
            <p className="text-xs text-gray-400">
              Thử tìm với từ khóa khác hoặc bỏ lọc theo chủ đề hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 pl-6">Chữ Hán & Pinyin</th>
                  <th className="p-4">Chủ Đề</th>
                  <th className="p-4">Nghĩa Tiếng Việt</th>
                  <th className="p-4">Câu Ví Dụ</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* CHỮ HÁN & PINYIN */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => playAudio(item.hanzi)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all text-xs"
                          title="Nghe đọc"
                        >
                          🔊
                        </button>
                        <div>
                          <div className="font-black text-2xl text-black tracking-wide">
                            {item.hanzi}
                          </div>
                          <div className="text-xs font-bold text-blue-600">{item.pinyin}</div>
                        </div>
                      </div>
                    </td>

                    {/* CHỦ ĐỀ / CATEGORY */}
                    <td className="p-4">
                      {item.category_id ? (
                        <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px] rounded-full">
                          📁 {item.category_id}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">-</span>
                      )}
                    </td>

                    {/* NGHĨA TIẾNG VIỆT */}
                    <td className="p-4 font-bold text-slate-800 text-base">
                      {item.meaning_vi}
                    </td>

                    {/* CÂU VÍ DỤ */}
                    <td className="p-4 max-w-md">
                      {item.example_sentence ? (
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-gray-100">
                          <p className="font-bold text-slate-900 text-xs">
                            {item.example_sentence}
                          </p>
                          {item.example_pinyin && (
                            <p className="text-[11px] text-blue-600 font-medium">
                              {item.example_pinyin}
                            </p>
                          )}
                          {item.example_meaning && (
                            <p className="text-[11px] text-gray-500 italic">
                              {item.example_meaning}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>

                    {/* THAO TÁC (XÓA) */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl border border-red-200/50 transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}