import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface FlashcardsProps {
  data: FlashcardData;
}

const FlashcardsComponent: React.FC<FlashcardsProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % data.cards.length);
    }, 150);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + data.cards.length) % data.cards.length);
    }, 150);
  };

  const currentCard = data.cards[currentIndex];

  return (
    <div className="my-6 max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-center text-teal-400 mb-4">{data.topic || "Flashcards"}</h3>
      
      <div 
        className="relative h-64 w-full perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
             style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <span className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Front</span>
            <p className="text-xl font-medium text-white">{currentCard.front}</p>
            <div className="absolute bottom-4 text-slate-500 text-sm flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
               <RotateCw className="w-4 h-4" /> Click to flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-700 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xl"
               style={{ transform: 'rotateY(180deg)' }}>
             <span className="absolute top-4 left-4 text-xs font-bold text-blue-400 uppercase tracking-wider">Back</span>
            <p className="text-lg text-blue-100">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 px-4">
        <button 
            onClick={handlePrev}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-slate-400 font-mono text-sm">
            {currentIndex + 1} / {data.cards.length}
        </span>
        <button 
            onClick={handleNext}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
            <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardsComponent;
