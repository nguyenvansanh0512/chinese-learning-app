// components/FlashcardStudy.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Vocabulary } from './Flashcard';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

const shuffleArray = (array: Vocabulary[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const removeVietnameseTones = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

interface SpeechResult {
  score: number;
  feedback: string;
  suggestion: string;
}

interface FlashcardStudyProps {
  initialVocabs: Vocabulary[];
  testMode: 'typing' | 'speech';
}

export default function FlashcardStudy({ initialVocabs, testMode }: FlashcardStudyProps) {
  const [queue, setQueue] = useState<Vocabulary[]>(() => shuffleArray(initialVocabs));
  
  // State Typing
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // State Speech
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [speechEval, setSpeechEval] = useState<SpeechResult | null>(null);

  const vocab = queue[0];

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

  // --- XỬ LÝ CHẾ ĐỘ NHẬP NGHĨA (TYPING) ---
  const handleTypingCheck = () => {
    if (queue.length === 0 || feedback !== 'idle' || !userInput.trim()) return;

    const validAnswers = vocab.meaning_vi.split(',').map((m) => removeVietnameseTones(m.trim().toLowerCase()));
    const userAnswer = removeVietnameseTones(userInput.trim().toLowerCase());

    if (validAnswers.includes(userAnswer)) {
      setFeedback('correct');
      playAudio(vocab.hanzi);
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

  // --- XỬ LÝ CHẾ ĐỘ ĐỌC (SPEECH) ---
  const handleSpeechCheck = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ. Hãy dùng Google Chrome.');
      return;
    }

    setSpokenText('');
    setSpeechEval(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);
      setIsListening(false);
      setAiLoading(true);

      try {
        const res = await fetch('/api/ai-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetHanzi: vocab.hanzi,
            targetPinyin: vocab.pinyin,
            spokenText: transcript,
          }),
        });
        const data = await res.json();
        setSpeechEval(data);
        
        // Nếu điểm cao, tự động chuyển thẻ sau 3 giây
        if (data.score >= 80) {
          setTimeout(() => {
            setQueue((prev) => prev.slice(1));
            resetState();
          }, 3000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(false);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const resetState = () => {
    setUserInput('');
    setFeedback('idle');
    setSpokenText('');
    setSpeechEval(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (queue.length === 0 && initialVocabs.length > 0) {
    return (
      <div className="max-w-2xl mx-auto w-full text-center space-y-6 py-20">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-green-600">Hoàn thành xuất sắc!</h2>
        <button
          onClick={() => setQueue(shuffleArray(initialVocabs))}
          className="px-8 py-3 bg-black text-white font-bold rounded-2xl"
        >
          Ôn tập lại
        </button>
      </div>
    );
  }

  if (!vocab) return null;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="text-sm font-semibold text-gray-500 text-center">
        Còn {queue.length} từ cần hoàn thành
      </div>

      <div className="w-full min-h-[400px] bg-white border-2 border-black rounded-3xl p-8 shadow-lg flex flex-col justify-between relative">
        <div className="flex justify-between items-center z-10">
          <span className="text-xs bg-gray-100 border border-gray-300 text-gray-700 px-4 py-1.5 rounded-full font-bold uppercase">
            {testMode === 'typing' ? '✍️ Chế độ Viết' : '🎙️ Chế độ Đọc'}
          </span>
          <button
            onClick={(e) => playAudio(vocab.hanzi, e)}
            className="p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-full text-xl"
          >
            🔊
          </button>
        </div>

        {/* CHỮ HÁN & PINYIN */}
        <div className="text-center my-auto py-6">
          <h1 className="text-7xl font-black text-black mb-3">{vocab.hanzi}</h1>
          <p className="text-3xl font-bold text-blue-600">{vocab.pinyin}</p>
        </div>

        {/* GIAO DIỆN THEO TỪNG CHẾ ĐỘ */}
        {testMode === 'typing' ? (
          // CHẾ ĐỘ NHẬP NGHĨA
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập nghĩa tiếng Việt (ấn Enter)..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTypingCheck()}
              disabled={feedback !== 'idle'}
              autoFocus
              className={`w-full p-4 rounded-2xl text-lg text-center font-bold text-gray-900 border-2 outline-none
                ${feedback === 'idle' ? 'border-gray-300 focus:border-black' : ''}
                ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                ${feedback === 'incorrect' ? 'border-red-500 bg-red-50' : ''}
              `}
            />
            {feedback === 'incorrect' && (
              <div className="text-center bg-red-50 p-2 rounded-xl text-red-600 font-bold border border-red-200">
                Đáp án đúng: {vocab.meaning_vi}
              </div>
            )}
            <button
              onClick={handleTypingCheck}
              disabled={feedback !== 'idle' || !userInput.trim()}
              className="w-full py-4 bg-black text-white font-bold rounded-2xl disabled:opacity-50"
            >
              Kiểm tra
            </button>
          </div>
        ) : (
          // CHẾ ĐỘ THU ÂM
          <div className="space-y-4">
             {spokenText && (
              <div className="p-4 bg-gray-50 border-2 border-black rounded-2xl text-center space-y-2">
                <p className="text-sm text-gray-600">Bạn đã đọc: <span className="font-bold text-black text-lg">{spokenText}</span></p>
                {aiLoading ? (
                  <p className="text-blue-600 font-bold animate-pulse">🤖 Đang chấm điểm...</p>
                ) : speechEval ? (
                  <>
                    <p className={`text-xl font-black ${speechEval.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                      {speechEval.score}/100 Điểm
                    </p>
                    <p className="text-sm font-bold">{speechEval.feedback}</p>
                    {speechEval.score < 80 && (
                      <button onClick={() => setQueue((prev) => shuffleArray([...prev]))} className="text-xs text-blue-600 underline mt-2">
                        Bỏ qua thẻ này để luyện lại sau
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            )}
            <button
              onClick={handleSpeechCheck}
              disabled={isListening || aiLoading}
              className={`w-full py-4 font-bold rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${
                isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
              }`}
            >
              <span className="text-xl">🎙️</span>
              <span>{isListening ? 'Đang nghe bạn đọc...' : 'Bấm vào đây để nói'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}