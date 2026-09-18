// app/learn/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard, { Vocabulary } from '@/components/Flashcard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LearnPage() {
  const router = useRouter();
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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

  // Chuyển tới thẻ tiếp theo (xoay vòng vô tận)
  const handleNext = () => {
    if (vocabList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % vocabList.length);
  };

  // Quay lại thẻ trước (xoay vòng vô tận)
  const handlePrev = () => {
    if (vocabList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + vocabList.length) % vocabList.length);
  };

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
        <p className="text-gray-500 text-sm">Hãy thêm một vài từ mới trước khi tiến hành xem thẻ.</p>
        <Link
          href="/vocab/add"
          className="inline-block px-8 py-3.5 bg-blue-600 text-white font-extrabold rounded-2xl shadow-lg hover:bg-blue-700 transition-all text-sm"
        >
          + Thêm Từ Vựng Mới
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
      <div className="w-full max-w-2xl flex justify-between items-center text-sm font-semibold text-gray-500">
        <Link href="/" className="text-blue-600 hover:underline">← Về trang chủ</Link>
        <span>Thẻ: {currentIndex + 1} / {vocabList.length}</span>
      </div>

      <Flashcard
        vocab={vocabList[currentIndex]}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </main>
  );
}