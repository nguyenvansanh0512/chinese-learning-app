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

  // State phân trang & số lượng dòng hiển thị động
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4); // Mặc định là 4

  // LẮNG NGHE KÍCH THƯỚC MÀN HÌNH ĐỂ TỰ ĐỘNG ĐIỀU CHỈNH SỐ LƯỢNG TỪ/TRANG
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        setItemsPerPage(4); // Điện thoại
      } else if (width < 1024) {
        setItemsPerPage(6); // Tablet
      } else if (height > 900) {
        setItemsPerPage(10); // Desktop cao/màn hình lớn
      } else {
        setItemsPerPage(8); // Laptop/Desktop chuẩn
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // LẤY DỮ LIỆU TỪ SUPABASE
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

  // THAO TÁC XÓA TỪ
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ vựng này khỏi sổ tay?')) return;

    const { error } = await supabase.from('vocabularies').delete().eq('id', id);
    if (!error) {
      setVocabList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // PHÁT ÂM TỪ VỰNG
  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // THỐNG KÊ THEO CHỦ ĐỀ
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

  // LỌC DANH SÁCH THEO CHỦ ĐỀ VÀ TỪ KHÓA TÌM KIẾM
  const filteredList = useMemo(() => {
    return vocabList.filter((item) => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'Chưa phân loại') {
          if (item.category_id && item.category_id.trim() !== '') return false;
        } else if (item.category_id !== selectedCategory) {
          return false;
        }
      }

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

  // TÍNH TOÁN PHÂN TRANG AN TOÀN (SAFE PAGE - TRÁNH LỖI ESLINT)
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  // CẮT DANH SÁCH HIỂN THỊ
  const paginatedList = filteredList.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* HEADER TRANG & NÚT TẠO TỪ */}
      

      {/* TỔNG QUAN THỐNG KÊ THEO CHỦ ĐỀ & THANH LỌC TAB */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Thống kê theo chủ đề
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Làm mới bộ lọc
            </button>
          )}
        </div>

        {/* THẺ TABS CÁC CHỦ ĐỀ */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
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
              onClick={() => {
                setSelectedCategory(cat.name);
                setCurrentPage(1);
              }}
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
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Ô Nhập Tìm Kiếm */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <span className="text-gray-400 pl-2">🔍</span>
          <input
            type="text"
            placeholder="Tìm chữ Hán, Pinyin, nghĩa tiếng Việt, ví dụ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
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
          /* KHUNG CÓ CUỘN DỌC TỰ ĐỘNG NẾU QUÁ CAO (max-h-[60vh] + overflow-y-auto) */
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border-b border-gray-100">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                <tr className="text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 pl-6">Chữ Hán & Pinyin</th>
                  <th className="p-4">Chủ Đề</th>
                  <th className="p-4">Nghĩa Tiếng Việt</th>
                  <th className="p-4">Câu Ví Dụ</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
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

                    <td className="p-4">
                      {item.category_id ? (
                        <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px] rounded-full">
                          📁 {item.category_id}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">-</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-slate-800 text-base">
                      {item.meaning_vi}
                    </td>

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

        {/* BỘ ĐIỀU HƯỚNG PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 flex justify-between items-center text-sm mt-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              ← Trang trước
            </button>
            <div className="text-center space-y-0.5">
              <span className="text-gray-500 font-semibold text-xs block">
                Trang <span className="font-black text-black text-sm">{safePage}</span> / {totalPages}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                ({itemsPerPage} từ/trang)
              </span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}