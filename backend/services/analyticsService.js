const {
  calculateArticleFreshness,
  computeFreshnessMetrics,
} = require('./freshnessService');

const EMPTY_METRICS = { views: 0, likes: 0, shares: 0, comments: 0 };

function calculateEngagementRate(likes, shares, comments, views) {
  if (!views) return 0;
  return Number((((likes + shares + comments) / views) * 100).toFixed(2));
}

// Weighted score: views x1, likes x5, comments x8, shares x10
function calculateCompositeScore(article) {
  const m = article.metrics || EMPTY_METRICS;
  return (m.views || 0) + (m.likes || 0) * 5 + (m.comments || 0) * 8 + (m.shares || 0) * 10;
}

function getOverviewAnalytics(articles) {
  const totals = { views: 0, likes: 0, shares: 0, comments: 0 };

  articles.forEach((article) => {
    const m = article.metrics || EMPTY_METRICS;
    totals.views += m.views || 0;
    totals.likes += m.likes || 0;
    totals.shares += m.shares || 0;
    totals.comments += m.comments || 0;
  });

  return {
    totalArticles: articles.length,
    totalViews: totals.views,
    totalLikes: totals.likes,
    totalShares: totals.shares,
    totalComments: totals.comments,
    overallEngagementRate: calculateEngagementRate(
      totals.likes,
      totals.shares,
      totals.comments,
      totals.views
    ),
    freshnessSummary: computeFreshnessMetrics(articles),
    // The CMS does not store per-day views, so there is no trend data yet.
    viewsTrend: [],
  };
}

function getBestPerformingArticles(articles, limit = 5) {
  const ranked = articles
    .map((article) => {
      const m = article.metrics || EMPTY_METRICS;
      return {
        id: article.id,
        title: article.title,
        category: article.category,
        tags: article.tags,
        authorName: article.authorName,
        authorId: article.authorId,
        publishedAt: article.publishedAt,
        metrics: m,
        engagementRate: calculateEngagementRate(m.likes, m.shares, m.comments, m.views),
        compositeScore: Math.round(calculateCompositeScore(article)),
        freshness: calculateArticleFreshness(article),
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return ranked.slice(0, limit).map((item, index) => ({ ...item, rank: index + 1 }));
}

function getPopularTopics(articles) {
  const topicMap = {};

  articles.forEach((article) => {
    const name = article.category || 'Uncategorized';
    const m = article.metrics || EMPTY_METRICS;
    const engagement = (m.likes || 0) + (m.shares || 0) + (m.comments || 0);

    if (!topicMap[name]) {
      topicMap[name] = {
        name,
        articleCount: 0,
        totalViews: 0,
        totalEngagement: 0,
        tags: new Set(),
      };
    }

    const topic = topicMap[name];
    topic.articleCount += 1;
    topic.totalViews += m.views || 0;
    topic.totalEngagement += engagement;
    (article.tags || []).forEach((tag) => topic.tags.add(tag));
  });

  return Object.values(topicMap)
    .map((topic) => ({
      name: topic.name,
      articleCount: topic.articleCount,
      totalViews: topic.totalViews,
      totalEngagement: topic.totalEngagement,
      avgViewsPerArticle: Math.round(topic.totalViews / topic.articleCount),
      avgEngagementRate: calculateEngagementRate(topic.totalEngagement, 0, 0, topic.totalViews),
      tags: Array.from(topic.tags),
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement);
}

module.exports = {
  calculateEngagementRate,
  calculateCompositeScore,
  getOverviewAnalytics,
  getBestPerformingArticles,
  getPopularTopics,
};
