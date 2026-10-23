const mongoose = require('mongoose');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const articleStore = require('../models/articleStore');
const commentStore = require('../models/commentStore');
const {
  calculateArticleFreshness,
  computeFreshnessMetrics,
} = require('../services/freshnessService');
const {
  calculateEngagementRate,
  getOverviewAnalytics,
  getBestPerformingArticles,
  getPopularTopics,
} = require('../services/analyticsService');
const { auditArticleLinks } = require('../services/linkCheckerService');

const OBJECT_ID = /^[a-f\d]{24}$/i;

const isMongoConnected = () =>
  mongoose.connection && mongoose.connection.readyState === 1;

const currentUserId = (req) => String(req.user.id || req.user._id);
const isAdmin = (req) => req.user.role === 'admin';
const idOf = (value) => String((value && (value._id || value.id)) || value || '');

/**
 * Access control:
 * - author: always scoped to their own articles (any ?authorId is ignored)
 * - admin: all authors, or one author via ?authorId=
 * Returns null (and sends a 400) if the request is invalid.
 */
function resolveScope(req, res) {
  if (!isAdmin(req)) {
    return { authorId: currentUserId(req), scope: 'author' };
  }

  const { authorId } = req.query;
  if (authorId !== undefined && (typeof authorId !== 'string' || !OBJECT_ID.test(authorId))) {
    res.status(400).json({ success: false, message: 'Invalid authorId.' });
    return null;
  }

  return { authorId: authorId || null, scope: authorId ? 'author' : 'admin_all' };
}

const canManageArticle = (req, articleAuthorId) =>
  isAdmin(req) || String(articleAuthorId) === currentUserId(req);

async function getCommentCounts(articleIds) {
  const counts = {};
  if (articleIds.length === 0) return counts;

  try {
    if (isMongoConnected()) {
      const rows = await Comment.aggregate([
        { $match: { targetType: 'article', targetId: { $in: articleIds } } },
        { $group: { _id: '$targetId', count: { $sum: 1 } } },
      ]);
      rows.forEach((row) => {
        counts[row._id] = row.count;
      });
    } else {
      const all = await commentStore.getAllComments();
      all.forEach((comment) => {
        if ((comment.targetType || 'article') !== 'article') return;
        const key = String(comment.targetId);
        counts[key] = (counts[key] || 0) + 1;
      });
    }
  } catch (error) {
    console.error('[Analytics] Could not count comments:', error.message);
  }

  return counts;
}

function normalizeArticle(raw, commentCounts, includeContent = false) {
  const id = String(raw._id || raw.id);
  const likes = Array.isArray(raw.likes) ? raw.likes.length : Number(raw.likes) || 0;
  const audit = raw.linksAudit && raw.linksAudit.lastAuditedAt ? raw.linksAudit : null;

  const article = {
    id,
    title: raw.title,
    category: raw.category || 'Other',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status,
    authorId: idOf(raw.author),
    authorName: (raw.author && raw.author.name) || 'Unknown',
    publishedAt: raw.publishedAt || null,
    createdAt: raw.createdAt || null,
    lastReviewedAt: raw.lastReviewedAt || null,
    metrics: {
      views: Number(raw.views) || 0,
      likes,
      shares: Number(raw.shares) || 0,
      comments: commentCounts[id] || 0,
    },
    linksAudit: audit,
  };

  if (includeContent) article.content = raw.content || '';
  return article;
}

// Published articles only, optionally limited to one author.
async function loadArticles({ authorId }) {
  let raws;

  if (isMongoConnected()) {
    const filter = { status: 'published' };
    if (authorId) filter.author = authorId;
    raws = await Article.find(filter)
      .select('-content')
      .populate('author', 'name email role')
      .lean();
  } else {
    raws = (articleStore.inMemoryArticles || []).filter(
      (a) => a.status === 'published' && (!authorId || idOf(a.author) === authorId)
    );
  }

  const counts = await getCommentCounts(raws.map((a) => String(a._id || a.id)));
  return raws.map((a) => normalizeArticle(a, counts));
}

// A single article (with content) for review / link-audit actions.
async function findArticle(id) {
  if (isMongoConnected()) {
    return Article.findById(id).populate('author', 'name email role').lean();
  }
  return (articleStore.inMemoryArticles || []).find((a) => String(a._id) === id) || null;
}

function serverError(res, label, error) {
  console.error(`[Analytics] ${label}:`, error);
  return res.status(500).json({ success: false, message: `Failed to ${label}.` });
}

// ---------------------------------------------------------------------------

const getOverview = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const articles = await loadArticles(scope);

    res.status(200).json({
      success: true,
      scope: scope.scope,
      author:
        scope.authorId && articles[0]
          ? { id: articles[0].authorId, name: articles[0].authorName }
          : null,
      analytics: getOverviewAnalytics(articles),
    });
  } catch (error) {
    serverError(res, 'load analytics overview', error);
  }
};

