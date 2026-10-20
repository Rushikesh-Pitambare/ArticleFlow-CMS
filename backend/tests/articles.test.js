const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

const jwtSecret =
  process.env.JWT_SECRET || 'lumen_super_secret_jwt_key_2026_cms_platform';

const readerToken = jwt.sign(
  { id: '66c9f1a00000000000000001' },
  jwtSecret
);
const userStore = require('../models/userStore');

jest.setTimeout(15000);

describe('Articles API Tests', () => {

  it('GET /api/articles - should fetch all published articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('GET /api/articles?search=CRISPR - should filter articles by query', async () => {
    const res = await request(app).get('/api/articles?search=CRISPR');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.articles)).toBe(true);
  });


  it('GET /api/articles/:id/recommendations - returns published recommendations with reasons', async () => {
    const articleId = '66c9f2b00000000000000001';
    const res = await request(app).get(
      `/api/articles/${articleId}/recommendations`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeLessThanOrEqual(4);

    for (const article of res.body.recommendations) {
      expect(article.status).toBe('published');
      expect(String(article._id || article.id)).not.toBe(articleId);
      expect(typeof article.recommendationReason).toBe('string');
      expect(article.recommendationReason.length).toBeGreaterThan(0);
    }
  });



it('PATCH /api/articles/:id/view - records reading history for an authenticated reader', async () => {
  const userId = '66c9f1a00000000000000001';
  const articleId = '66c9f2b00000000000000001';

  const userBefore = await userStore.findById(userId);
  expect(userBefore).not.toBeNull();

  const previousEntry = userBefore.readingHistory.find(
    (entry) => String(entry.articleId) === articleId
  );
  const previousCount = previousEntry?.viewCount || 0;

  const res = await request(app)
    .patch(`/api/articles/${articleId}/view`)
    .set('Authorization', `Bearer ${readerToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);

  const userAfter = await userStore.findById(userId);
  const savedEntry = userAfter.readingHistory.find(
    (entry) => String(entry.articleId) === articleId
  );

  expect(savedEntry).toBeDefined();
  expect(savedEntry.viewCount).toBeGreaterThan(previousCount);
  expect(savedEntry.category).toBeTruthy();
});



  it('GET /api/articles - public requests should not include non-published articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.statusCode).toBe(200);
    const nonPublished = res.body.articles.filter(a => a.status !== 'published');
    expect(nonPublished.length).toBe(0);
  });
});
