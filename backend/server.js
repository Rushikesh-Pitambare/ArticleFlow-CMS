const dns = require('dns');
const crypto = require('crypto');

// Force IPv4 DNS — prevents MongoDB Atlas NAT64 IPv6 connection drops
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const contentQualityRoutes = require('./routes/contentQualityRoutes');
const aiWritingRoutes = require('./routes/aiWritingRoutes');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[Lumen Auth] JWT_SECRET is not configured. A temporary development secret was generated; sessions will expire when the server restarts. Set JWT_SECRET in backend/.env for stable local sessions.'
    );
  }
} else if (!process.env.JWT_SECRET) {
  console.error(
    '[Lumen Auth] JWT_SECRET is not configured. Login and registration will remain unavailable until it is set.'
  );
}

const app = express();

// CORS configuration - Allow all origins dynamically with credentials support
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Lumen Content Management System API',
  });
});

// ======================================================
// Routes
// ======================================================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const adminVerificationRoutes = require('./routes/adminVerificationRoutes');
const quizRoutes = require('./routes/quizRoutes');
const quizAttemptRoutes = require('./routes/quizAttemptRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');

const subscriptionRoutes = require('./routes/subscriptionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reportRoutes = require('./routes/reportRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const spamAbuseRoutes = require('./routes/spamAbuseRouters');
const trustRoutes = require('./routes/trustRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const appealRoutes = require('./routes/appealRoutes');

// Authentication
app.use('/api/auth', authRoutes);

// User Management & Profiles
app.use('/api/users', userRoutes);

// Articles
app.use('/api/articles', articleRoutes);

// Public topic and category discovery
app.use('/api/discovery', discoveryRoutes);

// Admin Verification
app.use('/api/admin-verification', adminVerificationRoutes);

// Quizzes
app.use('/api/quizzes', quizRoutes);

// Quiz Attempts
app.use('/api/quiz-attempts', quizAttemptRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Comments & Discussions
app.use('/api/comments', commentRoutes);

// Subscriptions
app.use('/api/subscriptions', subscriptionRoutes);

// Messages / Chat
app.use('/api/messages', messageRoutes);

// Content Reports
app.use('/api/reports', reportRoutes);

app.use('/api/appeals', appealRoutes);

// Content Quality & Duplicate Detection
app.use('/api/content-quality', contentQualityRoutes);

// AI writing assistance and article summarization
app.use('/api/ai-writing', aiWritingRoutes);

// AI Content Moderation
app.use('/api/moderation', moderationRoutes);

// Spam & Abuse Detection
app.use('/api/spam-abuse', spamAbuseRoutes);

// User Trust & Reputation
app.use('/api/trust', trustRoutes);

// Author Analytics & Freshness Alerts
app.use('/api/analytics', analyticsRoutes);



// ======================================================
// Root route
// ======================================================

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Lumen CMS API',
    module: 'Full Stack Content Management System',
    documentation: '/api/health',
  });
});

// ======================================================
// 404 Handler
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================================================
// Error Handler
// ======================================================

app.use((err, req, res, next) => {
  console.error(
    '[Lumen Server Error]:',
    err.stack || err.message
  );

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development'
      ? { stack: err.stack }
      : {}),
  });
});

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

app.set('io', io);


io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization &&
      socket.handshake.headers.authorization.split(' ')[1]);

  const jwtSecret = process.env.JWT_SECRET;

  if (token && jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
    } catch (err) {
      console.warn(
        '[Lumen Socket.io] Unverified socket connection:',
        err.message
      );
    }
  }

  next();
});


io.on('connection', (socket) => {
  console.log(`[Lumen Socket.io] Client connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    if (userId) {
      const currentUserId = socket.user?.id || socket.user?._id;
      if (!currentUserId || String(currentUserId) === String(userId) || socket.user?.role === 'admin') {
        socket.join(userId.toString());
        console.log(`[Lumen Socket.io] Socket ${socket.id} joined room ${userId}`);
      }
    }
  });

  socket.on('send_message', (data) => {
    if (data && data.receiver && data.text) {
      const authenticatedSender = socket.user?.id || socket.user?._id;
      const validatedData = {
        ...data,
        sender: authenticatedSender || data.sender,
      };
      io.to(data.receiver.toString()).emit('receive_message', validatedData);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Lumen Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ======================================================
// Server Port
// ======================================================

const PORT = process.env.PORT || 5000;

// ======================================================
// Start Server
// ======================================================

if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    let databaseConnected = false;
    try {
      const connection = await connectDB();
      databaseConnected = Boolean(connection && connection.connection.readyState === 1);
    } catch {
      // The database layer logs a redacted failure category; keep the API online for health checks.
    }

    if (databaseConnected) {
      console.log('[Lumen Server] Database readiness: connected.');
    } else {
      console.warn('[Lumen Server] Database readiness: unavailable; article write requests will return HTTP 503 until MongoDB is reachable.');
    }

    server.listen(PORT, () => {
      console.log('\n=================================================');
      console.log(`  🌿 Lumen CMS Server running on port ${PORT}`);
      console.log(`  🔗 API Root: http://localhost:${PORT}/api/health`);
      console.log(`  💬 Real-Time Chat & Socket.io Enabled`);
      if (process.env.GEMINI_API_KEY) {
        console.log('  🤖 Gemini AI: configured for moderation and writing assistance ✅');
      } else {
        console.log('  ⚠️  Gemini AI: no API key — moderation and writing fallbacks active');
      }
      console.log('=================================================\n');
    });
  };

  startServer().catch((error) => {
    console.error(`[Lumen Server] Startup failed (${error.name || 'Error'}).`);
    process.exitCode = 1;
  });
}

module.exports = app;
