import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { moderationAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AIModerationDashboard = () => {
  const { token, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalScanned: 0,
    lowRisk: 0,
    moderateRisk: 0,
    highRisk: 0,
    averageScore: 0,
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rescanningId, setRescanningId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [reportFilter, setReportFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, contentRes] = await Promise.all([
        moderationAPI.getStats(),
        moderationAPI.getContent({
          level: levelFilter !== 'all' ? levelFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        }),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
      if (contentRes.data?.success) {
        setItems(contentRes.data.items || []);
      }
    } catch (err) {
      console.error('Fetch Moderation Data Error:', err);
      setError(err.response?.data?.message || 'Failed to load AI moderation records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError('');

    try {
      const response = await reportAPI.getReports();
      if (response.data?.success) {
        setReports(response.data.reports || []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Fetch Reports Error:', error);
      setReportsError(
        error.response?.data?.message || error.message || 'Failed to load reports.'
      );
    } finally {
      setReportsLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      setReportsError('');
      const response = await reportAPI.updateReportStatus(reportId, { status });

      if (response.data?.success) {
        setReports((prev) =>
          prev.map((report) =>
            report._id === reportId || report.id === reportId
              ? { ...report, status }
              : report
          )
        );
      }
    } catch (error) {
      console.error('Update Report Status Error:', error);
      setReportsError(
        error.response?.data?.message || error.message || 'Failed to update report status.'
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [levelFilter, typeFilter]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchReports();
    }
  }, [token, isAdmin]);

  const handleRescan = async (type, id) => {
    setRescanningId(id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await moderationAPI.rescanContent(type, id);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Content successfully rescanned with AI.');
        fetchData();
        if (selectedItem && selectedItem._id === id) {
          setSelectedItem((prev) => ({
            ...prev,
            aiModeration: res.data.aiModeration,
            status: res.data.status,
          }));
        }
      }
    } catch (err) {
      console.error('Rescan error:', err);
      setError(err.response?.data?.message || 'Failed to rescan content.');
    } finally {
      setRescanningId(null);
    }
  };

  const getAuthorName = (author) => {
    if (!author) return 'Unknown Author';
    if (typeof author === 'object') return author.name || author.email || 'Unknown Author';
    return String(author);
  };

  const getAuthorEmail = (author, fallbackEmail) => {
    if (typeof author === 'object' && author?.email) return author.email;
    return fallbackEmail || '';
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();

    const titleMatch = item.title?.toLowerCase().includes(q);

    const authorStr = getAuthorName(item.author).toLowerCase();
    const authorMatch = authorStr.includes(q);

    const flagsMatch = item.aiModeration?.flags?.some((f) =>
      f.toLowerCase().includes(q)
    );

    return titleMatch || authorMatch || flagsMatch;
  });

  const pendingReports = reports.filter(
    (report) => report.status === 'pending'
  ).length;

  const resolvedReports = reports.filter(
    (report) => report.status === 'resolved'
  ).length;

  const dismissedReports = reports.filter(
    (report) => report.status === 'dismissed'
  ).length;

  const getRiskBadge = (level, score) => {
    switch (level) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Low Risk ({score ?? 0})
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Moderate ({score ?? 0})
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            High Risk ({score ?? 0})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Unscanned
          </span>
        );
    }
  };

  const getScoreBar = (score, level) => {
    const s = Math.min(100, Math.max(0, score || 0));
    let colorClass = 'bg-emerald-500';
    if (level === 'moderate' || (s >= 40 && s < 70)) colorClass = 'bg-amber-500';
    if (level === 'high' || s >= 70) colorClass = 'bg-rose-500';

    return (
      <div className="w-full max-w-[120px]">
        <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
          <span>Score</span>
          <span className="font-semibold text-slate-700">{score ?? '--'}/100</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${score !== null ? s : 0}%` }}
          />
        </div>
      </div>
    );
  };

  const [scanningAll, setScanningAll] = useState(false);
  const [rescanningAll, setRescanningAll] = useState(false);

  const handleScanAll = async () => {
    setScanningAll(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await moderationAPI.scanAll();
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'All items have been analyzed.');
        fetchData();
      }
    } catch (err) {
      console.error('Scan all error:', err);
      setError(err.response?.data?.message || 'Failed to scan all items.');
    } finally {
      setScanningAll(false);
    }
  };

  const handleRescanAll = async () => {
    if (!window.confirm('This will rescan ALL content with Gemini AI (including already-scanned items). This may take a minute. Proceed?')) return;
    setRescanningAll(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await moderationAPI.rescanAll();
      if (res.data?.success) {
        setSuccessMsg(`Γ£à ${res.data.message}`);
        fetchData();
      }
    } catch (err) {
      console.error('Rescan all error:', err);
      setError(err.response?.data?.message || 'Failed to rescan all content.');
    } finally {
      setRescanningAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl backdrop-blur-md">
            <Bot className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">AI Content Moderation Engine</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Automated multi-tier safety scanning: Low risk (0-39) auto-publishes, moderate (40-69) notifies admin, high (70-100) is blocked.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleScanAll}
            disabled={scanningAll || rescanningAll || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/40 text-white font-medium text-sm transition-all shadow-md self-start md:self-auto disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${scanningAll ? 'animate-spin' : ''}`} />
            {scanningAll ? 'Scanning...' : 'Scan New Items'}
          </button>
          <button
            onClick={handleRescanAll}
            disabled={rescanningAll || scanningAll || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-400/40 text-white font-medium text-sm transition-all shadow-md self-start md:self-auto disabled:opacity-50"
            title="Force rescan ALL content with Gemini AI (fixes stale 0-score records)"
          >
            <ShieldAlert className={`w-4 h-4 ${rescanningAll ? 'animate-spin' : ''}`} />
            {rescanningAll ? 'Rescanning All...' : 'Rescan All with AI'}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition-all duration-150 backdrop-blur-md self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Info Tip about Risk Score meaning */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">How Risk Scores Work:</span> Risk score measures <span className="font-semibold">danger/violations</span>. A score of <span className="font-semibold text-emerald-700">0/100 means 0% Risk (Completely Clean & Safe)</span>, which is why clean articles auto-publish immediately. Higher scores represent higher violation severity (40-69 = Moderate, 70-100 = High).
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scanned */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Scanned</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{stats.totalScanned}</span>
            <span className="text-xs text-slate-400">items analyzed</span>
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Low Risk (0-39)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.lowRisk}</span>
            <span className="text-xs font-medium text-emerald-600">Auto-published</span>
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Moderate Risk (40-69)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.moderateRisk}</span>
            <span className="text-xs font-medium text-amber-600">Requires Admin Review</span>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">High Risk (70-100)</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">{stats.highRisk}</span>
            <span className="text-xs font-medium text-rose-600">Blocked Immediately</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Risk Level Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'all', label: 'All Content' },
            { id: 'low', label: '🟢 Low' },
            { id: 'moderate', label: '🟡 Moderate' },
            { id: 'high', label: '🔴 High' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLevelFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                levelFilter === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="article">Articles Only</option>
            <option value="quiz">Quizzes Only</option>
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, author, flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
            <p className="text-sm font-medium">Scanning & loading content items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No items match the current filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting another risk level or clearing your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Content Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">AI Score</th>
                  <th className="px-4 py-3">Detected Flags</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const mod = item.aiModeration || {};
                  return (
                    <tr key={`${item.type}-${item._id}`} className="hover:bg-slate-50/75 transition-colors">
                      {/* Title */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 max-w-[240px] truncate" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-slate-800">{getAuthorName(item.author)}</div>
                        {getAuthorEmail(item.author, item.authorEmail) && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {getAuthorEmail(item.author, item.authorEmail)}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            item.type === 'article'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Risk Level Badge */}
                      <td className="px-4 py-3.5">{getRiskBadge(mod.level, mod.score)}</td>

                      {/* AI Score Bar */}
                      <td className="px-4 py-3.5">{getScoreBar(mod.score, mod.level)}</td>

                      {/* Detected Flags */}
                      <td className="px-4 py-3.5">
                        {mod.flags && mod.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {mod.flags.slice(0, 2).map((flag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rose-50 text-rose-600 border border-rose-200"
                              >
                                {flag}
                              </span>
                            ))}
                            {mod.flags.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{mod.flags.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                            item.status === 'published' || item.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors"
                          title="View Details"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleRescan(item.type, item._id)}
                          disabled={rescanningId === item._id}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                          title="Re-run AI scan"
                        >
                          {rescanningId === item._id ? (
                            <RefreshCw className="w-3 h-3 animate-spin inline" />
                          ) : (
                            'Re-scan'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER REPORTS */}

      <div
        id="reports-section"
        className="bg-white border border-[#EDE8DF] rounded-3xl p-5 sm:p-7"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              User Reports
            </h3>

            <p className="text-[11px] text-stone-500 mt-1">
              Review reports submitted by users and manage their status.
            </p>
          </div>

          <div className="flex items-center gap-2">

            <select
              value={reportFilter}
              onChange={(e) =>
                setReportFilter(e.target.value)
              }
              className="px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <button
              onClick={fetchReports}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs font-semibold text-stone-700 hover:bg-[#F3EEE5]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

          </div>
        </div>

        {/* REPORT SUMMARY */}

        <div className="grid grid-cols-3 gap-3 mb-6">

          <div className="border border-amber-100 bg-amber-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Pending
            </p>

            <p className="text-2xl font-bold text-amber-800 mt-2">
              {pendingReports}
            </p>
          </div>

          <div className="border border-emerald-100 bg-emerald-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Resolved
            </p>

            <p className="text-2xl font-bold text-emerald-800 mt-2">
              {resolvedReports}
            </p>
          </div>

          <div className="border border-stone-200 bg-stone-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">
              Dismissed
            </p>

            <p className="text-2xl font-bold text-stone-700 mt-2">
              {dismissedReports}
            </p>
          </div>

        </div>

        {/* REPORT TABLE */}

        <div className="border border-[#EDE8DF] rounded-2xl overflow-hidden">

          {reportsLoading ? (
            <div className="py-12 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading reports...</p>
            </div>

          ) : reportsError ? (
            <div className="py-12 text-center text-rose-500">
              <XCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">{reportsError}</p>
            </div>

          ) : reports.filter(
            (report) =>
              reportFilter === 'all' ||
              report.status === reportFilter
          ).length === 0 ? (

            <div className="py-12 text-center text-stone-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-medium">
                No reports found.
              </p>
              <p className="text-xs mt-1">
                There are no reports matching the selected filter.
              </p>
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">
                  <tr>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Reported Item
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Reason
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Reported By
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500 text-right">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDE8DF]">

                  {reports
                    .filter(
                      (report) =>
                        reportFilter === 'all' ||
                        report.status === reportFilter
                    )
                  .map((report) => (

                    <tr
                      key={report._id}
                      className="hover:bg-[#FAF7F2] transition-colors"
                    >

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold">
                          {report.type || 'Other'}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-stone-800 max-w-[220px] truncate">
                          {report.item || 'Unknown item'}
                        </p>

                        {report.description && (
                          <p className="text-[10px] text-stone-400 mt-1 max-w-[220px] truncate">
                            {report.description}
                          </p>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-stone-700">
                          {report.reason || 'No reason provided'}
                        </span>
                      </td>

                      {/* Reported By */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-stone-800">
                          {typeof report.reportedBy === 'object'
                            ? (report.reportedBy?.name || report.reportedBy?.email || 'User')
                            : (report.reportedBy || (typeof report.reporterId === 'object' ? (report.reporterId?.name || report.reporterId?.email) : 'User'))}
                        </p>

                        {report.reporterId && (
                          <p className="text-[10px] text-stone-400 mt-1">
                            {typeof report.reporterId === 'object'
                              ? (report.reporterId?.email || report.reporterId?.name || report.reporterId?._id)
                              : String(report.reporterId)}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
                            report.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : report.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {report.status}
                        </span>

                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">

                        <div className="flex justify-end gap-2">

                          {report.status !== 'resolved' && (
                            <button
                              onClick={() =>
                                updateReportStatus(
                                  report._id,
                                  'resolved'
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolve
                            </button>
                          )}

                          {report.status !== 'dismissed' && (
                            <button
                              onClick={() =>
                                updateReportStatus(
                                  report._id,
                                  'dismissed'
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 text-[10px] font-semibold hover:bg-stone-100 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Dismiss
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">AI Moderation Report</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                Γ£ò
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Title</span>
                <p className="font-semibold text-slate-800 text-base">{selectedItem.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Author</span>
                  <p className="text-xs font-medium text-slate-700">{getAuthorName(selectedItem.author)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Content Type</span>
                  <p className="text-xs font-medium capitalize text-slate-700">{selectedItem.type}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Status</span>
                  <p className="text-xs font-semibold capitalize text-slate-800">{selectedItem.status}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Risk Level</span>
                  <div className="mt-1">
                    {getRiskBadge(selectedItem.aiModeration?.level, selectedItem.aiModeration?.score)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">AI Risk Score</span>
                <div className="mt-1">
                  {getScoreBar(selectedItem.aiModeration?.score, selectedItem.aiModeration?.level)}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Detected Violations / Flags</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedItem.aiModeration?.flags?.length > 0 ? (
                    selectedItem.aiModeration.flags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-600 border border-rose-200"
                      >
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No violation flags detected.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">AI Explanation & Rationale</span>
                <p className="mt-1 text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedItem.aiModeration?.reason || 'No detailed rationale recorded.'}
                </p>
              </div>

              {selectedItem.aiModeration?.checkedAt && (
                <div className="text-[11px] text-slate-400">
                  Last scanned: {new Date(selectedItem.aiModeration.checkedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleRescan(selectedItem.type, selectedItem._id)}
                disabled={rescanningId === selectedItem._id}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {rescanningId === selectedItem._id ? 'Re-scanning...' : 'Re-scan with AI'}
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModerationDashboard;
