// app/learn/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard, { Vocabulary } from '@/components/Flashcard';
import FlashcardStudy from '@/components/FlashcardStudy';
import Link from 'next/link';

export default function LearnPage() {
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // State quản lý chế độ: 'learn' (lật thẻ), 'typing' (nhập nghĩa), 'speech' (đọc)
  const [mode, setMode] = useState<'learn' | 'typing' | 'speech'>('learn');

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

  const categories = useMemo(() => {
    const cats = new Set(vocabList.map((v) => v.category_id).filter(Boolean));
    return Array.from(cats) as string[];
  }, [vocabList]);

  const filteredVocab = useMemo(() => {
    if (selectedCategory === 'all') return vocabList;
    return vocabList.filter((v) => v.category_id === selectedCategory);
  }, [vocabList, selectedCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex(0);
  }, [selectedCategory]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Đang tải thẻ học...</div>;
  }

  if (vocabList.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Bạn chưa có từ vựng nào!</h2>
        <Link href="/vocab/add" className="inline-block px-6 py-3 bg-black text-white font-bold rounded-2xl">
          + Thêm từ mới ngay
        </Link>
      </div>
    );
  }

  // NẾU ĐANG Ở CHẾ ĐỘ KIỂM TRA (VIẾT HOẶC ĐỌC)
  if (mode !== 'learn') {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setMode('learn')}
            className="text-blue-600 font-bold hover:underline flex items-center gap-2"
          >
            ← Quay lại chọn chủ đề
          </button>
          <span className="font-bold text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            Đang ôn tập: {selectedCategory === 'all' ? 'Tất cả từ vựng' : selectedCategory}
          </span>
        </div>
        
        {/* Truyền mode vào FlashcardStudy để hiển thị giao diện tương ứng */}
        <FlashcardStudy 
          initialVocabs={filteredVocab} 
          testMode={mode} 
        />
      </main>
    );
  }

  // NẾU Ở CHẾ ĐỘ HỌC LẬT THẺ BÌNH THƯỜNG
  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* HEADER: Nút quay lại & 2 Nút kiểm tra */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/vocab" className="text-blue-600 font-bold hover:underline">
          ← Về sổ từ vựng
        </Link>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setMode('speech')}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-xl transition-all border border-blue-200"
          >
            🎙️ Kiểm tra đọc
          </button>
          <button
            onClick={() => setMode('typing')}
            className="flex-1 sm:flex-none px-6 py-3 bg-green-500 text-white hover:bg-green-600 font-bold rounded-xl shadow-md transition-all"
          >
            🎯 Bắt đầu Kiểm Tra
          </button>
        </div>
      </div>

      {/* DROPDOWN CHỌN CHỦ ĐỀ */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4">
        <span className="font-bold text-gray-700 whitespace-nowrap">📚 Chọn chủ đề:</span>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold outline-none focus:border-black"
        >
          <option value="all">Tất cả từ vựng ({vocabList.length} từ)</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({vocabList.filter((v) => v.category_id === cat).length} từ)
            </option>
          ))}
        </select>
      </div>

      {/* BỘ LẬT THẺ CHÍNH */}
      <div className="space-y-4">
        <div className="text-center font-bold text-gray-400 text-sm">
          Thẻ {currentIndex + 1} / {filteredVocab.length}
        </div>
        
        <Flashcard
          vocab={filteredVocab[currentIndex]}
          onNext={() => setCurrentIndex((prev) => (prev < filteredVocab.length - 1 ? prev + 1 : 0))}
          onPrev={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredVocab.length - 1))}
        />
      </div>
    </main>
  );
}