const express = require('express');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
  getOverview,
  getTopArticles,
  getPopularTopicsList,
  getArticleList,
  getFreshnessSummary,
  getFreshnessAlerts,
  markReviewed,
  auditLinks,
} = require('../controllers/analyticsController');

const router = express.Router();

// Only authors and admins can use analytics. Authors are scoped to their own
// articles inside the controller; admins can see all authors.
router.use(authenticateUser, authorizeRole('author', 'admin'));

router.get('/overview', getOverview);
router.get('/top-articles', getTopArticles);
router.get('/popular-topics', getPopularTopicsList);
router.get('/articles', getArticleList);

router.get('/freshness/summary', getFreshnessSummary);
router.get('/freshness/alerts', getFreshnessAlerts);
router.post('/freshness/review/:id', markReviewed);

router.post('/links/audit/:id', auditLinks);

module.exports = router;
