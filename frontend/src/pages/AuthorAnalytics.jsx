import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Trophy, Layers, AlertTriangle, Link2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import { AnalyticsScopeProvider } from './analytics/AnalyticsScope';
import OverviewPage from './analytics/OverviewPage';
import TopArticlesPage from './analytics/TopArticlesPage';
import PopularTopicsPage from './analytics/PopularTopicsPage';
import FreshnessAlertsPage from './analytics/FreshnessAlertsPage';
import LinkAuditPage from './analytics/LinkAuditPage';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'top-articles', label: 'Top Articles', icon: Trophy },
  { id: 'topics', label: 'Popular Topics', icon: Layers },
  { id: 'freshness', label: 'Freshness Alerts', icon: AlertTriangle },
  { id: 'links', label: 'Link Audit', icon: Link2 },
];

export default function AuthorAnalytics() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [authors, setAuthors] = useState([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');

  const authorFilter = isAdmin ? selectedAuthorId : '';

  // Admin only: build the author dropdown from the articles the API returns.
  useEffect(() => {
    if (!isAdmin) return;
    analyticsAPI
      .getArticles()
      .then((res) => {
        const byId = new Map();
        (res.articles || []).forEach((a) => byId.set(a.authorId, a.authorName));
        setAuthors(
          Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      })
      .catch((err) => console.error('Could not load authors list:', err));
  }, [isAdmin]);

  // Badge on the Freshness tab.
  useEffect(() => {
    let cancelled = false;
    analyticsAPI
      .getFreshnessAlerts('all', authorFilter || null)
      .then((res) => {
        if (!cancelled && res.success) setAlertCount(res.totalAlerts || 0);
      })
      .catch((err) => console.error('Could not load alert count:', err));
    return () => {
      cancelled = true;
    };
  }, [authorFilter, refreshKey]);

  const scopeLabel = useMemo(() => {
    if (!isAdmin) return 'Your articles';
    const picked = authors.find((a) => a.id === selectedAuthorId);
    return picked ? `Author: ${picked.name}` : 'All authors';
  }, [isAdmin, authors, selectedAuthorId]);

  return (
    <AnalyticsScopeProvider authorId={authorFilter}>
      <div className="min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Author Analytics &amp; Freshness Alerts
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Views, engagement, content freshness and link health &middot; {scopeLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <select
                  value={selectedAuthorId}
                  onChange={(e) => setSelectedAuthorId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  aria-label="Filter analytics by author"
                >
                  <option value="">All authors</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    active
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'freshness' && alertCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <main className="pb-16" key={`${refreshKey}-${authorFilter}`}>
          {activeTab === 'overview' && <OverviewPage setActiveTab={setActiveTab} />}
          {activeTab === 'top-articles' && <TopArticlesPage />}
          {activeTab === 'topics' && <PopularTopicsPage />}
          {activeTab === 'freshness' && <FreshnessAlertsPage />}
          {activeTab === 'links' && <LinkAuditPage />}
        </main>
      </div>
    </AnalyticsScopeProvider>
  );
}
