import { Link, useSearchParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, articleAPI, QuizAPI } from '../services/api';
//import { userAPI, articleAPI, quizAPI } from '../services/api';
import CommentsManagement from '../components/admin/CommentsManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import SubscriptionsManagement from '../components/admin/SubscriptionsManagement';
import AIModerationDashboard from '../components/admin/AIModerationDashboard';
import AppealsManagement from '../components/admin/AppealsManagement';
import SpamAbuseManagement from '../components/admin/SpamAbuseManagement';
import TrustBadge from '../components/trust/TrustBadge';

import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  PenLine,
  BookOpen,
  FileText,
  MessageSquare,
  Flag,
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Eye,
  ChevronRight,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  Bot,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  // ==========================================
  // GENERAL
  // ==========================================

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  //add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState('author');

  // ==========================================
  // CONTENT SEARCH
  // ==========================================

  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all');

  const [quizSearch, setQuizSearch] = useState('');
  const [quizStatusFilter, setQuizStatusFilter] = useState('all');

  // ==========================================
  // VIEW MODAL
  // ==========================================

  const [viewItem, setViewItem] = useState(null);
  const [viewType, setViewType] = useState('');

  const [reviewFeedback, setReviewFeedback] = useState('');
const [reviewingArticle, setReviewingArticle] = useState(false);
  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError('');

    try {
      const response = await userAPI.getAllUsers();

      if (response.data?.success) {
        
        const fetchedUsers = response.data.users || [];

        setUsers(
          fetchedUsers.map((u) => ({
            ...u,
            trustScore:
            typeof u.trustScore === 'number' ? u.trustScore : null,
          }))
        );

      } else {
        setError('Failed to fetch users.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Error loading users from server.'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================
  // FETCH ARTICLES
  // ==========================================

  const fetchArticles = async () => {
    setLoadingArticles(true);

    try {
      const response = await articleAPI.getAllArticlesForAdmin();

      if (response.data?.success) {
        setArticles(response.data.articles || []);
      } else {
        setError('Failed to fetch articles.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Error loading articles from server.'
      );
    } finally {
      setLoadingArticles(false);
    }
  };

  // ==========================================
  // FETCH QUIZZES
  // ==========================================

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);

    try {
      const response = await QuizAPI.getAllQuizzes();

      if (response.data?.success !== false) {
        const data =
          response.data?.quizzes ||
          response.data?.data ||
          [];

        setQuizzes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Quiz loading error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load quizzes. Check the quiz API connection.'
      );
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchUsers();
    fetchArticles();
    fetchQuizzes();
  }, []);

  // ==========================================
  // USER ACTIONS
  // ==========================================

  const handleRoleChange = async (userId, newRole) => {
    setError('');

    try {
      const response = await userAPI.updateUserRole(
        userId,
        newRole
      );

      if (response.data?.success) {
        setSuccessMsg(
          response.data.message || 'User role updated.'
        );

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, role: newRole }
              : u
          )
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to update user role.'
      );
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove user "${userName}"?`
      )
    ) {
      return;
    }

    setError('');

    try {
      const response = await userAPI.deleteUser(userId);

      if (response.data?.success) {
        setSuccessMsg(
          `User "${userName}" removed successfully.`
        );

        setUsers((prev) =>
          prev.filter((u) => u.id !== userId)
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to delete user.'
      );
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    setAddingUser(true);
    setError('');

    try {
      const response = await userAPI.createUserByAdmin({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });

      if (response.data?.success) {
        setSuccessMsg(
          `New ${newUserRole} account created for ${newUserName}.`
        );

        setShowAddModal(false);

        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('password123');
        setNewUserRole('author');

        fetchUsers();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to create user.'
      );
    } finally {
      setAddingUser(false);
    }
  };

  const handleArticleReview = async (status) => {
  if (!viewItem) return;

  if (
    (status === 'changes_requested' || status === 'rejected') &&
    !reviewFeedback.trim()
  ) {
    setError(
      status === 'rejected'
        ? 'Please provide a reason for rejecting the article.'
        : 'Please provide feedback for the author.'
    );
    return;
  }

  setReviewingArticle(true);
  setError('');

  try {
    const data = {
      status,
    };

    if (
      status === 'changes_requested' ||
      status === 'rejected'
    ) {
      data.reviewFeedback = reviewFeedback.trim();
    }

    const response = await articleAPI.reviewArticle(
      viewItem._id,
      data
    );

    if (response.data?.success) {
      const message =
        status === 'published'
          ? 'Article approved and published successfully.'
          : status === 'changes_requested'
          ? 'Changes requested from the author.'
          : 'Article rejected successfully.';

      setSuccessMsg(message);

      setViewItem(null);
      setViewType('');
      setReviewFeedback('');

      await fetchArticles();
    } else {
      setError(
        response.data?.message ||
          'Failed to review article.'
      );
    }
  } catch (err) {
    setError(
      err.response?.data?.message ||
        'Failed to review article.'
    );
  } finally {
    setReviewingArticle(false);
  }
};

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole =
        roleFilter === 'all' ||
        u.role === roleFilter;

      const search = userSearch.toLowerCase();

      const matchesSearch =
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, userSearch]);

  // ==========================================
  // FILTER ARTICLES
  // ==========================================

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const title =
        article.title?.toLowerCase() || '';

      const author =
        article.author?.name?.toLowerCase() || '';

      const search =
        articleSearch.toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        author.includes(search);

      const matchesStatus =
        articleStatusFilter === 'all' ||
        article.status === articleStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    articles,
    articleSearch,
    articleStatusFilter,
  ]);

  // ==========================================
  // FILTER QUIZZES
  // ==========================================

  const filteredQuizzes = useMemo(() => {
  return quizzes.filter((quiz) => {
    // Never show draft quizzes to admin
    if (quiz.status === 'draft') {
      return false;
    }

    const title = quiz.title?.toLowerCase() || '';

    const search = quizSearch.toLowerCase();

    const matchesSearch = title.includes(search);

    const matchesStatus =
      quizStatusFilter === 'all' ||
      quiz.status === quizStatusFilter;

    return matchesSearch && matchesStatus;
  });
}, [
  quizzes,
  quizSearch,
  quizStatusFilter,
]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalUsers = users.length;

  const adminCount = users.filter(
    (u) => u.role === 'admin'
  ).length;

  const authorCount = users.filter(
    (u) => u.role === 'author'
  ).length;

  const readerCount = users.filter(
    (u) => u.role === 'reader'
  ).length;

  const publishedArticles = articles.filter(
    (a) => a.status === 'published'
  ).length;

  const pendingArticles = articles.filter(
    (a) => a.status === 'pending'
  ).length;

  const draftArticles = articles.filter(
    (a) => a.status === 'draft'
  ).length;

  const submittedQuizzes = quizzes.filter(
    (q) => q.status === 'submitted'
  ).length;

  const approvedQuizzes = quizzes.filter(
    (q) => q.status === 'approved'
  ).length;

  const pendingContent =
    pendingArticles + submittedQuizzes;

  // ==========================================
  // HELPERS
  // ==========================================

  const getInitials = (name) => {
    if (!name) return 'U';

    const parts = name.trim().split(' ');

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';

      case 'pending':
      case 'submitted':
        return 'bg-amber-50 text-amber-800 border-amber-200';

      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';

      case 'changes_requested':
        return 'bg-orange-50 text-orange-800 border-orange-200';

      case 'draft':
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const refreshAll = () => {
    fetchUsers();
    fetchArticles();
    fetchQuizzes();
  };

  // ==========================================
  // TAB CONFIG
  // ==========================================

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
    },
    {
      id: 'articles',
      label: 'Articles',
      icon: FileText,
    },
    {
      id: 'quizzes',
      label: 'Quizzes',
      icon: BookOpen,
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: MessageSquare,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: Flag,
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: ShieldCheck,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: CreditCard,
    },
    {
      id: 'appeals',
      label: 'Appeals',
      icon: ShieldAlert,
    },
    {
      id: 'spam',
      label: 'Spam & Abuse',
      icon: AlertTriangle,
    },
  ];

  // ==========================================
  // OVERVIEW
  // ==========================================

  const renderOverview = () => (
    <div className="space-y-6">

      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Platform Overview
        </h2>

        <p className="text-xs text-stone-500 mt-1">
          A quick view of Lumen platform activity and content.
        </p>
      </div>

      {/* Main Stats */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          label="Total Users"
          value={totalUsers}
          description="Registered accounts"
          icon={Users}
        />

        <StatCard
          label="Articles"
          value={articles.length}
          description={`${publishedArticles} published`}
          icon={FileText}
        />

        <StatCard
          label="Quizzes"
          value={quizzes.length}
          description={`${approvedQuizzes} approved`}
          icon={BookOpen}
        />

        <StatCard
          label="Pending Content"
          value={pendingContent}
          description="Needs attention"
          icon={Clock3}
        />

      </div>

      {/* Secondary Stats */}

      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Users
            </h3>

            <Users className="w-5 h-5 text-stone-400" />
          </div>

          <div className="mt-5 space-y-3">

            <OverviewRow
              label="Readers"
              value={readerCount}
            />

            <OverviewRow
              label="Authors"
              value={authorCount}
            />

            <OverviewRow
              label="Administrators"
              value={adminCount}
            />

          </div>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Articles
            </h3>

            <FileText className="w-5 h-5 text-stone-400" />
          </div>

          <div className="mt-5 space-y-3">
            <OverviewRow
              label="Published"
              value={publishedArticles}
            />

            <OverviewRow
              label="Pending Review"
              value={pendingArticles}
            />

            <OverviewRow
              label="Changes Requested"
              value={
                articles.filter(
                  (a) => a.status === 'changes_requested'
                ).length
              }
            />

            <OverviewRow
              label="Rejected"
              value={
                articles.filter(
                  (a) => a.status === 'rejected'
                ).length
              }
            />
          </div>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Quizzes
            </h3>

            <BookOpen className="w-5 h-5 text-stone-400" />
          </div>

          <div className="mt-5 space-y-3">

            <OverviewRow
              label="Total"
              value={quizzes.length}
            />

            <OverviewRow
              label="Submitted"
              value={submittedQuizzes}
            />

            <OverviewRow
              label="Approved"
              value={approvedQuizzes}
            />

          </div>
        </div>

      </div>

      {/* Attention */}

      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Requires Attention
            </h3>

            <p className="text-xs text-stone-500 mt-1">
              Content that may need administrative action.
            </p>
          </div>

          <AlertCircle className="w-5 h-5 text-amber-600" />

        </div>

        <div className="grid md:grid-cols-2 gap-3">

          <AttentionItem
            label="Articles awaiting review"
            value={pendingArticles}
            onClick={() => setActiveTab('articles')}
          />

          <AttentionItem
            label="Quizzes awaiting review"
            value={submittedQuizzes}
            onClick={() => setActiveTab('quizzes')}
          />

        </div>

      </div>

    </div>
  );

  // ==========================================
  // USERS
  // ==========================================

  const renderUsers = () => (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            User Management
          </h2>

          <p className="text-xs text-stone-500 mt-1">
            Manage platform accounts and user roles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A382B] hover:bg-[#11261D] text-white rounded-xl text-xs font-bold transition"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>

      </div>

      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-5 sm:p-7">

        <div className="flex flex-col lg:flex-row gap-3 mb-6">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />

            <input
              value={userSearch}
              onChange={(e) =>
                setUserSearch(e.target.value)
              }
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
            />

          </div>

          <div className="flex gap-1 bg-[#FAF7F2] border border-[#EDE8DF] p-1 rounded-xl">

            {['all', 'admin', 'author', 'reader'].map(
              (role) => (
                <button
                  key={role}
                  onClick={() =>
                    setRoleFilter(role)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    roleFilter === role
                      ? 'bg-[#1A382B] text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {role}
                </button>
              )
            )}

          </div>

        </div>

        {loadingUsers ? (
          <LoadingState text="Loading users..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState text="No users found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-[#F5F2EB] text-stone-500">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Trust Standing</th>
                  <th className="pb-3">Registered</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F5F2EB]">

                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-[#FAF7F2]/60"
                  >

                    <td className="py-3.5 pl-2">

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-full bg-[#1A382B] text-white flex items-center justify-center font-serif font-bold">
                          {getInitials(u.name)}
                        </div>

                        <div>
                          <span className="font-bold text-stone-900 block">
                            {u.name}
                          </span>

                          {u.bio && (
                            <span className="text-[10px] text-stone-400">
                              {u.bio}
                            </span>
                          )}
                        </div>

                      </div>

                    </td>

                    <td className="py-3.5 text-stone-600">
                      {u.email}
                    </td>

                    <td className="py-3.5">

                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value
                          )
                        }
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase ${
                          getRoleStyle(u.role)
                        }`}
                      >
                        <option value="reader">
                          READER
                        </option>
                        <option value="author">
                          AUTHOR
                        </option>
                        <option value="admin">
                          ADMIN
                        </option>
                      </select>

                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        
                      {typeof u.trustScore === 'number' ? (
                      <TrustBadge
                        score={u.trustScore}
                        level={u.trustLevel}
                        size="sm"
                        variant="compact"
                      />
                      ) : (
                        <span className="text-xs text-stone-500">
                          Score unavailable
                        </span>
                      )}

                        
                        {u.isRestricted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Restricted
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 text-stone-500">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="py-3.5 text-right">

                      {u.id !== user?.id && (
                        <button
                          onClick={() =>
                            handleDeleteUser(
                              u.id,
                              u.name
                            )
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );

  // ==========================================
  // ARTICLES
  // ==========================================

  const renderArticles = () => (
    <div className="space-y-6">

      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Article Management
        </h2>

        <p className="text-xs text-stone-500 mt-1">
          Monitor and manage all platform articles.
        </p>
      </div>

      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-5 sm:p-7">

        <div className="flex flex-col lg:flex-row gap-3 mb-6">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />

            <input
              value={articleSearch}
              onChange={(e) =>
                setArticleSearch(e.target.value)
              }
              placeholder="Search articles or authors..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
            />

          </div>

          <select
            value={articleStatusFilter}
            onChange={(e) =>
              setArticleStatusFilter(e.target.value)
            }
            className="px-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">
              Pending Review
            </option>
            <option value="changes_requested">
              Changes Requested
            </option>
            <option value="published">
              Published
            </option>
            <option value="rejected">
              Rejected
            </option>
          </select>

        </div>

        {loadingArticles ? (
          <LoadingState text="Loading articles..." />
        ) : filteredArticles.length === 0 ? (
          <EmptyState text="No articles found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-[#F5F2EB] text-stone-500">
                  <th className="pb-3 pl-2">Article</th>
                  <th className="pb-3">Author</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F5F2EB]">

                {filteredArticles.map((article) => (

                  <tr
                    key={article._id}
                    className="hover:bg-[#FAF7F2]/60"
                  >

                    <td className="py-3.5 pl-2 max-w-xs">

                      <span className="font-bold text-stone-900 line-clamp-1">
                        {article.title}
                      </span>

                    </td>

                    <td className="py-3.5 text-stone-600">
                      {article.author?.name || 'Unknown'}
                    </td>

                    <td className="py-3.5 text-stone-600">
                      {article.category}
                    </td>

                    <td className="py-3.5">

                      <span
                        className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${getStatusStyle(
                          article.status
                        )}`}
                      >
                        {article.status?.replace(
                          '_',
                          ' '
                        )}
                      </span>

                    </td>

                    <td className="py-3.5 text-stone-500">
                      {article.views || 0}
                    </td>

                    <td className="py-3.5 text-stone-500">
                      {formatDate(article.createdAt)}
                    </td>

                    <td className="py-3.5 text-right">

                      {article.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setViewItem(article);
                            setViewType('article');
                            setReviewFeedback('');
                            setError('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A382B] hover:bg-[#11261D] text-white text-[10px] font-bold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                        ) : (
                        <button
                          onClick={() => {
                            setViewItem(article);
                            setViewType('article');
                            setReviewFeedback('');
                            setError('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-[#1A382B] hover:bg-[#FAF7F2]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );

  // ==========================================
  // QUIZZES
  // ==========================================

  const renderQuizzes = () => (
    <div className="space-y-6">

      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Quiz Management
        </h2>

        <p className="text-xs text-stone-500 mt-1">
          Monitor quizzes created for the Lumen platform.
        </p>
      </div>

      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-5 sm:p-7">

        <div className="flex flex-col lg:flex-row gap-3 mb-6">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />

            <input
              value={quizSearch}
              onChange={(e) =>
                setQuizSearch(e.target.value)
              }
              placeholder="Search quizzes..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
            />

          </div>

          <select
            value={quizStatusFilter}
            onChange={(e) =>
              setQuizStatusFilter(e.target.value)
            }
            className="px-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">
              Changes Requested
            </option>
            <option value="rejected">Rejected</option>
          </select>

        </div>

        {loadingQuizzes ? (
          <LoadingState text="Loading quizzes..." />
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState text="No quizzes found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-[#F5F2EB] text-stone-500">
                  <th className="pb-3 pl-2">Quiz</th>
                  <th className="pb-3">Questions</th>
                  <th className="pb-3">Article</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F5F2EB]">

                {filteredQuizzes.map((quiz) => (

                  <tr
                    key={quiz._id}
                    className="hover:bg-[#FAF7F2]/60"
                  >

                    <td className="py-3.5 pl-2">

                      <span className="font-bold text-stone-900">
                        {quiz.title}
                      </span>

                    </td>

                    <td className="py-3.5 text-stone-600">
                      {quiz.questions?.length || 0}
                    </td>

                    <td className="py-3.5 text-stone-500">
                      {quiz.articleId
                        ? String(quiz.articleId).slice(0, 8) + '...'
                        : 'Not attached'}
                    </td>

                    <td className="py-3.5">

                      <span
                        className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${getStatusStyle(
                          quiz.status
                        )}`}
                      >
                        {quiz.status?.replace(
                          '_',
                          ' '
                        )}
                      </span>

                    </td>

                    <td className="py-3.5 text-stone-500">
                      {formatDate(quiz.createdAt)}
                    </td>

                    <td className="py-3.5 text-right">

                      <button
                        onClick={() => {
                          setViewItem(quiz);
                          setViewType('quiz');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-[#1A382B] hover:bg-[#FAF7F2]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );

  // ==========================================
  // PLACEHOLDER SECTIONS
  // ==========================================

  const renderPlaceholder = (title, description, Icon) => (
    <div className="bg-white border border-[#EDE8DF] rounded-3xl p-10 sm:p-16 text-center">

      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] border border-[#EDE8DF] flex items-center justify-center">
        <Icon className="w-6 h-6 text-stone-500" />
      </div>

      <h2 className="font-serif text-2xl font-bold text-stone-900 mt-5">
        {title}
      </h2>

      <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
        {description}
      </p>

      <div className="inline-flex items-center gap-2 mt-5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-semibold">
        <Clock3 className="w-3.5 h-3.5" />
        Backend API not connected yet
      </div>

    </div>
  );

  // ==========================================
  // CONTENT SWITCHER
  // ==========================================

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();

      case 'users':
        return renderUsers();

      case 'articles':
        return renderArticles();

      case 'quizzes':
        return renderQuizzes();

      case 'comments':
        return <CommentsManagement />;

      case 'reports':
        return <ReportsManagement />;

      case 'subscriptions':
        return <SubscriptionsManagement />;

      case 'moderation':
        return <AIModerationDashboard />;

      case 'appeals':
        return <AppealsManagement />;

      case 'spam':
        return <SpamAbuseManagement />;

      default:
        return renderOverview();
    }
  };

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

      {/* Notifications */}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>

          <button
            onClick={() => setSuccessMsg('')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">

          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>

          <button
            onClick={() => setError('')}
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator Center
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Platform Management
          </h1>

          <p className="text-xs text-stone-500 mt-1">
            Welcome back, {user?.name || 'Administrator'}.
            Manage Lumen users and content from one place.
          </p>

        </div>

        <button
          onClick={refreshAll}
          className="self-start lg:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#EDE8DF] hover:bg-[#FAF7F2] text-stone-700 rounded-xl text-xs font-semibold"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              loadingUsers ||
              loadingArticles ||
              loadingQuizzes
                ? 'animate-spin'
                : ''
            }`}
          />
          Refresh
        </button>

      </div>

      {/* Admin Navigation */}

      <div className="bg-white border border-[#EDE8DF] rounded-2xl p-1.5 overflow-x-auto">

        <div className="flex min-w-max gap-1">

          {tabs.map((tab) => {

            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() =>
                  handleTabChange(tab.id)
                }
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-[#1A382B] text-white'
                    : 'text-stone-600 hover:bg-[#FAF7F2] hover:text-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}

                {tab.id === 'overview' &&
                  pendingContent > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pendingContent}
                    </span>
                  )}

              </button>
            );

          })}

        </div>

      </div>

      {/* Current Section */}

      {renderContent()}

      {/* Add User Modal */}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Create New Account
                </h3>

                <p className="text-[11px] text-stone-500 mt-1">
                  Add a new platform user.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-4"
            >

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Full Name
                </label>

                <input
                  required
                  value={newUserName}
                  onChange={(e) =>
                    setNewUserName(e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Email Address
                </label>

                <input
                  required
                  type="email"
                  value={newUserEmail}
                  onChange={(e) =>
                    setNewUserEmail(e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Password
                </label>

                <input
                  required
                  type="password"
                  value={newUserPassword}
                  onChange={(e) =>
                    setNewUserPassword(e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Role
                </label>

                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs focus:outline-none focus:border-[#1A382B]"
                >
                  <option value="reader">
                    Reader
                  </option>

                  <option value="author">
                    Author
                  </option>

                  <option value="admin">
                    Administrator
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 bg-[#1A382B] hover:bg-[#11261D] text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {addingUser
                    ? 'Creating...'
                    : 'Create Account'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* View Modal */}

      {viewItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div className="bg-white border border-[#EDE8DF] rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">

            <div className="shrink-0 bg-white border-b border-[#EDE8DF] px-6 py-4 flex items-center justify-between">

              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                  {viewType === 'article'
                    ? 'Article'
                    : 'Quiz'}
                </span>

                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {viewItem.title}
                </h3>
              </div>

              <button
                onClick={() => {
                  setViewItem(null);
                  setViewType('');
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">

              {viewType === 'article' ? (
                <>
                  <div className="flex flex-wrap gap-2">

                    <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-[10px] font-semibold text-stone-700">
                      {viewItem.category}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${getStatusStyle(
                        viewItem.status
                      )}`}
                    >
                      {viewItem.status?.replace(
                        '_',
                        ' '
                      )}
                    </span>

                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">

                    <InfoBox
                      label="Author"
                      value={
                        viewItem.author?.name ||
                        'Unknown'
                      }
                    />

                    <InfoBox
                      label="Views"
                      value={
                        viewItem.views || 0
                      }
                    />

                    <InfoBox
                      label="Likes"
                      value={
                        viewItem.likes || 0
                      }
                    />

                  </div>

                  <div>

                    <h4 className="font-serif font-bold text-stone-900 mb-2">
                      Content
                    </h4>

                    <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-5 text-sm text-stone-700 whitespace-pre-wrap leading-7">
                      {viewItem.content ||
                        'No content available.'}
                    </div>

                  </div>

                  {viewItem.reviewFeedback && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">

                      <h4 className="text-xs font-bold text-amber-900">
                        Review Feedback
                      </h4>

                      <p className="text-xs text-amber-800 mt-1">
                        {viewItem.reviewFeedback}
                      </p>

                    </div>
                  )}

                  {viewItem.status === 'pending' && (
                    <div className="border-t border-[#EDE8DF] pt-5 mt-5">
                      <h4 className="font-serif font-bold text-stone-900 mb-2">
                        Admin Review
                      </h4>

                      <p className="text-xs text-stone-500 mb-3">
                        Review this submitted article before deciding whether it should be published.
                      </p>

                      <textarea
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        placeholder="Add feedback for the author (required for request changes or rejection)..."
                        rows={4}
                        className="w-full px-3 py-3 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B] resize-none"
                      />

                      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                        <button
                          onClick={() => handleArticleReview('rejected')}
                          disabled={reviewingArticle}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleArticleReview('changes_requested')}
                          disabled={reviewingArticle}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold disabled:opacity-50"
                        >
                          <Clock3 className="w-4 h-4" />
                          Request Changes
                        </button>

                        <button
                          onClick={() => handleArticleReview('published')}
                          disabled={reviewingArticle}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve & Publish
                        </button>
                      </div>
                    </div>
                )}
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">

                    <span
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${getStatusStyle(
                        viewItem.status
                      )}`}
                    >
                      {viewItem.status}
                    </span>

                    <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-[10px] font-semibold">
                      {viewItem.questions?.length || 0}{' '}
                      Questions
                    </span>

                  </div>

                  {viewItem.description && (
                    <p className="text-sm text-stone-600">
                      {viewItem.description}
                    </p>
                  )}

                  <div className="space-y-4">

                    {viewItem.questions?.map(
                      (question, index) => (

                        <div
                          key={
                            question._id ||
                            index
                          }
                          className="border border-[#EDE8DF] rounded-2xl p-5"
                        >

                          <p className="font-semibold text-sm text-stone-900">
                            {index + 1}.{' '}
                            {question.question}
                          </p>

                          <div className="grid sm:grid-cols-2 gap-2 mt-3">

                            {question.options?.map(
                              (option, optionIndex) => (

                                <div
                                  key={optionIndex}
                                  className={`px-3 py-2 rounded-xl text-xs border ${
                                    option ===
                                    question.correctAnswer
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                                      : 'bg-[#FAF7F2] border-[#EDE8DF] text-stone-600'
                                  }`}
                                >
                                  {option}
                                </div>

                              )
                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>
                </>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

// ==========================================
// SMALL COMPONENTS
// ==========================================

const StatCard = ({
  label,
  value,
  description,
  icon: Icon,
}) => (
  <div className="bg-white border border-[#EDE8DF] rounded-3xl p-5 shadow-xs">

    <div className="flex items-center justify-between">

      <span className="text-xs font-medium text-stone-500">
        {label}
      </span>

      <Icon className="w-4 h-4 text-stone-400" />

    </div>

    <p className="font-serif text-2xl font-bold text-stone-900 mt-2">
      {value}
    </p>

    <span className="text-[10px] text-stone-400">
      {description}
    </span>

  </div>
);

const OverviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#F5F2EB] last:border-0">

    <span className="text-xs text-stone-500">
      {label}
    </span>

    <span className="font-serif font-bold text-stone-900">
      {value}
    </span>

  </div>
);

const AttentionItem = ({
  label,
  value,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between p-4 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl hover:border-[#1A382B] transition text-left"
  >

    <div className="flex items-center gap-3">

      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-amber-700" />
      </div>

      <span className="text-xs font-semibold text-stone-700">
        {label}
      </span>

    </div>

    <div className="flex items-center gap-2">

      <span className="font-serif font-bold text-stone-900">
        {value}
      </span>

      <ChevronRight className="w-4 h-4 text-stone-400" />

    </div>

  </button>
);

const InfoBox = ({ label, value }) => (
  <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-3">

    <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold">
      {label}
    </span>

    <span className="block text-xs font-semibold text-stone-800 mt-1">
      {value}
    </span>

  </div>
);

const LoadingState = ({ text }) => (
  <div className="py-12 text-center text-xs text-stone-500">
    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-stone-400" />
    {text}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="py-12 text-center text-xs text-stone-500">
    {text}
  </div>
);

const getRoleStyle = (role) => {
  if (role === 'admin') {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }

  if (role === 'author') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }

  return 'bg-stone-100 text-stone-700 border-stone-200';
};

export default AdminDashboard;