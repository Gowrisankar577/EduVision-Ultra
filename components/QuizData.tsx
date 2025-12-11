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
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 text-center animate-fade-in">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
        <p className="text-slate-300 mb-6">You scored {score} out of {data.questions.length}</p>
        <button
          onClick={resetQuiz}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const question = data.questions[currentQuestion];

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 my-4 shadow-xl">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
        <h3 className="font-bold text-lg text-blue-400">{data.title || "Knowledge Check"}</h3>
        <span className="text-slate-400 text-sm">Question {currentQuestion + 1} / {data.questions.length}</span>
      </div>

      <p className="text-lg font-medium text-white mb-6">{question.question}</p>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          let optionClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 flex justify-between items-center ";
          
          if (selectedOption === null) {
            optionClass += "border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-blue-500 cursor-pointer";
          } else {
            if (idx === question.correctAnswer) {
              optionClass += "border-green-500 bg-green-900/20 text-green-100";
            } else if (idx === selectedOption) {
              optionClass += "border-red-500 bg-red-900/20 text-red-100";
            } else {
              optionClass += "border-slate-800 bg-slate-800/50 text-slate-500";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={selectedOption !== null}
              className={optionClass}
            >
              <span>{option}</span>
              {selectedOption !== null && idx === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-400" />}
              {selectedOption !== null && idx === selectedOption && idx !== question.correctAnswer && <XCircle className="w-5 h-5 text-red-400" />}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg animate-fade-in-up">
          <p className="font-semibold text-blue-300 mb-1">Explanation:</p>
          <p className="text-slate-300">{question.explanation}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
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
