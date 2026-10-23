import axios from 'axios';

// Base API instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://content-management-system-2-he9n.onrender.com/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  // 30s for normal requests; bulk AI scans override this per-call
  timeout: 30000,
});

const QUIZ_API = API;

// Request Interceptor: Attach JWT Bearer token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lumen_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 expired tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthRoute) {
        console.warn(
          '[Lumen Auth API] Session expired or unauthorized.'
        );
      }
    }

    return Promise.reject(error);
  }
);

// ======================================================
// Authentication API
// ======================================================

export const authAPI = {
  register: (data) =>
    API.post('/auth/register', data),

  login: (data) =>
    API.post('/auth/login', data),

  logout: () =>
    API.post('/auth/logout'),

  getMe: () =>
    API.get('/auth/me'),
};

// ======================================================
// User Management API
// ======================================================

export const userAPI = {
  // Current user's profile
  getProfile: () =>
    API.get('/users/profile'),

  // Update current user's profile
  updateProfile: (data) =>
    API.put('/users/profile', data),

  // Change current user's password
  changePassword: (data) =>
    API.put('/users/change-password', data),

  // Public user profile
  getUserById: (id) =>
    API.get(`/users/${id}`),

  // Admin endpoints
  getAllUsers: () =>
    API.get('/users'),

  createUserByAdmin: (data) =>
    API.post('/users', data),

  updateUserRole: (id, role) =>
    API.put(`/users/${id}/role`, { role }),

  deleteUser: (id) =>
    API.delete(`/users/${id}`),
};

// ======================================================
// Admin Verification API
// ======================================================

export const adminVerificationAPI = {
  // Get content waiting for admin review
  getPendingArticles: () =>
    API.get('/admin-verification/articles'),

  getPendingQuizzes: () =>
    API.get('/admin-verification/quizzes'),

  getStats: () =>
    API.get('/admin-verification/stats'),

  // Article actions
  approveArticle: (id) =>
    API.put(`/admin-verification/articles/${id}/approve`),

  rejectArticle: (id, reason) =>
    API.put(`/admin-verification/articles/${id}/reject`, {
      reason,
    }),

  requestArticleChanges: (id, comment) =>
    API.put(
      `/admin-verification/articles/${id}/request-changes`,
      {
        comment,
      }
    ),

  // Quiz actions
  approveQuiz: (id) =>
    API.put(`/admin-verification/quizzes/${id}/approve`),

  rejectQuiz: (id, reason) =>
    API.put(`/admin-verification/quizzes/${id}/reject`, {
      reason,
    }),

  requestQuizChanges: (id, comment) =>
    API.put(
      `/admin-verification/quizzes/${id}/request-changes`,
      {
        comment,
      }
    ),
};

// ======================================================
// Article Management API
// ======================================================

export const articleAPI = {
  // Public / Browse
  getArticles: (params) =>
    API.get('/articles', { params }),

  getArticleById: (id) =>
    API.get(`/articles/${id}`),

  // Published articles by specific author
  getPublishedArticlesByAuthor: (id) =>
    API.get(`/articles/author/${id}`),

  // Current author's articles
  getMyArticles: () =>
    API.get('/articles/mine'),

  getMyArticleById: (id) =>
    API.get(`/articles/mine/${id}`),

  // Create / Update
  createArticle: (data) =>
    API.post('/articles', data),

  updateArticle: (id, data) =>
    API.put(`/articles/${id}`, data),

  deleteArticle: (id) =>
    API.delete(`/articles/${id}`),

  // Submit article
  submitArticle: (id) =>
    API.patch(`/articles/${id}/submit`),

  // Like article
  likeArticle: (id) =>
    API.patch(`/articles/${id}/like`),

  // Increment article views
  viewArticle: (id) =>
    API.patch(`/articles/${id}/view`),
    // Record reading history for logged-in users
  recordArticleRead: (id) =>
    API.post(`/articles/${id}/read`),

  // Get personalized For You recommendations
  getForYouRecommendations: () =>
    API.get('/articles/recommendations/for-you'),

  // Admin review
  reviewArticle: (id, data) =>
    API.patch(`/articles/${id}/review`, data),

  // Admin: get all non-draft articles
  getAllArticlesForAdmin: () =>
    API.get('/articles/admin/all'),
};

