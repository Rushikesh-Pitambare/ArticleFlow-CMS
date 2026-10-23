import React, { useState, useEffect } from 'react';
import {
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import MetricCard from '../../components/analytics/MetricCard';
import ViewsTrendChart from '../../components/analytics/ViewsTrendChart';
import FreshnessDonutChart from '../../components/analytics/FreshnessDonutChart';
import { analyticsAPI } from '../../services/api';
import { useAnalyticsScope } from './AnalyticsScope';

export default function OverviewPage({ setActiveTab, onNewArticle }) {
  const { user, isAdmin, adminSelectedAuthorId } = useAnalyticsScope();
  const [data, setData] = useState(null);
  const [topArticles, setTopArticles] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const [overviewRes, topRes, topicsRes] = await Promise.all([
        analyticsAPI.getOverview(authorFilter),
        analyticsAPI.getTopArticles(3, authorFilter),
        analyticsAPI.getPopularTopics(authorFilter)
      ]);

      if (overviewRes.success) setData(overviewRes.analytics);
      if (topRes.success) setTopArticles(topRes.articles);
      if (topicsRes.success) setPopularTopics(topicsRes.topics);
    } catch (err) {
      console.error('Failed to load overview analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, adminSelectedAuthorId]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Aggregating real-time author telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800">
          <h3 className="font-bold text-sm">Failed to load analytics</h3>
          <p className="text-xs mt-1 text-rose-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalArticles = 0,
    totalViews = 0,
    totalLikes = 0,
    totalShares = 0,
    totalComments = 0,
    overallEngagementRate = 0,
    freshnessSummary = {},
    viewsTrend = []
  } = data || {};

  const outdatedCount = freshnessSummary.outdatedCount || 0;
  const needsReviewCount = freshnessSummary.needsReviewCount || 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Alert Banner for Outdated / Review Queue */}
      {needsReviewCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Freshness Action Required: {needsReviewCount} article(s) flagged for review
              </h3>
              <p className="text-xs text-slate-600">
                {outdatedCount > 0
                  ? `${outdatedCount} articles exceed the 180-day freshness threshold or contain broken hyperlinks.`
                  : 'Articles are approaching expiration or require editorial verification.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('freshness')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all whitespace-nowrap"
          >
            Review Flagged Articles
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={Eye}
          change="+18.4%"
          changeType="positive"
          subtitle={`${totalArticles} articles`}
          gradient="from-blue-500 to-indigo-600"
        />
        <MetricCard
          title="Total Likes"
          value={totalLikes.toLocaleString()}
          icon={Heart}
          change="+12.1%"
          changeType="positive"
          gradient="from-rose-500 to-pink-600"
        />
        <MetricCard
          title="Total Shares"
          value={totalShares.toLocaleString()}
          icon={Share2}
          change="+9.5%"
          changeType="positive"
          gradient="from-violet-500 to-purple-600"
        />
        <MetricCard
          title="Total Comments"
          value={totalComments.toLocaleString()}
          icon={MessageSquare}
          change="+15.3%"
          changeType="positive"
          gradient="from-amber-500 to-orange-600"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${overallEngagementRate}%`}
          icon={Activity}
          change="+2.8%"
          changeType="positive"
          subtitle="((L+S+C)/Views)*100"
          gradient="from-emerald-500 to-teal-600"
        />
        <MetricCard
          title="Freshness Score"
          value={`${freshnessSummary.healthScore || 100}%`}
          icon={ShieldCheck}
          change={outdatedCount === 0 ? 'Healthy' : `${outdatedCount} Outdated`}
          changeType={outdatedCount === 0 ? 'positive' : 'negative'}
          subtitle={`Avg age: ${freshnessSummary.averageAgeDays || 0}d`}
          gradient="from-indigo-600 to-cyan-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Velocity (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <ViewsTrendChart data={viewsTrend} />
        </div>

        {/* Content Freshness Breakdown (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content Freshness</span>
                <p className="text-xs text-slate-400">Lifecycle distribution & SLA health</p>
              </div>
              <button
                onClick={() => setActiveTab('freshness')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Queue
              </button>
            </div>
            <FreshnessDonutChart summary={freshnessSummary} />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Thresholds: Fresh &lt;90d, Aging 90-180d, Outdated &gt;180d</span>
          </div>
        </div>
      </div>

      {/* Highlights: Top Articles and Popular Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Articles Snapshot */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Best-Performing Articles</h2>
            </div>
            <button
              onClick={() => setActiveTab('top-articles')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              See All Ranked
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topArticles.map((art, idx) => (
              <div
                key={art.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : idx === 1
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}
                  >
                    #{art.rank || idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{art.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {art.category}
                      </span>
                      <span>•</span>
                      <span>{art.metrics.views.toLocaleString()} views</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{art.engagementRate}% eng.</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-indigo-700">
                    {art.compositeScore?.toLocaleString()} pts
                  </span>
                  <div className="text-[10px] text-slate-400">Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Topics Snapshot */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Popular Topics & Categories</h2>
            </div>
            <button
              onClick={() => setActiveTab('topics')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Explore Trends
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {popularTopics.slice(0, 3).map(topic => (
              <div
                key={topic.name}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/40 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{topic.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{topic.articleCount} articles</span>
                    <span>•</span>
                    <span>{topic.totalViews.toLocaleString()} total views</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-semibold">{topic.avgEngagementRate}% avg eng.</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">
                    {topic.totalEngagement.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-slate-400">Interactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
