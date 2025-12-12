import React, { useState } from 'react';
import { QuizData } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy } from 'lucide-react';

interface QuizProps {
  data: QuizData;
}

const QuizComponent: React.FC<QuizProps> = ({ data }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(index);
    setShowExplanation(true);
    if (index === data.questions[currentQuestion].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < data.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl border border-slate-700 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
          <p className="text-slate-300 mb-6 text-lg">You scored <span className="font-bold text-blue-400">{score}</span> out of {data.questions.length}</p>
          <button
            onClick={resetQuiz}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg hover:shadow-blue-500/25"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const question = data.questions[currentQuestion];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 my-4 shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
        <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
           <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
           {data.title || "Knowledge Check"}
        </h3>
        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono font-bold border border-slate-700">
           {currentQuestion + 1} / {data.questions.length}
        </span>
      </div>

      <p className="text-lg font-medium text-slate-100 mb-6 leading-relaxed">{question.question}</p>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          let optionClass = "w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center relative overflow-hidden ";
          
          if (selectedOption === null) {
            optionClass += "border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-blue-500/50 cursor-pointer hover:shadow-md";
          } else {
            if (idx === question.correctAnswer) {
              optionClass += "border-green-500/50 bg-green-900/20 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
            } else if (idx === selectedOption) {
              optionClass += "border-red-500/50 bg-red-900/20 text-red-100";
            } else {
              optionClass += "border-slate-800 bg-slate-800/30 text-slate-600 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={selectedOption !== null}
              className={optionClass}
            >
              <span className="relative z-10">{option}</span>
              {selectedOption !== null && idx === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-400 relative z-10" />}
              {selectedOption !== null && idx === selectedOption && idx !== question.correctAnswer && <XCircle className="w-5 h-5 text-red-400 relative z-10" />}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="mt-6 p-5 bg-blue-950/30 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
          <p className="font-bold text-blue-300 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span> Insight
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg font-medium text-sm"
            >
              {currentQuestion < data.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;