export const discoveryAPI = {
  // Use Vite's local API proxy in development when no API override is configured.
  // Production continues to use the shared API base URL from VITE_API_URL.
  getTrendingTopics: (params) =>
    API.get('/discovery/trending-topics', {
      params,
      baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : API.defaults.baseURL),
    }),
  getPopularCategories: (params) =>
    API.get('/discovery/popular-categories', {
      params,
      baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : API.defaults.baseURL),
    }),
};

// ======================================================
// Quiz API
// ======================================================

export const quizAPI = {
  getAllQuizzes: (params) =>
    API.get('/quizzes', { params }),

  getQuizById: (id) =>
    API.get(`/quizzes/${id}`),

  getQuizByArticleId: (articleId) =>
    API.get(`/quizzes/article/${articleId}`),

  createQuiz: (data) =>
    API.post('/quizzes', data),

  updateQuiz: (id, data) =>
    API.put(`/quizzes/${id}`, data),

  deleteQuiz: (id) =>
    API.delete(`/quizzes/${id}`),

  submitQuiz: (id) =>
    API.patch(`/quizzes/${id}/submit`),
};

// ======================================================
// Quiz Attempt API
// ======================================================

export const quizAttemptAPI = {
  submitAttempt: (data) =>
    API.post('/quiz-attempts', data),

  getMyAttempts: () =>
    API.get('/quiz-attempts/my'),

  getQuizAttempts: (quizId) =>
    API.get(`/quiz-attempts/quiz/${quizId}`),
};

// ======================================================
// Notification API
// ======================================================

