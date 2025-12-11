import React from 'react';
import { WhiteboardData } from '../types';
import { Edit3 } from 'lucide-react';

interface WhiteboardProps {
  data: WhiteboardData;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ data }) => {
  return (
    <div className="my-6 w-full max-w-2xl mx-auto">
      <div className="bg-[#fdfbf7] text-slate-800 p-1 rounded-lg shadow-2xl border-8 border-slate-800 transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="bg-[#fdfbf7] p-6 min-h-[300px] font-handwritten relative">
          
          {/* Header */}
          <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-2 mb-6">
            <Edit3 className="w-6 h-6 text-slate-600" />
            <h3 className="text-2xl font-bold text-slate-800">{data.title}</h3>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {data.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-sans font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-600 mb-1 text-lg">{step.label}</p>
                  <div className="text-xl text-blue-900 bg-blue-50/50 p-2 rounded-lg border border-transparent group-hover:border-blue-200 transition-colors">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-2 right-4 opacity-20 pointer-events-none">
            <span className="text-6xl font-handwritten">EduVision</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardComponent;
