import React from 'react';
import { StudyPlanData } from '../types';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface StudyPlanProps {
  data: StudyPlanData;
}

const StudyPlanComponent: React.FC<StudyPlanProps> = ({ data }) => {
  return (
    <div className="my-6 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-3">
        <Calendar className="w-6 h-6 text-teal-400" />
        <h3 className="text-lg font-bold text-white">{data.title || "Personalized Study Plan"}</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {data.days.map((day, idx) => (
          <div key={idx} className="relative pl-6 border-l-2 border-slate-700 hover:border-teal-500 transition-colors">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-teal-500" />
            
            <div className="mb-1 flex items-baseline justify-between">
              <h4 className="text-teal-300 font-bold text-lg">{day.day}</h4>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold bg-slate-800 px-2 py-1 rounded">
                {day.focus}
              </span>
            </div>
            
            <ul className="space-y-2 mt-2">
              {day.tasks.map((task, taskIdx) => (
                <li key={taskIdx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                  <span>{task}</span>
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
