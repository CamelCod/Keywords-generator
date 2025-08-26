
import React from 'react';
import type { PersonalityAnalysis } from '../types';
import { PawPrintIcon } from './icons/PawPrintIcon';

interface PersonalityCardProps {
  analysis: PersonalityAnalysis;
}

const TraitChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-cyan-100 text-cyan-800 text-sm font-medium px-3 py-1 rounded-full">
    {children}
  </div>
);

export const PersonalityCard: React.FC<PersonalityCardProps> = ({ analysis }) => {
  const scoreColor = analysis.compatibilityScore > 75 ? 'bg-green-500' : analysis.compatibilityScore > 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
      <div className="text-center">
        <h2 className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">Personality Profile</h2>
        <p className="mt-1 text-3xl font-bold text-slate-800">{analysis.title}</p>
      </div>

      <div className="text-slate-600 text-center bg-slate-50 p-4 rounded-lg border">
        {analysis.description}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Key Traits</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.keyTraits.map((trait, index) => (
            <TraitChip key={index}>{trait}</TraitChip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Fun Fact</h3>
        <div className="flex items-start gap-3">
          <PawPrintIcon className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
          <p className="text-slate-600">{analysis.funFact}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Human Compatibility Score</h3>
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full ${scoreColor} transition-all duration-1000 ease-out`}
            style={{ width: `${analysis.compatibilityScore}%` }}
          ></div>
        </div>
        <p className="text-right text-sm font-bold text-slate-600 mt-1">{analysis.compatibilityScore}%</p>
      </div>
    </div>
  );
};
