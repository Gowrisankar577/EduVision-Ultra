import React from 'react';
import { StudyPlanData } from '../types';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

interface StudyPlanProps {
  data: StudyPlanData;
}

const StudyPlanComponent: React.FC<StudyPlanProps> = ({ data }) => {
  return (
    <div className="my-8 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 border-b border-slate-700/50 flex items-center gap-4">
        <div className="p-2 bg-teal-500/20 rounded-lg">
           <Calendar className="w-6 h-6 text-teal-400" />
        </div>
        <div>
           <h3 className="text-lg font-bold text-white">{data.title || "Personalized Study Plan"}</h3>
           <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Timeline & Tasks</p>
        </div>
      </div>
      
      <div className="p-6 space-y-1">
        {data.days.map((day, idx) => (
          <div key={idx} className="relative pl-8 pb-8 last:pb-0 border-l-2 border-slate-700 last:border-l-0 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-teal-500 group-hover:bg-teal-500/20 transition-all shadow-[0_0_0_4px_rgba(15,23,42,1)]" />
            
            <div className="mb-3 flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/30 group-hover:bg-slate-800/60 transition-colors">
              <h4 className="text-teal-300 font-bold text-lg flex items-center gap-2">
                 {day.day}
              </h4>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold bg-slate-700/50 px-2 py-1 rounded border border-slate-600">
                {day.focus}
              </span>
            </div>
            
            <ul className="space-y-2 mt-2 pl-1">
              {day.tasks.map((task, taskIdx) => (
                <li key={taskIdx} className="flex items-start gap-3 text-slate-300 text-sm group/item">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0 group-hover/item:text-teal-400 transition-colors" />
                  <span className="group-hover/item:text-white transition-colors">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyPlanComponent;