import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export default function FreshnessDonutChart({ summary }) {
  if (!summary) return null;

  const {
    freshCount = 0,
    agingCount = 0,
    outdatedCount = 0,
    totalArticles = 0,
    healthScore = 100,
    averageAgeDays = 0
  } = summary;

  const total = totalArticles || 1;
  const freshPct = Math.round((freshCount / total) * 100);
  const agingPct = Math.round((agingCount / total) * 100);
  const outdatedPct = Math.round((outdatedCount / total) * 100);

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const freshStroke = (freshPct / 100) * circumference;
  const agingStroke = (agingPct / 100) * circumference;
  const outdatedStroke = (outdatedPct / 100) * circumference;

  const freshOffset = 0;
  const agingOffset = -freshStroke;
  const outdatedOffset = -(freshStroke + agingStroke);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Ring with Health Score in center */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Fresh segment */}
          {freshCount > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${freshStroke} ${circumference}`}
              strokeDashoffset={freshOffset}
              strokeLinecap="round"
            />
          )}
          {/* Aging segment */}
          {agingCount > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${agingStroke} ${circumference}`}
              strokeDashoffset={agingOffset}
            />
          )}
          {/* Outdated segment */}
          {outdatedCount > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeDasharray={`${outdatedStroke} ${circumference}`}
              strokeDashoffset={outdatedOffset}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-800">{healthScore}%</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Freshness</span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 space-y-2.5 w-full">
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-emerald-900">Fresh (&lt; 90d)</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-700">{freshCount} articles</span>
            <span className="text-[10px] text-emerald-600 ml-1.5 font-medium">({freshPct}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-semibold text-amber-900">Aging (90–180d)</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-amber-700">{agingCount} articles</span>
            <span className="text-[10px] text-amber-600 ml-1.5 font-medium">({agingPct}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-xs font-semibold text-rose-900">Outdated (&gt; 180d)</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-rose-700">{outdatedCount} articles</span>
            <span className="text-[10px] text-rose-600 ml-1.5 font-medium">({outdatedPct}%)</span>
          </div>
        </div>

        <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Average Content Age:</span>
          <span className="font-semibold text-slate-700">{averageAgeDays} days</span>
        </div>
      </div>
    </div>
  );
}