const getTopArticles = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const articles = await loadArticles(scope);
    const top = getBestPerformingArticles(articles, limit);

    res.status(200).json({ success: true, scope: scope.scope, count: top.length, articles: top });
  } catch (error) {
    serverError(res, 'load top articles', error);
  }
};

const getPopularTopicsList = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const topics = getPopularTopics(await loadArticles(scope));
    res.status(200).json({ success: true, scope: scope.scope, count: topics.length, topics });
  } catch (error) {
    serverError(res, 'load popular topics', error);
  }
};

const getArticleList = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const articles = (await loadArticles(scope))
      .map((a) => ({
        ...a,
        engagementRate: calculateEngagementRate(
          a.metrics.likes,
          a.metrics.shares,
          a.metrics.comments,
          a.metrics.views
        ),
        freshness: calculateArticleFreshness(a),
      }))
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

    res.status(200).json({ success: true, scope: scope.scope, count: articles.length, articles });
  } catch (error) {
    serverError(res, 'load article list', error);
  }
};

const getFreshnessSummary = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const articles = await loadArticles(scope);
    res.status(200).json({
      success: true,
      scope: scope.scope,
      summary: computeFreshnessMetrics(articles),
    });
  } catch (error) {
    serverError(res, 'load freshness summary', error);
  }
};

const getFreshnessAlerts = async (req, res) => {
  try {
    const scope = resolveScope(req, res);
    if (!scope) return;

    const filter = ['all', 'outdated', 'aging', 'broken_links'].includes(req.query.filter)
      ? req.query.filter
      : 'all';

    const alerts = [];
    (await loadArticles(scope)).forEach((article) => {
      const freshness = calculateArticleFreshness(article);
      const brokenLinksCount = (article.linksAudit && article.linksAudit.brokenLinksCount) || 0;

      const matches =
        (filter === 'all' && freshness.needsReview) ||
        (filter === 'outdated' && freshness.status === 'outdated') ||
        (filter === 'aging' && freshness.status === 'aging') ||
        (filter === 'broken_links' && brokenLinksCount > 0);

      if (!matches) return;

      const urgent = freshness.status === 'outdated' || brokenLinksCount > 0;
      alerts.push({
        id: article.id,
        title: article.title,
        category: article.category,
        authorId: article.authorId,
        authorName: article.authorName,
        publishedAt: article.publishedAt,
        lastReviewedAt: article.lastReviewedAt,
        metrics: article.metrics,
        freshness,
        brokenLinksCount,
        urgency: urgent ? 'high' : 'medium',
        suggestedAction:
          freshness.status === 'outdated'
            ? 'Revise the content, update old references, then mark as reviewed.'
            : brokenLinksCount > 0
            ? 'Fix or replace the broken links.'
            : 'Do a quick accuracy check, then mark as reviewed.',
      });
    });

    alerts.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency === 'high' ? -1 : 1;
      return b.freshness.daysSinceUpdate - a.freshness.daysSinceUpdate;
    });

    res.status(200).json({
      success: true,
      scope: scope.scope,
      totalAlerts: alerts.length,
      alerts,
    });
  } catch (error) {
    serverError(res, 'load freshness alerts', error);
  }
};

// Shared checks for the two POST actions below.
async function loadManagedArticle(req, res) {
  const { id } = req.params;

  if (!OBJECT_ID.test(id)) {
    res.status(400).json({ success: false, message: 'Invalid article ID.' });
    return null;
  }

  const article = await findArticle(id);
  if (!article) {
    res.status(404).json({ success: false, message: 'Article not found.' });
    return null;
  }

  if (!canManageArticle(req, idOf(article.author))) {
    res.status(403).json({
      success: false,
      message: "Forbidden: you can only manage your own articles' analytics.",
    });
    return null;
  }

  return article;
}

const markReviewed = async (req, res) => {
  try {
    const article = await loadManagedArticle(req, res);
    if (!article) return;

    const now = new Date();
    if (isMongoConnected()) {
      await Article.updateOne({ _id: article._id }, { $set: { lastReviewedAt: now } });
    } else {
      article.lastReviewedAt = now;
    }

    res.status(200).json({
      success: true,
      message: 'Article marked as reviewed.',
      lastReviewedAt: now,
      freshness: calculateArticleFreshness({ ...article, lastReviewedAt: now }),
    });
  } catch (error) {
    serverError(res, 'mark article as reviewed', error);
  }
};

const auditLinks = async (req, res) => {
  try {
    const article = await loadManagedArticle(req, res);
    if (!article) return;

    const audit = await auditArticleLinks({ content: article.content });

    if (isMongoConnected()) {
      await Article.updateOne({ _id: article._id }, { $set: { linksAudit: audit } });
    } else {
      article.linksAudit = audit;
    }

    res.status(200).json({ success: true, articleId: idOf(article), audit });
  } catch (error) {
    serverError(res, 'audit article links', error);
  }
};

module.exports = {
  getOverview,
  getTopArticles,
  getPopularTopicsList,
  getArticleList,
  getFreshnessSummary,
  getFreshnessAlerts,
  markReviewed,
  auditLinks,
};
