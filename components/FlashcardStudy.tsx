'use client';

import { useState, useRef } from 'react';
import { Vocabulary } from './Flashcard';

const shuffleArray = (array: Vocabulary[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export default function FlashcardStudy({ initialVocabs }: { initialVocabs: Vocabulary[] }) {
  // Khi đổi key={selectedTopic} ở page.tsx, state này sẽ tự động khởi tạo lại với initialVocabs mới
  const [queue, setQueue] = useState<Vocabulary[]>(() => shuffleArray(initialVocabs));
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleCheck = () => {
    if (queue.length === 0 || feedback !== 'idle' || !userInput.trim()) return;

    const currentCard = queue[0];
    
    const validAnswers = currentCard.meaning_vi
      .split(',')
      .map((m) => removeVietnameseTones(m.trim().toLowerCase()));
      
    const userAnswer = removeVietnameseTones(userInput.trim().toLowerCase());

    if (validAnswers.includes(userAnswer)) {
      setFeedback('correct');
      playAudio(currentCard.hanzi);
      
      setTimeout(() => {
        setQueue((prev) => prev.slice(1));
        resetState();
      }, 1200);
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setQueue((prev) => shuffleArray([...prev]));
        resetState();
      }, 2500);
    }
  };

  const resetState = () => {
    setUserInput('');
    setFeedback('idle');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  if (queue.length === 0 && initialVocabs.length > 0) {
    return (
      <div className="max-w-2xl mx-auto w-full text-center space-y-6 py-20">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-green-600">Hoàn thành xuất sắc!</h2>
        <p className="text-gray-500">Bạn đã ôn tập xong tất cả các từ trong chủ đề này.</p>
        <button
          onClick={() => setQueue(shuffleArray(initialVocabs))}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition"
        >
          Ôn tập lại chủ đề này
        </button>
      </div>
    );
  }

  const vocab = queue[0];
  if (!vocab) return null;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center text-sm font-semibold text-gray-500 px-2">
        <span>Cần ôn lại: {queue.length} từ</span>
        {vocab.category_id && (
          <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full border border-blue-100">
            📚 {vocab.category_id}
          </span>
        )}
      </div>

      <div className="w-full min-h-[420px] bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center z-10">
          <span className="text-xs bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-semibold">
            {feedback === 'idle'
              ? 'Hãy nhập nghĩa tiếng Việt'
              : feedback === 'correct'
              ? 'Chính xác! 👏'
              : 'Chưa đúng rồi! 😢'}
          </span>
          <button
            onClick={(e) => playAudio(vocab.hanzi, e)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-xl"
            title="Nghe phát âm"
          >
            🔊
          </button>
        </div>

        {/* CHỮ HÁN & PINYIN */}
        <div className="text-center my-auto z-10 py-4">
          <h1 className="text-7xl md:text-8xl font-black tracking-widest drop-shadow-md mb-3">
            {vocab.hanzi}
          </h1>
          <p className="text-3xl font-bold text-yellow-300 tracking-wider">
            {vocab.pinyin}
          </p>
        </div>

        {/* KHU VỰC NHẬP LIỆU */}
        <div className="z-10 space-y-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Nhập nghĩa tiếng Việt (ấn Enter để kiểm tra)..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={feedback !== 'idle'}
            autoFocus
            className={`w-full p-4 rounded-2xl text-lg text-center font-bold text-gray-800 outline-none transition-all border-4
              ${feedback === 'idle' ? 'border-transparent focus:ring-4 focus:ring-blue-300' : ''}
              ${feedback === 'correct' ? 'border-green-400 bg-green-50' : ''}
              ${feedback === 'incorrect' ? 'border-red-400 bg-red-50' : ''}
            `}
          />
          
          {feedback === 'incorrect' && (
            <div className="bg-red-500/80 backdrop-blur-md p-4 rounded-2xl text-center border border-red-300">
              <p className="text-sm text-red-100 mb-1">Đáp án đúng là:</p>
              <p className="text-2xl font-extrabold text-white">{vocab.meaning_vi}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* NÚT KIỂM TRA */}
      <button
        onClick={handleCheck}
        disabled={feedback !== 'idle' || !userInput.trim()}
        className="w-full py-4 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {feedback === 'idle'
          ? 'Kiểm tra'
          : feedback === 'correct'
          ? 'Đang chuyển thẻ...'
          : 'Học lại thẻ này sau'}
      </button>
    </div>
  );
}