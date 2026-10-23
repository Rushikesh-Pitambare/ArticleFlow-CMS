import React, { useState, useEffect } from 'react';
import { Tag, TrendingUp, BarChart2, Eye, Activity, Layers, ArrowUpRight } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { useAnalyticsScope } from './AnalyticsScope';

export default function PopularTopicsPage() {
  const { isAdmin, adminSelectedAuthorId } = useAnalyticsScope();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const res = await analyticsAPI.getPopularTopics(authorFilter);
      if (res.success) {
        setTopics(res.topics);
      }
    } catch (err) {
      console.error('Failed to load popular topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [isAdmin, adminSelectedAuthorId]);

  const maxEngagement = Math.max(...topics.map(t => t.totalEngagement), 1);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            Topic & Category Performance Matrix
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Audience Interest & Subject Matter Resonance
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Identifies which technical domains drive the highest reader acquisition, retention, and interaction velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Categories</span>
            <div className="text-lg font-bold text-slate-900">{topics.length}</div>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-semibold uppercase">
          Synthesizing topic telemetry...
        </div>
      ) : topics.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          No topic data available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, idx) => {
            const relativePopularity = Math.round((topic.totalEngagement / maxEngagement) * 100);

            return (
              <div
                key={topic.name}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      #{idx + 1} Ranked
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {topic.articleCount} {topic.articleCount === 1 ? 'Article' : 'Articles'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{topic.name}</h3>

                  {/* Relative engagement progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Resonance Index</span>
                      <span className="font-bold text-indigo-600">{relativePopularity}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${relativePopularity}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Views</span>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        {topic.totalViews.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Interactions</span>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        {topic.totalEngagement.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Avg Views/Art</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        {topic.avgViewsPerArticle.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Avg Engagement</span>
                      <div className="text-sm font-bold text-indigo-600 mt-0.5">
                        {topic.avgEngagementRate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Tags */}
                {topic.tags && topic.tags.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Related Keywords</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {topic.tags.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
