// components/AddVocabForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { pinyin } from 'pinyin-pro';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AddVocabForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    hanzi: '',
    pinyin: '',
    meaning_vi: '',
    example_sentence: '',
    example_pinyin: '',
    example_meaning: '',
    category_id: '', // 🟢 THÊM STATE QUẢN LÝ CHỦ ĐỀ
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, [router]);

  // GỌI AI & TỰ ĐỘNG CHUYỂN PINYIN CÂU VÍ DỤ
  const fetchAiData = async (hanzi: string) => {
    const hanziTrimmed = hanzi.trim();
    if (!hanziTrimmed) return;

    const currentRequestId = ++requestIdRef.current;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanzi: hanziTrimmed }),
      });

      const data = await res.json();

      if (currentRequestId !== requestIdRef.current) return;

      if (res.ok) {
        const sentence = data.example_sentence || '';
        const autoExamplePinyin = sentence ? pinyin(sentence, { toneType: 'symbol' }) : '';

        setFormData((prev) => ({
          ...prev,
          meaning_vi: data.meaning_vi || '',
          example_sentence: sentence,
          example_pinyin: autoExamplePinyin,
          example_meaning: data.example_meaning || '',
        }));
      } else {
        setAiError(data.error || 'Không thể lấy dữ liệu từ AI');
      }
    } catch (error) {
      console.error('AI ERROR:', error);
      if (currentRequestId === requestIdRef.current) {
        setAiError('Không thể kết nối tới server AI');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setAiLoading(false);
      }
    }
  };

  const handleHanziChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const trimmed = val.trim();
    const autoPinyin = trimmed ? pinyin(trimmed, { toneType: 'symbol' }) : '';

    setAiError(null);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    if (!trimmed) {
      requestIdRef.current++;
      setAiLoading(false);
      setFormData({
        hanzi: '',
        pinyin: '',
        meaning_vi: '',
        example_sentence: '',
        example_pinyin: '',
        example_meaning: '',
        category_id: formData.category_id, // Giữ lại chủ đề đang nhập
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      hanzi: val,
      pinyin: autoPinyin,
      meaning_vi: '',
      example_sentence: '',
      example_pinyin: '',
      example_meaning: '',
    }));

    aiTimerRef.current = setTimeout(() => {
      fetchAiData(trimmed);
    }, 700);
  };

  const handleExampleSentenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const autoExamplePinyin = val.trim() ? pinyin(val, { toneType: 'symbol' }) : '';

    setFormData((prev) => ({
      ...prev,
      example_sentence: val,
      example_pinyin: autoExamplePinyin,
    }));
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert('Bạn chưa đăng nhập!');
      return;
    }

    if (aiLoading) {
      alert('Vui lòng chờ AI hoàn thành!');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('vocabularies').insert([
      {
        ...formData,
        user_id: userId,
        // Nếu người dùng không nhập chủ đề, có thể lưu null hoặc chuỗi rỗng
        category_id: formData.category_id.trim() || null, 
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
    } else {
      alert('Đã lưu từ vựng thành công!');
      // Xóa form nhưng CÓ THỂ giữ lại category_id để người dùng nhập liên tục các từ cùng chủ đề
      setFormData((prev) => ({
        hanzi: '',
        pinyin: '',
        meaning_vi: '',
        example_sentence: '',
        example_pinyin: '',
        example_meaning: '',
        category_id: prev.category_id, // 🟢 Giữ nguyên chủ đề cho từ tiếp theo
      }));
      setAiError(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-slate-800">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-2xl font-black text-slate-900">Thêm Từ Vựng Mới</h2>
        <p className="text-xs text-gray-400 mt-1">
          Nhập chữ Hán, AI sẽ tự động điền nghĩa, câu ví dụ và tạo Pinyin cho câu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 🟢 KHU VỰC CHỌN CHỦ ĐỀ */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Chủ đề / Nhóm từ vựng</label>
          <input
            type="text"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            placeholder="Ví dụ: HSK 1, Chào hỏi, Sở thích..."
            className="w-full mt-2 p-4 border border-blue-200 bg-blue-50/30 rounded-2xl font-bold focus:outline-blue-600 focus:bg-white transition-colors"
          />
          <p className="text-[10px] text-gray-400 mt-1 pl-2">Gợi ý: Nhập tên chủ đề, nó sẽ được giữ nguyên cho các từ tiếp theo bạn thêm vào.</p>
        </div>

        {/* CHỮ HÁN */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase">1. Chữ Hán (*)</label>
            {aiLoading && (
              <span className="text-xs text-blue-600 font-bold animate-pulse">
                🤖 AI đang phân tích...
              </span>
            )}
            {aiError && <span className="text-xs text-red-500 font-bold">⚠️ {aiError}</span>}
          </div>
          <input
            type="text"
            value={formData.hanzi}
            onChange={handleHanziChange}
            required
            placeholder="Nhập chữ Hán (Ví dụ: 学习)"
            className="w-full p-4 border border-gray-200 rounded-2xl text-2xl font-black focus:outline-blue-600"
          />
        </div>

        {/* PINYIN & TIẾNG VIỆT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pinyin Từ</label>
            <input
              type="text"
              value={formData.pinyin}
              onChange={(e) => setFormData({ ...formData, pinyin: e.target.value })}
              required
              className="w-full p-4 border border-gray-200 rounded-2xl bg-slate-50 text-blue-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Tiếng Việt (AI)</label>
            <input
              type="text"
              value={formData.meaning_vi}
              onChange={(e) => setFormData({ ...formData, meaning_vi: e.target.value })}
              required
              placeholder={aiLoading ? '🤖 AI đang lấy nghĩa...' : 'AI sẽ tự động điền'}
              className="w-full p-4 border border-gray-200 rounded-2xl font-bold text-slate-800 focus:outline-blue-600"
            />
          </div>
        </div>

        {/* CÂU VÍ DỤ TIẾNG HÁN & PINYIN CÂU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Câu ví dụ tiếng Hán (AI)</label>
            <input
              type="text"
              value={formData.example_sentence}
              onChange={handleExampleSentenceChange}
              placeholder={aiLoading ? '🤖 AI đang tạo câu...' : 'AI sẽ tự động tạo câu'}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pinyin Câu Ví Dụ (Tự động)</label>
            <input
              type="text"
              value={formData.example_pinyin}
              onChange={(e) => setFormData({ ...formData, example_pinyin: e.target.value })}
              placeholder="Pinyin câu ví dụ"
              className="w-full p-4 border border-gray-200 rounded-2xl bg-slate-50 text-blue-600 font-bold"
            />
          </div>
        </div>

        {/* DỊCH CÂU VÍ DỤ */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">4. Dịch câu ví dụ (AI)</label>
          <input
            type="text"
            value={formData.example_meaning}
            onChange={(e) => setFormData({ ...formData, example_meaning: e.target.value })}
            placeholder={aiLoading ? '🤖 AI đang dịch...' : 'AI sẽ tự động dịch'}
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-blue-600"
          />
        </div>

        {/* NÚT LƯU */}
        <button
          type="submit"
          disabled={loading || aiLoading}
          className="w-full py-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : aiLoading ? '🤖 AI đang xử lý...' : 'Lưu Từ Vựng'}
        </button>
      </form>
    </div>
  );
}