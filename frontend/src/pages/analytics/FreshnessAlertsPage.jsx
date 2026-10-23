import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Edit,
  ShieldAlert,
  Calendar,
  Sparkles,
  Link2,
  FileCheck,
  Filter
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { useAnalyticsScope } from './AnalyticsScope';

export default function FreshnessAlertsPage({ onEditArticle }) {
  const { isAdmin, adminSelectedAuthorId } = useAnalyticsScope();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'outdated', 'aging', 'broken_links'
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const res = await analyticsAPI.getFreshnessAlerts(filter, authorFilter);
      if (res.success) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.error('Failed to load freshness alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter, isAdmin, adminSelectedAuthorId]);

  const handleMarkReviewed = async (articleId, title) => {
    setProcessingId(articleId);
    try {
      const res = await analyticsAPI.markArticleReviewed(articleId);
      if (res.success) {
        setActionSuccess(`Successfully verified and refreshed "${title}"!`);
        // Remove from current alerts list
        setAlerts(prev => prev.filter(a => a.id !== articleId));
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAuditSingle = async (articleId) => {
    setProcessingId(articleId);
    try {
      const res = await analyticsAPI.auditArticleLinks(articleId);
      if (res.success) {
        setActionSuccess(`Link audit complete for article. Broken links: ${res.linksAudit.brokenLinksCount}`);
        fetchAlerts();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(`Audit failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Alert Header / Policy Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Editorial Freshness & Outdated Detection Queue
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Active Review Queue & Quality Governance
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Content is continuously monitored against standard freshness SLAs. Articles exceeding 180 days without technical review or referencing defunct URLs are automatically escalated here.
          </p>
        </div>

        {/* SLA Legend Badge */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block">SLA Thresholds</span>
            <span className="text-[11px] text-slate-500">Aging: &gt;90d | Outdated: &gt;180d</span>
          </div>
          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-lg font-black text-rose-600">{alerts.length}</span>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pending</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <span className="text-[11px] text-emerald-600">Timestamp refreshed to today</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Flagged Articles
        </button>
        <button
          onClick={() => setFilter('outdated')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filter === 'outdated'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Outdated (&gt;180 Days)
        </button>
        <button
          onClick={() => setFilter('broken_links')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filter === 'broken_links'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Broken Links Detected
        </button>
        <button
          onClick={() => setFilter('aging')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filter === 'aging'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Aging (90–180 Days)
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-semibold uppercase">
          Scanning freshness queue...
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 mt-1">
            All articles for this scope satisfy freshness guidelines and contain healthy hyperlinks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(item => {
            const isOutdated = item.freshness.status === 'outdated';
            const isProcessing = processingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-indigo-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.urgency === 'high'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.urgency} Urgency
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      {item.category}
                    </span>

                    {item.brokenLinksCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {item.brokenLinksCount} Broken Link(s)
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      Author: <strong className="text-slate-700">{item.authorName}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{item.title}</h3>

                  {/* Flag Reason Explainer */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Freshness Audit Reason:
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.freshness.reviewReason}</p>
                    <div className="mt-1 text-[11px] text-indigo-700 font-medium">
                      Action Required: {item.suggestedAction}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Last Updated: {item.freshness.daysSinceUpdate} days ago
                    </span>
                    <span>•</span>
                    <span>{item.metrics?.views?.toLocaleString() || 0} historical views</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 flex-shrink-0">
                  {/* Mark as Reviewed / Fresh */}
                  <button
                    onClick={() => handleMarkReviewed(item.id, item.title)}
                    disabled={isProcessing}
                    className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isProcessing ? 'Refreshing...' : 'Mark as Reviewed & Fresh'}
                  </button>

                  {/* Run live link audit on this article */}
                  <button
                    onClick={() => handleAuditSingle(item.id)}
                    disabled={isProcessing}
                    className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    Audit Hyperlinks
                  </button>

                  {/* Edit Article */}
                  {onEditArticle && (
                    <button
                      onClick={() => onEditArticle(item)}
                      className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors whitespace-nowrap"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Content
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
