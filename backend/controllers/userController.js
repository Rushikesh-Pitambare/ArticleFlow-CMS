const bcrypt = require('bcryptjs');
const userStore = require('../models/userStore');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await userStore.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[User getProfile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.',
    });
  }
};

/**
 * @desc    Update current user profile (name, bio, avatar)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const userId = req.user.id || req.user._id;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty.',
        });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 100 characters.',
        });
      }
    }

    if (bio !== undefined && bio.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 500 characters.',
      });
    }

    const updatedUser = await userStore.updateUser(userId, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(bio !== undefined ? { bio: bio.trim() } : {}),
      ...(avatar !== undefined ? { avatar: avatar.trim() } : {}),
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id || updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('[User updateProfile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile.',
    });
  }
};

/**
 * @desc    Get public user profile by ID
 * @route   GET /api/users/:id
 * @access  Public / Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await userStore.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[User getUserById Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user.',
    });
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userStore.getAllUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      
      
      users: users.map((u) => ({
        id: u.id || u._id,
        _id: u.id || u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        bio: u.bio,
        createdAt: u.createdAt,
        trustScore: typeof u.trustScore === 'number' ? u.trustScore : null,
        trustLevel: u.trustLevel || 'neutral',
        isRestricted: u.isRestricted || false,
      })),

    });
  } catch (error) {
    console.error('[User getAllUsers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users.',
    });
  }
};

/**
 * @desc    Admin: Create new user (Admin, Author, or Reader)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userStore.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'reader',
      bio: bio ? bio.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[User createUserByAdmin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating user.',
    });
  }
};

/**
 * @desc    Admin: Update user role
 * @route   PUT /api/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['reader', 'author', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be reader, author, or admin.',
      });
    }

    const updatedUser = await userStore.updateUser(req.params.id, { role });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: {
        id: updatedUser.id || updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('[User updateUserRole Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user role.',
    });
  }
};

/**
 * @desc    Admin: Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentAdminId = req.user.id || req.user._id;

    if (String(targetId) === String(currentAdminId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account while signed in.',
      });
    }

    const deleted = await userStore.deleteUser(targetId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('[User deleteUser Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting user.',
    });
  }
};

/**
 * @desc    Change current user's password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id || req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and a new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match. Please re-enter your new password.',
      });
    }

    // Retrieve user including password
    let user;
    if (userStore.isDBConnected()) {
      const User = require('../models/User');
      user = await User.findById(userId).select('+password');
    } else {
      user = await userStore.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'The current password provided is incorrect.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userStore.updatePassword(userId, hashedPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('[User changePassword Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating password.',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  deleteUser,
};
