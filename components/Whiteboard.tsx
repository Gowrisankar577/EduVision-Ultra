import React from 'react';
import { WhiteboardData } from '../types';
import { Edit3 } from 'lucide-react';

interface WhiteboardProps {
  data: WhiteboardData;
}

const WhiteboardComponent: React.FC<WhiteboardProps> = ({ data }) => {
  return (
    <div className="my-8 w-full max-w-2xl mx-auto">
      {/* Frame */}
      <div className="relative bg-[#f0f4f8] text-slate-800 p-2 rounded-lg shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 ease-out">
        {/* Top Tape */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-yellow-200/80 rotate-[-2deg] shadow-sm z-10 backdrop-blur-sm"></div>

        {/* Board Surface */}
        <div className="bg-white p-8 min-h-[300px] font-handwritten relative rounded-sm shadow-inner" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4 mb-8">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
               <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{data.title}</h3>
          </div>

          {/* Steps */}
          <div className="space-y-8 relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-slate-200"></div>

            {data.steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 group relative z-10">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-sans font-bold text-sm shadow-lg group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 border-4 border-white">
                  {idx + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-bold text-slate-500 mb-2 text-xl uppercase tracking-wide">{step.label}</p>
                  <div className="text-2xl text-blue-900 leading-relaxed font-medium">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-4 right-6 opacity-30 select-none">
            <span className="text-5xl font-handwritten text-slate-400 rotate-[-5deg] block">EduVision</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardComponent;