'use client';

import { useState, useEffect } from 'react';

export interface Vocabulary {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning_vi: string;
  example_sentence?: string;
  example_pinyin?: string;
  example_meaning?: string;
}

interface FlashcardProps {
  vocab: Vocabulary;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function Flashcard({ vocab, onNext, onPrev }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [prevId, setPrevId] = useState(vocab.id);

  // Reset mặt thẻ khi id từ vựng thay đổi
  if (prevId !== vocab.id) {
    setPrevId(vocab.id);
    setFlipped(false);
  }

  const playAudio = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
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

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vocab.id]);

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      {/* KHUNG FLASHCARD */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[420px] bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white rounded-3xl p-8 shadow-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-blue-200 hover:scale-[1.01] select-none relative overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center z-10">
          <span className="text-xs bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-semibold">
            {flipped ? 'Mặt Sau (Đáp Án)' : 'Nhấn Space hoặc Click để lật thẻ'}
          </span>
          <button
            onClick={(e) => playAudio(vocab.hanzi, e)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-xl"
            title="Nghe phát âm từ vựng"
          >
            🔊
          </button>
        </div>

        {/* CHỮ HÁN & PINYIN */}
        <div className="text-center my-auto z-10 py-4">
          <h1 className="text-7xl md:text-8xl font-black tracking-widest drop-shadow-md mb-3">
            {vocab.hanzi}
          </h1>
          {flipped && (
            <p className="text-3xl font-bold text-yellow-300 tracking-wider">
              {vocab.pinyin}
            </p>
          )}
        </div>

        {/* MẶT SAU: NGHĨA & CÂU VÍ DỤ CĂN GIỮA */}
        {flipped ? (
          <div className="border-t border-white/20 pt-4 text-center space-y-3 z-10">
            <p className="text-3xl font-extrabold">{vocab.meaning_vi}</p>

            {vocab.example_sentence && (
              <div className="mt-3 text-sm text-blue-100 bg-black/25 p-4 pr-14 pl-14 rounded-2xl max-w-lg mx-auto text-center backdrop-blur-sm border border-white/10 relative">
                <div className="space-y-1">
                  <p className="font-bold text-base text-white">{vocab.example_sentence}</p>

                  {vocab.example_pinyin && (
                    <p className="text-yellow-300 text-xs font-semibold tracking-wide">
                      {vocab.example_pinyin}
                    </p>
                  )}

                  {vocab.example_meaning && (
                    <p className="opacity-80 text-xs italic">{vocab.example_meaning}</p>
                  )}
                </div>

                <button
                  onClick={(e) => playAudio(vocab.example_sentence!, e)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/20 hover:bg-white/30 active:scale-90 rounded-full transition-all text-base"
                  title="Nghe đọc câu ví dụ"
                >
                  🔊
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-xs opacity-40 font-light">Mặt trước</div>
        )}
      </div>

      {/* 2 NÚT MŨI TÊN CHUYỂN THẺ */}
      <div className="flex justify-between items-center gap-4 w-full">
        <button
          onClick={handlePrev}
          className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">←</span>
          <span>Thẻ trước</span>
          <span className="text-[10px] opacity-50 font-normal">(Phím ←)</span>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Thẻ tiếp</span>
          <span className="text-xl">→</span>
          <span className="text-[10px] opacity-70 font-normal">(Phím →)</span>
        </button>
      </div>
    </div>
  );
}