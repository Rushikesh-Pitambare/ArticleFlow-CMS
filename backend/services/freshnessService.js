const FRESHNESS_THRESHOLDS = {
  FRESH_DAYS: 90,
  AGING_DAYS: 180,
};

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * The date an article's content was last considered current.
 *
 * Note: Mongoose `updatedAt` is NOT used on purpose. The CMS bumps it on every
 * view or like, which would make every popular article look "fresh".
 * We use the latest of lastReviewedAt / publishedAt, falling back to createdAt.
 */
function getReferenceDate(article) {
  const dates = [article.lastReviewedAt, article.publishedAt]
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (dates.length > 0) {
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  const created = new Date(article.createdAt);
  return Number.isNaN(created.getTime()) ? new Date() : created;
}

function calculateArticleFreshness(article, now = new Date()) {
  const referenceDate = getReferenceDate(article);
  const daysSinceUpdate = Math.max(
    0,
    Math.floor((now.getTime() - referenceDate.getTime()) / DAY_MS)
  );

  let status = 'fresh';
  let reviewReason = 'Content is current and up-to-date.';
  let needsReview = false;

  const brokenLinks = (article.linksAudit && article.linksAudit.brokenLinksCount) || 0;

  if (daysSinceUpdate > FRESHNESS_THRESHOLDS.AGING_DAYS) {
    status = 'outdated';
    needsReview = true;
    reviewReason = `Outdated: last published or reviewed ${daysSinceUpdate} days ago (over ${FRESHNESS_THRESHOLDS.AGING_DAYS} days).`;
  } else if (daysSinceUpdate > FRESHNESS_THRESHOLDS.FRESH_DAYS) {
    status = 'aging';
    needsReview = true;
    reviewReason = `Aging: last published or reviewed ${daysSinceUpdate} days ago (over ${FRESHNESS_THRESHOLDS.FRESH_DAYS} days).`;
  }

  if (brokenLinks > 0) {
    needsReview = true;
    reviewReason += ` ${brokenLinks} broken link(s) detected.`;
  }

  return {
    status,
    daysSinceUpdate,
    needsReview,
    reviewReason,
    lastReviewedAt: article.lastReviewedAt || null,
  };
}

function computeFreshnessMetrics(articles) {
  const total = articles.length;

  if (total === 0) {
    return {
      totalArticles: 0,
      freshCount: 0,
      agingCount: 0,
      outdatedCount: 0,
      needsReviewCount: 0,
      freshPercentage: 100,
      averageAgeDays: 0,
      healthScore: 100,
    };
  }

  let freshCount = 0;
  let agingCount = 0;
  let outdatedCount = 0;
  let needsReviewCount = 0;
  let totalAgeDays = 0;

  articles.forEach((article) => {
    const freshness = calculateArticleFreshness(article);
    totalAgeDays += freshness.daysSinceUpdate;
    if (freshness.status === 'fresh') freshCount += 1;
    else if (freshness.status === 'aging') agingCount += 1;
    else outdatedCount += 1;
    if (freshness.needsReview) needsReviewCount += 1;
  });

  // Health score: fresh = 100%, aging = 50%, outdated = 10%
  const healthScore = Math.round(
    ((freshCount + agingCount * 0.5 + outdatedCount * 0.1) / total) * 100
  );

  return {
    totalArticles: total,
    freshCount,
    agingCount,
    outdatedCount,
    needsReviewCount,
    freshPercentage: Math.round((freshCount / total) * 100),
    averageAgeDays: Math.round(totalAgeDays / total),
    healthScore,
  };
}

module.exports = {
  FRESHNESS_THRESHOLDS,
  getReferenceDate,
  calculateArticleFreshness,
  computeFreshnessMetrics,
};
