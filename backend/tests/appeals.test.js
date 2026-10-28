const dotenv = require('dotenv');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

process.env.NODE_ENV = 'test';

const connectDB = require('../config/db');

const Report = require('../models/Report');
const Appeal = require('../models/Appeal');

const jwtSecret =
  process.env.JWT_SECRET ||
  'lumen_test_only_secret_for_jest';

const USER_ID = '66c9f1a00000000000000002';
const ADMIN_ID = '66c9f1a00000000000000001';

const userToken = jwt.sign({ id: USER_ID }, jwtSecret);
const adminToken = jwt.sign({ id: ADMIN_ID }, jwtSecret);
console.log('Test JWT secret loaded:', Boolean(process.env.JWT_SECRET));
console.log('Test JWT secret matches:', jwtSecret === process.env.JWT_SECRET);

jest.setTimeout(30000);

let app;
let reportId;
let appealId;

describe('Appeals API Tests', () => {
  beforeAll(async () => {
    app = require('../server');

    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }

      if (mongoose.connection.readyState === 1) {
        const report = await Report.create({
          type: 'Article',
          item: 'Test Article for Appeal',
          targetId: 'test-article-appeal',
          reportedBy: 'Thomas Okeke',
          reporterId: USER_ID,
          reason: 'Inappropriate content',
          description: 'Test report used for Appeal API testing.',
          status: 'resolved',

          aiAnalysis: {
            status: 'completed',
            label: 'possible_inappropriate_content',
            confidence: 0.75,
            summary: 'Test AI analysis.',
            analyzedAt: new Date(),
          },

          adminReview: {
            reviewedBy: ADMIN_ID,
            reviewedAt: new Date(),
            action: 'content_removed',
            notes: 'Test admin action.',
          },
        });

        reportId = report._id.toString();
      }
      if (!reportId) {
        reportId = '66c9f1a00000000000000099';
      }
    } catch (err) {
      reportId = '66c9f1a00000000000000099';
    }
  });

  afterAll(async () => {
    try {
      if (appealId && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(appealId)) {
        await Appeal.deleteOne({ _id: appealId });
      }

      if (reportId && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(reportId)) {
        await Report.deleteOne({ _id: reportId });
      }
    } catch (error) {
      console.error(
        '[Appeal Tests] Cleanup error:',
        error.message
      );
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('POST /api/appeals - should allow a user to submit an appeal', async () => {
    const res = await request(app)
      .post('/api/appeals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        reportId,
        reason: 'The reported action was incorrect',
        details:
          'I believe the content was removed incorrectly and would like an admin to review the decision.',
      });

    console.log('Appeal POST status:', res.statusCode);
    console.log('Appeal POST response:', res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.appeal).toBeDefined();

    appealId = res.body.appeal._id;

    expect(res.body.appeal.reportId).toBe(reportId);
    expect(res.body.appeal.status).toBe('pending');
  });

  it('GET /api/appeals/my - should return appeals for the logged-in user', async () => {
    const res = await request(app)
      .get('/api/appeals/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.appeals)).toBe(true);

    const createdAppeal = res.body.appeals.find(
      (appeal) => (appeal._id || appeal.id) === appealId
    );

    expect(createdAppeal).toBeDefined();
  });

  it('GET /api/appeals - should allow an admin to fetch appeals', async () => {
    const res = await request(app)
      .get('/api/appeals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.appeals)).toBe(true);

    const createdAppeal = res.body.appeals.find(
      (appeal) => (appeal._id || appeal.id) === appealId
    );

    expect(createdAppeal).toBeDefined();
  });

  it('PATCH /api/appeals/:id/review - should allow an admin to review an appeal', async () => {
    const res = await request(app)
      .patch(`/api/appeals/${appealId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        reviewNotes:
          'Appeal approved after administrator review.',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.appeal).toBeDefined();
    expect(res.body.appeal.status).toBe('approved');
    expect(res.body.appeal.reviewNotes).toBe(
      'Appeal approved after administrator review.'
    );
  });
});
