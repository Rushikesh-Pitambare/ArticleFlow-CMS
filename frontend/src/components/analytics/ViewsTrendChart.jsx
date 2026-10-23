import React, { useState } from 'react';
import { Calendar, Eye } from 'lucide-react';

export default function ViewsTrendChart({ data = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <Calendar className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-sm">No trend data available for current date range</p>
      </div>
    );
  }

  // Dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.views), 10);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.views - minVal) / (maxVal - minVal)) * chartHeight;
    return { ...d, x, y };
  });

  // SVG path generation
  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    // Smooth quadratic curve
    const prev = points[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const totalPeriodViews = data.reduce((sum, d) => sum + d.views, 0);
  const avgDailyViews = Math.round(totalPeriodViews / data.length);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">14-Day Traffic Velocity</span>
          <p className="text-xs text-slate-400">Daily aggregate views across all scoped articles</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Average: </span>
          <span className="text-xs font-bold text-slate-800">{avgDailyViews.toLocaleString()} views/day</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#viewsAreaGrad)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots & hover targets */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.date === pt.date;
            return (
              <g key={i}>
                {/* Visual circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#4338ca' : '#6366f1'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                {/* Hit target */}
                <rect
                  x={pt.x - 12}
                  y={padding.top}
                  width={24}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* X axis labels (show every 2-3 points to avoid crowding) */}
          {points.map((pt, i) => {
            if (i % 3 !== 0 && i !== points.length - 1) return null;
            const shortDate = pt.date.slice(5); // MM-DD
            return (
              <text
                key={i}
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {shortDate}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 transition-all -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              marginTop: '-10px'
            }}
          >
            <div className="font-semibold text-[11px] text-slate-300">{hoveredPoint.date}</div>
            <div className="flex items-center gap-1.5 mt-0.5 text-indigo-300 font-bold">
              <Eye className="w-3 h-3" />
              <span>{hoveredPoint.views.toLocaleString()} views</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
