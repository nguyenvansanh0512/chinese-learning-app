// app/vocab/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vocabulary } from '@/components/Flashcard';
import Link from 'next/link';

export default function VocabListPage() {
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredList = vocabList.filter((item) => {
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

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* HEADER & THANH TÌM KIẾM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800">📚 Sổ Từ Vựng Cá Nhân</h1>
          <p className="text-xs text-gray-400 mt-1">
            Quản lý toàn bộ {vocabList.length} từ vựng bạn đã lưu vào CSDL
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Tìm chữ Hán, Pinyin, nghĩa, ví dụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 bg-slate-50 border border-gray-200 rounded-2xl text-xs w-full md:w-72 focus:outline-blue-600"
          />
          <Link
            href="/vocab/add"
            className="px-5 py-3 bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-md hover:bg-blue-700 transition-all whitespace-nowrap"
          >
            + Thêm Từ Mới
          </Link>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-xs text-gray-400 py-12">Đang tải sổ từ vựng...</p>
        ) : filteredList.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-12">
            Không tìm thấy từ vựng khớp với từ khóa.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-gray-400 text-xs font-bold uppercase border-b border-gray-100">
                  <th className="p-4 pl-6">Chữ Hán</th>
                  <th className="p-4">Pinyin</th>
                  <th className="p-4">Nghĩa Tiếng Việt</th>
                  <th className="p-4">Câu Ví Dụ & Pinyin</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 pl-6 font-black text-2xl text-slate-800">
                      {item.hanzi}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {item.pinyin}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {item.meaning_vi}
                    </td>
                    <td className="p-4 max-w-md">
                      {item.example_sentence ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-sm">
                            {item.example_sentence}
                          </p>
                          {item.example_pinyin && (
                            <p className="text-xs text-blue-600 font-medium">
                              {item.example_pinyin}
                            </p>
                          )}
                          {item.example_meaning && (
                            <p className="text-xs text-gray-400 italic">
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
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl transition-colors"
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