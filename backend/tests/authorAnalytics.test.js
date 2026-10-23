const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

const {
  calculateEngagementRate,
  getBestPerformingArticles,
  getPopularTopics,
} = require('../services/analyticsService');
const { calculateArticleFreshness, computeFreshnessMetrics } = require('../services/freshnessService');
const {
  extractLinksFromContent,
  isPrivateAddress,
  checkSingleUrl,
} = require('../services/linkCheckerService');

jest.setTimeout(15000);

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

describe('Analytics service', () => {
  it('calculates engagement rate', () => {
    expect(calculateEngagementRate(100, 50, 50, 1000)).toBe(20);
    expect(calculateEngagementRate(10, 5, 2, 0)).toBe(0);
  });

  it('ranks top articles by composite score', () => {
    const ranked = getBestPerformingArticles(
      [
        { id: 'a', title: 'A', metrics: { views: 1000, likes: 50, shares: 10, comments: 20 } },
        { id: 'b', title: 'B', metrics: { views: 5000, likes: 400, shares: 100, comments: 80 } },
      ],
      2
    );
    expect(ranked[0].id).toBe('b');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].id).toBe('a');
  });

  it('aggregates popular topics', () => {
    const topics = getPopularTopics([
      { category: 'Science', tags: ['x'], metrics: { views: 500, likes: 50, shares: 10, comments: 5 } },
      { category: 'Science', tags: ['y'], metrics: { views: 300, likes: 20, shares: 5, comments: 2 } },
      { category: 'Health', tags: [], metrics: { views: 200, likes: 10, shares: 2, comments: 1 } },
    ]);
    expect(topics[0].name).toBe('Science');
    expect(topics[0].articleCount).toBe(2);
    expect(topics[0].tags.sort()).toEqual(['x', 'y']);
  });
});

describe('Freshness service', () => {
  it('flags fresh, aging and outdated articles', () => {
    expect(calculateArticleFreshness({ publishedAt: daysAgo(10) }).status).toBe('fresh');
    expect(calculateArticleFreshness({ publishedAt: daysAgo(120) }).status).toBe('aging');
    const outdated = calculateArticleFreshness({ publishedAt: daysAgo(300) });
    expect(outdated.status).toBe('outdated');
    expect(outdated.needsReview).toBe(true);
  });

  it('ignores updatedAt (views and likes bump it in this CMS)', () => {
    const f = calculateArticleFreshness({ publishedAt: daysAgo(300), updatedAt: new Date() });
    expect(f.status).toBe('outdated');
  });

  it('a recent review makes an old article fresh again', () => {
    const f = calculateArticleFreshness({ publishedAt: daysAgo(300), lastReviewedAt: daysAgo(2) });
    expect(f.status).toBe('fresh');
  });

  it('flags broken links for review', () => {
    const f = calculateArticleFreshness({
      publishedAt: daysAgo(5),
      linksAudit: { brokenLinksCount: 2 },
    });
    expect(f.needsReview).toBe(true);
  });

  it('summarises a set of articles', () => {
    const s = computeFreshnessMetrics([
      { publishedAt: daysAgo(5) },
      { publishedAt: daysAgo(120) },
      { publishedAt: daysAgo(400) },
    ]);
    expect(s).toMatchObject({ freshCount: 1, agingCount: 1, outdatedCount: 1, needsReviewCount: 2 });
  });
});

describe('Link checker service', () => {
  it('extracts markdown and plain links without duplicates', () => {
    const links = extractLinksFromContent(
      'See [Docs](https://example.com/docs) and https://example.org/page and https://example.com/docs'
    );
    expect(links.map((l) => l.url)).toEqual(['https://example.com/docs', 'https://example.org/page']);
  });

  it('recognises private addresses', () => {
    ['127.0.0.1', '10.0.0.5', '192.168.1.1', '172.20.0.1', '169.254.169.254', '::1'].forEach((ip) =>
      expect(isPrivateAddress(ip)).toBe(true)
    );
    ['8.8.8.8', '93.184.216.34'].forEach((ip) => expect(isPrivateAddress(ip)).toBe(false));
  });

  it('skips localhost and private IPs instead of requesting them', async () => {
    for (const url of ['http://localhost:5000/api/health', 'http://127.0.0.1/x', 'http://169.254.169.254/latest']) {
      const r = await checkSingleUrl(url, 'x');
      expect(r.skipped).toBe(true);
      expect(r.isBroken).toBe(false);
    }
  });
});

