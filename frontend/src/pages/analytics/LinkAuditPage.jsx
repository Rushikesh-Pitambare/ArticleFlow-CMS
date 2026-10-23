import React, { useState, useEffect } from 'react';
import {
  Link2,
  RefreshCw,
  CheckCircle,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Edit,
  Globe
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { useAnalyticsScope } from './AnalyticsScope';

export default function LinkAuditPage({ onEditArticle }) {
  const { isAdmin, adminSelectedAuthorId } = useAnalyticsScope();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditNotice, setAuditNotice] = useState(null);
  const [filterType, setFilterType] = useState('broken'); // 'broken', 'all', 'valid'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const res = await analyticsAPI.getArticles({ authorId: authorFilter || undefined });
      if (res.success) {
        setArticles(res.articles);
      }
    } catch (err) {
      console.error('Failed to fetch articles for link audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [isAdmin, adminSelectedAuthorId]);

  const handleBulkScan = async () => {
    setAuditing(true);
    setAuditNotice(null);
    try {
      const authorFilter = isAdmin ? adminSelectedAuthorId : null;
      const res = await analyticsAPI.bulkAuditLinks(authorFilter);
      if (res.success) {
        setAuditNotice(`Audit finished: Checked ${res.articlesScanned} articles and flagged ${res.brokenLinksFound} broken link(s).`);
        await fetchArticles();
      }
    } catch (err) {
      alert(`Bulk audit failed: ${err.message}`);
    } finally {
      setAuditing(false);
    }
  };

  // Flatten all links from all articles
  const allLinks = [];
  let totalAuditLinks = 0;
  let totalBroken = 0;

  articles.forEach(art => {
    const audit = art.linksAudit || { totalLinks: 0, brokenLinksCount: 0, links: [] };
    totalAuditLinks += audit.totalLinks || 0;
    totalBroken += audit.brokenLinksCount || 0;

    if (audit.links) {
      audit.links.forEach(link => {
        allLinks.push({
          ...link,
          articleId: art.id,
          articleTitle: art.title,
          authorName: art.authorName,
          category: art.category
        });
      });
    }
  });

  const healthyLinksCount = totalAuditLinks - totalBroken;
  const linkHealthRate = totalAuditLinks > 0 ? Math.round((healthyLinksCount / totalAuditLinks) * 100) : 100;

  // Filter links
  const filteredLinks = allLinks.filter(item => {
    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'broken'
        ? item.isBroken
        : !item.isBroken;

    const matchesSearch =
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.articleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Link2 className="w-4 h-4" />
            Hyperlink Integrity & Availability Auditor
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Article External Link Verification
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Performs real-time HTTP HEAD & GET requests against all embedded URLs in your technical documentation. Detects 404 Not Found, 500 Server Errors, and dead hostnames to prevent broken reader experiences.
          </p>
        </div>

        {/* Audit Action Button */}
        <button
          onClick={handleBulkScan}
          disabled={auditing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
          {auditing ? 'Auditing URLs Across Database...' : 'Run Full Link Audit'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Links Monitored</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalAuditLinks}</div>
          <span className="text-[11px] text-slate-500">Across {articles.length} articles</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-rose-500 uppercase">Broken Links</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{totalBroken}</div>
          <span className="text-[11px] text-rose-500">HTTP 404/500/timeout</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 uppercase">Healthy Links</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{healthyLinksCount}</div>
          <span className="text-[11px] text-emerald-600">Resolving 200 OK</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Link Integrity Score</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{linkHealthRate}%</div>
          <span className="text-[11px] text-slate-500">Health availability index</span>
        </div>
      </div>

      {/* Audit Notice */}
      {auditNotice && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span>{auditNotice}</span>
          </div>
          <button onClick={() => setAuditNotice(null)} className="text-indigo-400 hover:text-indigo-700">✕</button>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Toggle Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('broken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'broken'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Broken Links ({totalBroken})
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Links ({totalAuditLinks})
          </button>
          <button
            onClick={() => setFilterType('valid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'valid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Valid Links ({healthyLinksCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by URL or article..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Links Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-semibold uppercase">
          Loading hyperlink database...
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Broken Links Detected!</h3>
          <p className="text-xs text-slate-500 mt-1">
            All hyperlinks in this view are healthy and successfully returning HTTP 200 OK.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Anchor Text / Link</th>
                  <th className="py-3 px-4">Article Source</th>
                  <th className="py-3 px-4">HTTP Code</th>
                  <th className="py-3 px-4">Last Checked</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.map((item, idx) => {
                  const isBroken = item.isBroken;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isBroken
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isBroken ? <AlertOctagon className="w-3 h-3 text-rose-600" /> : <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {isBroken ? 'BROKEN' : 'VALID'}
                        </span>
                      </td>

                      {/* Anchor and URL */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 truncate">{item.text}</div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 truncate font-mono mt-0.5"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                        </a>
                      </td>

                      {/* Article */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">{item.articleTitle}</div>
                        <span className="text-[10px] text-slate-400">Author: {item.authorName}</span>
                      </td>

                      {/* HTTP Status */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            isBroken
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.status ? `${item.status} ${item.statusText}` : item.statusText}
                        </span>
                      </td>

                      {/* Checked Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {item.checkedAt ? item.checkedAt.split('T')[0] : 'Pending'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onEditArticle && (
                          <button
                            onClick={() => {
                              const targetArticle = articles.find(a => a.id === item.articleId);
                              if (targetArticle) onEditArticle(targetArticle);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
                          >
                            <Edit className="w-3 h-3" />
                            Fix Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
