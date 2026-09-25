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

  // STATE QUẢN LÝ DANH SÁCH CHỦ ĐỀ
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [fetchingCategories, setFetchingCategories] = useState<boolean>(true);

  const requestIdRef = useRef(0);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    hanzi: '',
    pinyin: '',
    meaning_vi: '',
    example_sentence: '',
    example_pinyin: '',
    example_meaning: '',
    category_id: '',
  });

  // TẢI THÔNG TIN USER VÀ DANH SÁCH CHỦ ĐỀ HIỆN CÓ
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);

        // Lấy danh sách các category_id đã tồn tại trong DB của user
        const { data } = await supabase
          .from('vocabularies')
          .select('category_id')
          .eq('user_id', user.id);

        if (data) {
          const categories = Array.from(
            new Set(
              data
                .map((item) => item.category_id)
                .filter((cat): cat is string => Boolean(cat && cat.trim() !== ''))
            )
          );
          setExistingCategories(categories);

          if (categories.length > 0) {
            setFormData((prev) => ({ ...prev, category_id: categories[0] }));
            setIsCustomCategory(false);
          } else {
            setIsCustomCategory(true);
          }
        }
        setFetchingCategories(false);
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
        category_id: formData.category_id,
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

    // Xác định chủ đề cuối cùng cần gửi đi
    const finalCategory = isCustomCategory ? customCategory.trim() : formData.category_id.trim();

    if (isCustomCategory && !finalCategory) {
      alert('Vui lòng nhập tên chủ đề mới!');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('vocabularies').insert([
      {
        ...formData,
        user_id: userId,
        category_id: finalCategory || null,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
    } else {
      alert('Đã lưu từ vựng thành công!');

      // Nếu vừa tạo chủ đề mới, cập nhật danh sách chủ đề có sẵn
      if (isCustomCategory && finalCategory && !existingCategories.includes(finalCategory)) {
        setExistingCategories((prev) => [...prev, finalCategory]);
      }

      // Xóa form nhưng giữ nguyên chủ đề hiện tại để nhập từ tiếp theo
      setFormData((prev) => ({
        hanzi: '',
        pinyin: '',
        meaning_vi: '',
        example_sentence: '',
        example_pinyin: '',
        example_meaning: '',
        category_id: finalCategory,
      }));

      setIsCustomCategory(false);
      setCustomCategory('');
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
        {/* KHU VỰC CHỌN VÀ THÊM CHỦ ĐỀ */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Chủ đề / Nhóm từ vựng
            </label>
            {existingCategories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (isCustomCategory && existingCategories.length > 0) {
                    setFormData((prev) => ({ ...prev, category_id: existingCategories[0] }));
                  }
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
              >
                {isCustomCategory ? '← Chọn từ chủ đề có sẵn' : '➕ Thêm chủ đề mới'}
              </button>
            )}
          </div>

          {fetchingCategories ? (
            <p className="text-xs text-gray-400 font-semibold py-2">Đang tải danh sách chủ đề...</p>
          ) : isCustomCategory || existingCategories.length === 0 ? (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Nhập tên chủ đề mới (VD: HSK 1, Du lịch, Công sở)..."
              className="w-full p-3.5 border border-blue-200 bg-white rounded-xl font-bold focus:outline-blue-600"
            />
          ) : (
            <select
              value={formData.category_id}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setIsCustomCategory(true);
                } else {
                  setFormData({ ...formData, category_id: e.target.value });
                }
              }}
              className="w-full p-3.5 border border-slate-200 bg-white rounded-xl font-bold text-slate-800 focus:outline-blue-600 cursor-pointer"
            >
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  📁 {cat}
                </option>
              ))}
              <option value="__NEW__">➕ (Thêm chủ đề mới...)</option>
            </select>
          )}
          <p className="text-[10px] text-gray-400 pl-1">
            Gợi ý: Chủ đề sẽ được giữ nguyên để bạn thêm liên tục các từ cùng nhóm.
          </p>
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