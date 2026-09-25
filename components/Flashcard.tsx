'use client';

import { useState } from 'react';

export interface Vocabulary {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning_vi: string;
  example_sentence?: string;
  example_pinyin?: string;
  example_meaning?: string;
  category_id?: string;
}

interface FlashcardProps {
  vocab: Vocabulary;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function Flashcard({ vocab, onNext, onPrev }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [prevId, setPrevId] = useState(vocab.id);

  if (prevId !== vocab.id) {
    setPrevId(vocab.id);
    setFlipped(false);
  }

  const playAudio = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setFlipped(false);
    if (onNext) onNext();
  };

  const handlePrev = () => {
    setFlipped(false);
    if (onPrev) onPrev();
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      {/* THẺ FLASHCARD NỀN TRẮNG VIỀN ĐEN */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[420px] bg-white text-slate-900 border-2 border-black rounded-3xl p-8 shadow-lg flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] select-none relative overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 border border-gray-300 text-gray-700 px-4 py-1.5 rounded-full font-semibold">
              {flipped ? 'Mặt Sau (Đáp Án)' : 'Nhấn Space hoặc Click để lật thẻ'}
            </span>
            {vocab.category_id && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-full font-bold">
                📁 {vocab.category_id}
              </span>
            )}
          </div>
          <button
            onClick={(e) => playAudio(vocab.hanzi, e)}
            className="p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-full transition-colors text-xl"
            title="Nghe phát âm từ vựng"
          >
            🔊
          </button>
        </div>

        {/* CHỮ HÁN & PINYIN */}
        <div className="text-center my-auto z-10 py-4">
          <h1 className="text-7xl md:text-8xl font-black tracking-widest text-black mb-3">
            {vocab.hanzi}
          </h1>
          {flipped && (
            <p className="text-3xl font-bold text-blue-600 tracking-wider">
              {vocab.pinyin}
            </p>
          )}
        </div>

        {/* MẶT SAU: NGHĨA & CÂU VÍ DỤ */}
        {flipped ? (
          <div className="border-t border-gray-200 pt-4 text-center space-y-3 z-10">
            <p className="text-3xl font-extrabold text-black">{vocab.meaning_vi}</p>

            {vocab.example_sentence && (
              <div className="mt-3 text-sm text-gray-800 bg-gray-50 p-4 pr-14 pl-14 rounded-2xl max-w-lg mx-auto text-center border border-gray-200 relative">
                <div className="space-y-1">
                  <p className="font-bold text-base text-black">{vocab.example_sentence}</p>

                  {vocab.example_pinyin && (
                    <p className="text-blue-600 text-xs font-semibold tracking-wide">
                      {vocab.example_pinyin}
                    </p>
                  )}

                  {vocab.example_meaning && (
                    <p className="text-gray-500 text-xs italic">{vocab.example_meaning}</p>
                  )}
                </div>

                <button
                  onClick={(e) => playAudio(vocab.example_sentence!, e)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gray-200 hover:bg-gray-300 active:scale-90 rounded-full transition-all text-base"
                  title="Nghe đọc câu ví dụ"
                >
                  🔊
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-400 font-light">Mặt trước</div>
        )}
      </div>

      {/* 2 NÚT MŨI TÊN CHUYỂN THẺ */}
      <div className="flex justify-between items-center gap-4 w-full">
        <button
          onClick={handlePrev}
          className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 active:scale-95 text-gray-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">←</span>
          <span>Thẻ trước</span>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-black hover:bg-gray-800 active:scale-95 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 border border-black"
        >
          <span>Thẻ tiếp</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
}