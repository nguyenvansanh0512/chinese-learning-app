'use client';

import { useState } from 'react';
import Flashcard, { Vocabulary } from './Flashcard';

interface FlashcardViewerProps {
  vocabularies: Vocabulary[];
}

export default function FlashcardViewer({ vocabularies }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 font-semibold">
        Chưa có từ vựng nào trong chủ đề này.
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vocabularies.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vocabularies.length) % vocabularies.length);
  };

  return (
    <div className="space-y-4">
      <div className="text-center text-sm font-bold text-slate-500">
        Thẻ {currentIndex + 1} / {vocabularies.length}
      </div>

      <Flashcard
        vocab={vocabularies[currentIndex]}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
}