import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Activity,
  Calendar,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { useAnalyticsScope } from './AnalyticsScope';

export default function TopArticlesPage({ onEditArticle }) {
  const { isAdmin, adminSelectedAuthorId } = useAnalyticsScope();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTopArticles = async () => {
    setLoading(true);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const res = await analyticsAPI.getTopArticles(20, authorFilter);
      if (res.success) {
        setArticles(res.articles);
      }
    } catch (err) {
      console.error('Failed to fetch top articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopArticles();
  }, [isAdmin, adminSelectedAuthorId]);

  const categories = ['all', ...new Set(articles.map(a => a.category))];

  const filtered = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Formula Explainer Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            Composite Performance Ranking Engine
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Author Content Leaderboard & Telemetry
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Articles are ranked using a multi-factor composite algorithm:
            <code className="bg-slate-800/80 text-amber-300 px-2 py-0.5 rounded mx-1 text-[11px] font-mono">
              Score = (Views × 1) + (Likes × 5) + (Comments × 8) + (Shares × 10)
            </code>
            with active engagement weighting.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[140px]">
          <span className="text-[10px] font-semibold uppercase text-slate-300">Total Ranked</span>
          <div className="text-2xl font-black text-amber-300">{articles.length}</div>
          <span className="text-[10px] text-slate-300">Published Articles</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by title or tags..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-semibold uppercase">
          Calculating rankings...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          No matching articles found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(art => {
            const isTop3 = art.rank <= 3;
            const rankBadgeColor =
              art.rank === 1
                ? 'bg-amber-400 text-amber-950 shadow-amber-300/50'
                : art.rank === 2
                ? 'bg-slate-300 text-slate-900 shadow-slate-300/50'
                : art.rank === 3
                ? 'bg-amber-700 text-white shadow-amber-700/50'
                : 'bg-slate-100 text-slate-600 border border-slate-200';

            const freshnessStatus = art.freshness?.status || 'fresh';

            return (
              <div
                key={art.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Rank & Title */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 ${rankBadgeColor}`}
                  >
                    #{art.rank}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {art.category}
                      </span>
                      {art.freshness && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            freshnessStatus === 'fresh'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : freshnessStatus === 'aging'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {freshnessStatus === 'fresh' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {freshnessStatus === 'aging' && <Clock className="w-3 h-3 text-amber-600" />}
                          {freshnessStatus === 'outdated' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {art.freshness.daysSinceUpdate}d old
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">By {art.authorName}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1 truncate hover:text-indigo-600 cursor-pointer">
                      {art.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {art.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 text-slate-600 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics Grid & Score */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Eye className="w-3 h-3" />
                        <span>Views</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {art.metrics.views.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>Likes</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {art.metrics.likes.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <Share2 className="w-3 h-3 text-violet-500" />
                        <span>Shares</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {art.metrics.shares.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <MessageSquare className="w-3 h-3 text-amber-500" />
                        <span>Comments</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {art.metrics.comments.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right border-l border-slate-100 pl-4 min-w-[90px]">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Engagement
                    </div>
                    <div className="text-xs font-bold text-emerald-600">{art.engagementRate}%</div>
                    <div className="text-sm font-black text-indigo-700 mt-0.5">
                      {art.compositeScore?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
