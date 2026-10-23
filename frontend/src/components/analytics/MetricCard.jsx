import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  changeType = 'positive',
  gradient = 'from-blue-500 to-indigo-600'
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-sm`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {change ? (
          <div className="flex items-center gap-1 font-semibold">
            {changeType === 'positive' && (
              <span className="text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                {change}
              </span>
            )}
            {changeType === 'negative' && (
              <span className="text-rose-600 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {change}
              </span>
            )}
            {changeType === 'neutral' && (
              <span className="text-slate-500 flex items-center">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                {change}
              </span>
            )}
            <span className="text-slate-400 font-normal">vs prev cycle</span>
          </div>
        ) : (
          <span className="text-slate-400">{subtitle || 'Updated live'}</span>
        )}

        {subtitle && change && (
          <span className="text-slate-400 truncate max-w-[130px]">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