export const notificationAPI = {
  getNotifications: () => API.get('/notifications'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
};
// Comment & Discussion API Endpoints (Sadanand Module)
export const commentAPI = {
  getCommentsByTarget: (targetId) => API.get(`/comments/target/${targetId}`),
  createComment: (data) => API.post('/comments', data),
  updateComment: (id, data) => API.put(`/comments/${id}`, data),
  deleteComment: (id) => API.delete(`/comments/${id}`),
  toggleReaction: (id, type = 'like') => API.post(`/comments/${id}/react`, { type }),
  getRecentDiscussions: (limit = 8) => API.get('/comments/recent', { params: { limit } }),
  getAllCommentsForAdmin: () => API.get('/comments/admin/all'),
};
// Author Subscription API
// ======================================================
// Author Subscription API
// ======================================================

export const subscriptionAPI = {
  // Subscribe to an author
  subscribe: (authorId) =>
    API.post(`/subscriptions/${authorId}`),

  subscribeToAuthor: (authorId) =>
    API.post(`/subscriptions/${authorId}`),

  // Unsubscribe from an author
  unsubscribe: (authorId) =>
    API.delete(`/subscriptions/${authorId}`),

  unsubscribeFromAuthor: (authorId) =>
    API.delete(`/subscriptions/${authorId}`),

  // Check current subscription status
  getStatus: (authorId) =>
    API.get(`/subscriptions/status/${authorId}`),

  // Get all subscriptions for current user
  getMySubscriptions: () =>
    API.get('/subscriptions'),

  // Get subscriber count
  getAuthorSubscriberCount: (authorId) =>
    API.get(
      `/subscriptions/author/${authorId}/count`
    ),
};

// Trust & Reputation API
// ======================================================

export const trustAPI = {
  getMyScore: () => API.get('/trust/my-score'),
  getMyTrustProfile: () => API.get('/trust/my-score'),
  getLeaderboard: (params) => API.get('/trust/leaderboard', { params }),
  getUserById: (id) => API.get(`/trust/users/${id}`),
  getUserScore: (id) => API.get(`/trust/users/${id}`),
  getStats: () => API.get('/trust/stats'),
  getLogs: (params) => API.get('/trust/logs', { params }),
  getUserHistory: (id) => API.get(`/trust/users/${id}/history`),
  adjustUserScore: (id, data) => API.post(`/trust/users/${id}/adjust`, data),
};

// Content Quality API
export const contentQualityAPI = {
  analyze: (data) =>
    API.post('/content-quality/analyze', data),
};

// AI Writing API
export const aiWritingAPI = {
  assist: (data) => API.post('/ai-writing/assist', data, { timeout: 60000 }),
  summarize: (data) => API.post('/ai-writing/summarize', data, { timeout: 60000 }),
};

// AI Content Moderation API
export const moderationAPI = {
  getStats: () => API.get('/moderation/stats'),
  getContent: (params) => API.get('/moderation/content', { params }),
  // Single rescan — give 60s (Gemini can be slow)
  rescanContent: (type, id) => API.post(`/moderation/rescan/${type}/${id}`, {}, { timeout: 60000 }),
  // Bulk scans: 3 min timeout — scanning 26+ items takes 60-90s with delays
  scanAll: () => API.post('/moderation/scan-all', {}, { timeout: 180000 }),
  rescanAll: () => API.post('/moderation/rescan-all', {}, { timeout: 180000 }),
};

// Messaging API
export const messageAPI = {
  getConversation: (userId) => API.get(`/messages/${userId}`),
  sendMessage: (data) => API.post('/messages', data),
};

// Content Reports API
export const reportAPI = {
  getReports: (params) => API.get('/reports', { params }),
  createReport: (data) => API.post('/reports', data),
  updateReportStatus: (id, statusData) => API.patch(`/reports/${id}/status`, statusData),
};

// Report Appeals API (Phase 3)
export const appealAPI = {
  createAppeal: (data) => API.post('/appeals', data),
  getMyAppeals: () => API.get('/appeals/my'),
  getAppeals: (params) => API.get('/appeals', { params }),
  reviewAppeal: (id, data) => API.patch(`/appeals/${id}/review`, data),
};

// Spam & Abuse API (Phase 3)
export const spamAbuseAPI = {
  checkCommentSpam: (commentId) => API.get(`/spam-abuse/comment/${commentId}/check`),
  checkUserActivity: (userId) => API.get(`/spam-abuse/user/${userId}/activity/check`),
  getUserCommentActivity: (userId) => API.get(`/spam-abuse/user/${userId}/activity`),
  restrictUser: (userId, data) => API.patch(`/spam-abuse/user/${userId}/restrict`, data),
  getPendingReports: () => API.get('/spam-abuse/reports/pending'),
};

// ======================================================
// Author Analytics & Freshness Alerts API
// ======================================================

const unwrap = (request) =>
  request
    .then((res) => res.data)
    .catch((error) => {
      throw new Error(error.response?.data?.message || error.message);
    });

const withAuthor = (authorId) => (authorId ? { authorId } : {});

export const analyticsAPI = {
  getOverview: (authorId) =>
    unwrap(API.get('/analytics/overview', { params: withAuthor(authorId) })),

  getTopArticles: (limit = 10, authorId) =>
    unwrap(API.get('/analytics/top-articles', { params: { limit, ...withAuthor(authorId) } })),

  getPopularTopics: (authorId) =>
    unwrap(API.get('/analytics/popular-topics', { params: withAuthor(authorId) })),

  getFreshnessAlerts: (filter = 'all', authorId) =>
    unwrap(API.get('/analytics/freshness/alerts', { params: { filter, ...withAuthor(authorId) } })),

  markArticleReviewed: (articleId) =>
    unwrap(API.post(`/analytics/freshness/review/${articleId}`)),

  getArticles: (params = {}) =>
    unwrap(API.get('/analytics/articles', { params })),

  auditArticleLinks: (articleId) =>
    unwrap(API.post(`/analytics/links/audit/${articleId}`)).then((res) => ({
      ...res,
      linksAudit: res.audit,
    })),

  // Checks links of the articles in scope one at a time (first 25 articles only).
  bulkAuditLinks: async (authorId) => {
    const list = await analyticsAPI.getArticles(withAuthor(authorId));
    const targets = (list.articles || []).slice(0, 25);
    let brokenLinksFound = 0;

    for (const article of targets) {
      const res = await analyticsAPI.auditArticleLinks(article.id);
      brokenLinksFound += res.audit.brokenLinksCount;
    }

    return { success: true, articlesScanned: targets.length, brokenLinksFound };
  },
};

// Alias QuizAPI for backwards compatibility
export const QuizAPI = quizAPI;

export default API;
