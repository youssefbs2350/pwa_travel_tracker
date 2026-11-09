import React, { useEffect, useState } from 'react';
import { Target, CheckCircle2, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { Trip } from '../../types';
import { calculateTripReadiness, getReadinessColor, type ReadinessScore } from '../../utils/tripReadiness';

interface TripReadinessWidgetProps {
  trip: Trip;
  compact?: boolean;
}

export const TripReadinessWidget: React.FC<TripReadinessWidgetProps> = ({ trip, compact = false }) => {
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReadiness();
  }, [trip.id]);

  const loadReadiness = async () => {
    setIsLoading(true);
    try {
      const score = await calculateTripReadiness(trip);
      setReadiness(score);
    } catch (error) {
      console.error('Error calculating readiness:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !readiness) {
    return (
      <div className="animate-pulse bg-slate-800/50 rounded-xl h-24 flex items-center justify-center">
        <Target className="w-6 h-6 text-slate-600 animate-spin" />
      </div>
    );
  }

  const colors = getReadinessColor(readiness.totalScore);

  if (compact) {
    return (
      <div className="relative">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border} shadow-sm`}>
          <Target className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-xs font-bold ${colors.text}`}>
            {readiness.totalScore}% {readiness.levelLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Score de Préparation</h3>
        </div>
        <button
          onClick={loadReadiness}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          title="Actualiser le score"
        >
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Score Circle */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-800"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - readiness.totalScore / 100)}`}
              className={readiness.totalScore >= 75 ? 'text-emerald-500' : readiness.totalScore >= 50 ? 'text-sky-500' : 'text-amber-500'}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{readiness.totalScore}%</span>
            <span className="text-[10px] text-slate-400">préparé</span>
          </div>
        </div>

        <div className="flex-1 pl-4 space-y-1.5">
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
            <Sparkles className={`w-3.5 h-3.5 ${colors.text}`} />
            <span className={`text-xs font-bold ${colors.text}`}>{readiness.levelLabel}</span>
          </div>
          
          {/* Mini breakdown */}
          <div className="space-y-1">
            {Object.entries(readiness.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 capitalize">{key}</span>
                <div className="flex items-center space-x-1">
                  {value.status === 'complete' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : value.status === 'partial' ? (
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-slate-600" />
                  )}
                  <span className={value.status === 'complete' ? 'text-emerald-400' : value.status === 'partial' ? 'text-amber-400' : 'text-slate-600'}>
                    {value.score}/{value.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {readiness.suggestions.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase">Actions recommandées :</h4>
          <div className="space-y-1.5">
            {readiness.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg">
                <ArrowRight className="w-3 h-3 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Mini icône ArrowRight si pas importée
const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
