import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { ChevronLeft, ChevronRight, RotateCw, Layers } from 'lucide-react';

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
    <div className="my-8 max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-bold text-slate-200 tracking-wide">{data.topic || "Flashcards"}</h3>
      </div>
      
      <div 
        className="relative h-72 w-full perspective-1000 cursor-pointer group select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
             style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)] transition-shadow">
            <span className="absolute top-6 left-6 text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-700 px-2 py-0.5 rounded-md">Front</span>
            <p className="text-2xl font-medium text-slate-100">{currentCard.front}</p>
            <div className="absolute bottom-6 text-teal-500/70 text-sm flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity font-medium">
               <RotateCw className="w-4 h-4" /> Tap to flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_30px_rgba(59,130,246,0.15)]"
               style={{ transform: 'rotateY(180deg)' }}>
             <span className="absolute top-6 left-6 text-xs font-bold text-indigo-400 uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded-md">Back</span>
            <p className="text-xl text-indigo-100 leading-relaxed">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 mt-6">
        <button 
            onClick={handlePrev}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-lg active:scale-95"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-slate-400 font-mono text-sm bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {currentIndex + 1} / {data.cards.length}
        </span>
        <button 
            onClick={handleNext}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-lg active:scale-95"
        >
            <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardsComponent;