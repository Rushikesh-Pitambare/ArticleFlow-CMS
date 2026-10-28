const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userStore = require('../models/userStore');

/**
 * Generate signed JWT token
 */

 const generateToken = (userId, role) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn });
};

const getPublicAuthError = (error, action) => {
  if (error.code === 'AUTH_CONFIG_UNAVAILABLE') {
    return {
      status: 503,
      message: 'Authentication is temporarily unavailable because server configuration is incomplete.',
    };
  }

  if (error.code === 'DATABASE_UNAVAILABLE') {
    return {
      status: 503,
      message: process.env.NODE_ENV === 'development'
        ? error.message
        : 'Registration is temporarily unavailable because the database is not ready. Please try again later.',
    };
  }

  if (error.name === 'ValidationError') {
    return { status: 400, message: error.message };
  }

  if (error.message === 'JWT_SECRET environment variable is required') {
    return {
      status: 503,
      message: 'Authentication is temporarily unavailable because server configuration is incomplete.',
    };
  }

  if (process.env.NODE_ENV === 'development') {
    const detail = error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, '$1<credentials>@');
    return { status: 500, message: `${action} failed: ${detail}` };
  }

  return {
    status: 500,
    message: `An error occurred during ${action.toLowerCase()}. Please try again later.`,
  };
};

const validateRegistrationStorage = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET environment variable is required');
    error.code = 'AUTH_CONFIG_UNAVAILABLE';
    throw error;
  }

  const databaseConfigured = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  if (
    process.env.NODE_ENV !== 'test' &&
    databaseConfigured &&
    !userStore.isDBConnected()
  ) {
    const error = new Error('MongoDB is configured but not connected. Registration was stopped to protect account data.');
    error.code = 'DATABASE_UNAVAILABLE';
    throw error;
  }
  if (
    process.env.NODE_ENV !== 'test' &&
    !databaseConfigured &&
    process.env.NODE_ENV === 'production'
  ) {
    const error = new Error('MongoDB must be configured before accounts can be registered.');
    error.code = 'DATABASE_UNAVAILABLE';
    throw error;
  }
};


/**
 * @desc    Register a new user (Reader or Author)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body || {};

    // 1. Basic validation
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 100 characters.',
      });
    }

    if (typeof bio !== 'undefined' && typeof bio !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bio must be text.',
      });
    }
    if (typeof bio === 'string' && bio.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 500 characters.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (req.body.confirmPassword && password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    // 2. Enforce role restrictions: public registration cannot create admin accounts
    let assignedRole = 'reader';
    if (role) {
      if (typeof role !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid account role.',
        });
      }
      const normalizedRole = role.toLowerCase().trim();
      if (normalizedRole === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot be created via public registration.',
        });
      }
      if (!['reader', 'author'].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Please select either the Reader or Author role.',
        });
      }
      assignedRole = normalizedRole;
    }

    validateRegistrationStorage();

    // 3. Check for existing user with this email
    const existingUser = await userStore.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // 4. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user via userStore (persists to MongoDB if connected, or memory store)
    const newUser = await userStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      bio: bio ? bio.trim() : '',
    });

    // 6. Generate JWT
    const userId = newUser.id || newUser._id;
    const token = generateToken(userId, newUser.role);

    return res.status(201).json({
      success: true,
      message: userStore.isDBConnected()
        ? 'Account registered successfully.'
        : 'Account registered for this development session only. Configure MongoDB to save accounts permanently.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }
    const publicError = getPublicAuthError(error, 'Registration');
    return res.status(publicError.status).json({
      success: false,
      message: publicError.message,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email
    const user = await userStore.findByEmail(normalizedEmail, true);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Generate JWT
    const userId = user.id || user._id;
    const token = generateToken(userId, user.role);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      
user: {
  id: userId,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio,
  avatar: user.avatar,
  createdAt: user.createdAt,
  trustScore: user.trustScore ?? 50,
  trustLevel:
    user.trustLevel ||
    (user.trustScore >= 80
      ? 'exemplary'
      : user.trustScore >= 60
        ? 'trusted'
        : user.trustScore >= 35
          ? 'neutral'
          : 'restricted'),
  positiveContributionsCount: user.positiveContributionsCount ?? 0,violationsCount: user.violationsCount ?? 0,
},

    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    const publicError = getPublicAuthError(error, 'Sign in');
    return res.status(publicError.status).json({
      success: false,
      message: publicError.message,
    });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (Protected by authenticateUser)
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        bio: req.user.bio,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Auth GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current user session.',
    });
  }
};

/**
 * @desc    Logout user (Session invalidation response)
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
