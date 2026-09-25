// app/learn/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Vocabulary } from '@/components/Flashcard';
import FlashcardViewer from '@/components/FlashcardViewer';
import FlashcardStudy from '@/components/FlashcardStudy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LearnPage() {
  const router = useRouter();
  
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState<'view' | 'study'>('view'); 
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
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

    initPage();
  }, [router]);

  // Lọc ra danh sách danh mục (Chủ đề) duy nhất, bỏ qua các giá trị rỗng/null
  const uniqueTopics = useMemo(() => {
    const topics = vocabList
      .map((v) => v.category_id)
      .filter((t): t is string => Boolean(t && t.trim() !== ''));
    return Array.from(new Set(topics));
  }, [vocabList]);

  // Lọc các từ vựng thuộc chủ đề đã chọn
  const filteredVocabs = useMemo(() => {
    if (selectedTopic === 'all') return vocabList;
    return vocabList.filter((v) => v.category_id === selectedTopic);
  }, [vocabList, selectedTopic]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-400">
        Đang chuẩn bị bộ thẻ Flashcard...
      </main>
    );
  }

  if (vocabList.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="text-6xl">📭</div>
        <h2 className="text-2xl font-bold text-slate-800">Sổ từ vựng của bạn đang trống!</h2>
        <p className="text-gray-500 text-sm">Hãy thêm một vài từ mới trước khi tiến hành ôn tập.</p>
        <Link href="/vocab/add" className="inline-block px-8 py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-lg">
          + Thêm Từ Vựng Mới
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
      
      {/* THANH ĐIỀU HƯỚNG & NÚT ĐỔI CHẾ ĐỘ HỌC */}
      <div className="w-full max-w-2xl flex justify-between items-center text-sm font-semibold text-gray-500 mb-2">
        <Link href="/" className="text-blue-600 hover:underline">← Về trang chủ</Link>
        
        {mode === 'view' ? (
          <button 
            onClick={() => setMode('study')} 
            className="px-5 py-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-xl shadow-md font-bold transition-all flex gap-2"
          >
            <span>🎯</span> Bắt đầu Kiểm Tra
          </button>
        ) : (
          <button 
            onClick={() => setMode('view')} 
            className="px-5 py-2 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white rounded-xl shadow-md font-bold transition-all flex gap-2"
          >
            <span>👀</span> Lướt xem thẻ
          </button>
        )}
      </div>

      {/* THANH CHỌN CHỦ ĐỀ HỌC */}
      <div className="w-full max-w-2xl bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <label className="text-sm font-bold text-slate-700 whitespace-nowrap">📚 Chọn chủ đề học:</label>
        <select 
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-blue-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
        >
          <option value="all">Tất cả từ vựng ({vocabList.length} từ)</option>
          {uniqueTopics.map((topic) => {
            const count = vocabList.filter((v) => v.category_id === topic).length;
            return (
              <option key={topic} value={topic}>
                {topic} ({count} từ)
              </option>
            );
          })}
        </select>
      </div>

      {/* HIỂN THỊ FLASHCARD THEO CHẾ ĐỘ VÀ CHỦ ĐỀ ĐÃ CHỌN */}
      <div className="w-full">
        {mode === 'view' ? (
          <FlashcardViewer key={selectedTopic} vocabularies={filteredVocabs} />
        ) : (
          <FlashcardStudy key={selectedTopic} initialVocabs={filteredVocabs} />
        )}
      </div>
    </main>
  );
}