describe('Analytics API access control', () => {
  const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'lumen_test_only_secret_for_jest');

  const ADMIN = '66c9f1a00000000000000001';
  const THOMAS = '66c9f1a00000000000000002';
  const PRIYA = '66c9f1a00000000000000003';
  const READER = '66c9f1a00000000000000004';
  const PRIYA_ARTICLE = '66c9f2b00000000000000001';

  const get = (path, id) => request(app).get(path).set('Authorization', `Bearer ${sign(id)}`);
  const post = (path, id) => request(app).post(path).set('Authorization', `Bearer ${sign(id)}`);

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/analytics/overview');
    expect(res.statusCode).toBe(401);
  });

  it('rejects readers', async () => {
    const res = await get('/api/analytics/overview', READER);
    expect(res.statusCode).toBe(403);
  });

  it('shows an author only their own articles', async () => {
    const res = await get('/api/analytics/articles', THOMAS);
    expect(res.statusCode).toBe(200);
    expect(res.body.scope).toBe('author');
    expect(res.body.articles.length).toBeGreaterThan(0);
    res.body.articles.forEach((a) => expect(a.authorId).toBe(THOMAS));
  });

  it('ignores ?authorId from an author', async () => {
    const res = await get(`/api/analytics/articles?authorId=${PRIYA}`, THOMAS);
    expect(res.statusCode).toBe(200);
    res.body.articles.forEach((a) => expect(a.authorId).toBe(THOMAS));
  });

  it('gives the admin all authors, or one author on request', async () => {
    const all = await get('/api/analytics/overview', ADMIN);
    const thomas = await get('/api/analytics/overview', THOMAS);
    const priya = await get('/api/analytics/overview', PRIYA);
    expect(all.body.scope).toBe('admin_all');
    expect(all.body.analytics.totalViews).toBe(
      thomas.body.analytics.totalViews + priya.body.analytics.totalViews
    );

    const one = await get(`/api/analytics/articles?authorId=${PRIYA}`, ADMIN);
    expect(one.body.scope).toBe('author');
    one.body.articles.forEach((a) => expect(a.authorId).toBe(PRIYA));
  });

  it('validates the admin authorId filter', async () => {
    const res = await get('/api/analytics/overview?authorId=not-an-id', ADMIN);
    expect(res.statusCode).toBe(400);
  });

  it('returns top articles, topics and freshness data', async () => {
    const top = await get('/api/analytics/top-articles?limit=2', ADMIN);
    expect(top.statusCode).toBe(200);
    expect(top.body.articles.length).toBeLessThanOrEqual(2);

    expect((await get('/api/analytics/popular-topics', ADMIN)).body.success).toBe(true);
    expect((await get('/api/analytics/freshness/summary', ADMIN)).body.summary).toBeDefined();
    expect(Array.isArray((await get('/api/analytics/freshness/alerts', ADMIN)).body.alerts)).toBe(true);
  });

  it("blocks an author from reviewing or auditing another author's article", async () => {
    expect((await post(`/api/analytics/freshness/review/${PRIYA_ARTICLE}`, THOMAS)).statusCode).toBe(403);
    expect((await post(`/api/analytics/links/audit/${PRIYA_ARTICLE}`, THOMAS)).statusCode).toBe(403);
  });

  it('lets an author review their own article', async () => {
    const res = await post(`/api/analytics/freshness/review/${PRIYA_ARTICLE}`, PRIYA);
    expect(res.statusCode).toBe(200);
    expect(res.body.freshness.status).toBe('fresh');
  });

  it('rejects an invalid article id', async () => {
    expect((await post('/api/analytics/freshness/review/abc', PRIYA)).statusCode).toBe(400);
  });
});
