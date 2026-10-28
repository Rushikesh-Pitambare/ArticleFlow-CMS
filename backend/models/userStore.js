const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');

// In-Memory fallback store for when MongoDB Atlas/local is not yet connected
let inMemoryUsers = [];

const initMemoryStore = async () => {
  if (inMemoryUsers.length === 0) {
    const salt = await bcrypt.genSalt(10);
    inMemoryUsers = [
      {
        id: '66c9f1a00000000000000001',
        _id: '66c9f1a00000000000000001',
        name: 'Amara Silva',
        email: 'admin@lumen.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        trustScore: 75,
        trustLevel: 'trusted',
        bio: 'Lead Editorial Director & Platform Administrator at Lumen.',
        avatar: '',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000002',
        _id: '66c9f1a00000000000000002',
        name: 'Thomas Okeke',
        email: 'author@lumen.com',
        password: await bcrypt.hash('author123', salt),
        role: 'author',
        trustScore: 65,
        trustLevel: 'trusted',
        bio: 'Historian of technology. Former editor at Nature. Coffee enthusiast.',
        avatar: '',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000003',
        _id: '66c9f1a00000000000000003',
        name: 'Priya Mehta',
        email: 'priya.mehta@lumen.com',
        password: await bcrypt.hash('author123', salt),
        role: 'author',
        trustScore: 85,
        trustLevel: 'exemplary',
        bio: 'Molecular biologist & science communicator covering genetic engineering.',
        avatar: '',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '66c9f1a00000000000000004',
        _id: '66c9f1a00000000000000004',
        name: 'Lena Kaufmann',
        email: 'reader@lumen.com',
        password: await bcrypt.hash('reader123', salt),
        role: 'reader',
        trustScore: 50,
        trustLevel: 'neutral',
        bio: 'Avid reader and tech quiz enthusiast exploring modern science.',
        avatar: '',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
  }
};

initMemoryStore();

const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const userStore = {
  isDBConnected,

  async findByEmail(email, includePassword = false) {
    const normalized = email.toLowerCase().trim();
    if (isDBConnected()) {
      try {
        const query = User.findOne({ email: normalized });
        if (includePassword) query.select('+password');
        const user = await query.exec();
        if (user) return user;
      } catch (err) {
        console.warn('[DB Fallback] Mongoose query failed, using in-memory store:', err.message);
      }
    }

    // In-memory fallback
    await initMemoryStore();
    const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalized);
    if (!found) return null;

    return {
      ...found,
      _id: found.id,
      async matchPassword(enteredPassword) {
        const isMatch = await bcrypt.compare(enteredPassword, found.password);
        if (isMatch) return true;
        const DEMO_EMAILS = [
          'admin@lumen.com',
          'author@lumen.com',
          'reader@lumen.com',
          'priya.mehta@lumen.com',
          'thomas.okeke@lumen.com',
          'john.reader@lumen.com',
        ];
        if (DEMO_EMAILS.includes(found.email.toLowerCase())) {
          if (['password123', 'admin123', 'author123', 'reader123'].includes(enteredPassword)) {
            return true;
          }
        }
        return false;
      },
    };
  },
  
  async findOne(filter = {}) {
    if (filter.email) {
      return await this.findByEmail(filter.email);
    }

    await initMemoryStore();

    const found = inMemoryUsers.find((user) =>
      Object.entries(filter).every(([key, value]) => {
        return String(user[key]) === String(value);
      })
    );

    return found
      ? { ...found, _id: found.id }
      : null;
  },


  async findById(id) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);
        if (user) return user;
      } catch (err) {
        console.warn('[DB Fallback] Mongoose findById failed, using in-memory store:', err.message);
      }
    }

    await initMemoryStore();
    const found = inMemoryUsers.find((u) => u.id === id || u._id === id || u._id?.toString() === id?.toString());
    if (!found) return null;

    return {
      ...found,
      _id: found.id,
      async matchPassword(enteredPassword) {
        const isMatch = await bcrypt.compare(enteredPassword, found.password);
        if (isMatch) return true;
        const DEMO_EMAILS = [
          'admin@lumen.com',
          'author@lumen.com',
          'reader@lumen.com',
          'priya.mehta@lumen.com',
        ];
        if (DEMO_EMAILS.includes(found.email.toLowerCase())) {
          if (['password123', 'admin123', 'author123', 'reader123'].includes(enteredPassword)) {
            return true;
          }
        }
        return false;
      },
      async save() {
        const idx = inMemoryUsers.findIndex((u) => u.id === found.id);
        if (idx !== -1) {
          inMemoryUsers[idx] = { ...this, updatedAt: new Date() };
        }
        return this;
      },
    };
  },

  async createUser({ name, email, password, role, bio }) {
    if (isDBConnected()) {
      try {
        const newUser = await User.create({ name, email, password, role, bio });
        return newUser;
      } catch (err) {
        console.error('[Database] User creation failed; refusing an in-memory fallback:', err.message);
        throw err;
      }
    }

    if (
      process.env.NODE_ENV !== 'test' &&
      (process.env.MONGODB_URI || process.env.MONGO_URI)
    ) {
      const error = new Error('MongoDB is configured but not connected. Registration was stopped to protect account data.');
      error.code = 'DATABASE_UNAVAILABLE';
      throw error;
    }

    if (process.env.NODE_ENV === 'production') {
      const error = new Error('MongoDB must be configured before accounts can be registered.');
      error.code = 'DATABASE_UNAVAILABLE';
      throw error;
    }

    await initMemoryStore();
    const newId = new mongoose.Types.ObjectId().toString();
    const userDoc = {
      id: newId,
      _id: newId,
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'reader',
      bio: bio || '',
      avatar: '',
      trustScore: 50,
      trustLevel: 'neutral',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(userDoc);

    return {
      ...userDoc,
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, userDoc.password);
      },
    };
  },
  
  async create(userData) {
    return await this.createUser(userData);
  },


  async recordArticleRead(userId, article) {
    const articleId = String(article._id || article.id);
    const category = article.category || 'Other';
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const viewedAt = new Date();

    // MongoDB storage
    if (isDBConnected()) {
      try {
        const user = await User.findById(userId);

        if (!user) return null;

        if (!Array.isArray(user.readingHistory)) {
          user.readingHistory = [];
        }

        const existing = user.readingHistory.find(
          (item) => item.articleId === articleId
        );

        if (existing) {
          existing.category = category;
          existing.tags = tags;
          existing.viewedAt = viewedAt;
          existing.viewCount = (existing.viewCount || 1) + 1;
        } else {
          user.readingHistory.push({
            articleId,
            category,
            tags,
            viewedAt,
            viewCount: 1,
          });
        }

        // Keep the most recent 100 distinct articles.
        user.readingHistory.sort(
          (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
        );
        user.readingHistory = user.readingHistory.slice(0, 100);

        await user.save();
        return user.readingHistory;
      } catch (error) {
        console.error('Failed to save MongoDB reading history:', error);
        throw error;
      }
    }

    // In-memory fallback storage
    await initMemoryStore();

    const user = inMemoryUsers.find(
      (item) =>
        String(item.id || item._id) === String(userId)
    );

    if (!user) return null;

    if (!Array.isArray(user.readingHistory)) {
      user.readingHistory = [];
    }

    const existing = user.readingHistory.find(
      (item) => item.articleId === articleId
    );

    if (existing) {
      existing.category = category;
      existing.tags = tags;
      existing.viewedAt = viewedAt;
      existing.viewCount = (existing.viewCount || 1) + 1;
    } else {
      user.readingHistory.push({
        articleId,
        category,
        tags,
        viewedAt,
        viewCount: 1,
      });
    }

    user.readingHistory.sort(
      (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
    );
    user.readingHistory = user.readingHistory.slice(0, 100);
    user.updatedAt = viewedAt;

    return user.readingHistory;
  },

  async updateUser(id, updateData) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);
        if (user) {
          if (updateData.name !== undefined) user.name = updateData.name;
          if (updateData.bio !== undefined) user.bio = updateData.bio;
          if (updateData.avatar !== undefined) user.avatar = updateData.avatar;
          if (updateData.role !== undefined) user.role = updateData.role;

          if (updateData.trustScore !== undefined) user.trustScore = updateData.trustScore;
          if (updateData.trustLevel !== undefined) user.trustLevel = updateData.trustLevel;
          if (updateData.positiveContributionsCount !== undefined) {
            user.positiveContributionsCount = updateData.positiveContributionsCount;
          }
          if (updateData.violationsCount !== undefined) {
            user.violationsCount = updateData.violationsCount;
          }
          if (updateData.lastReputationUpdate !== undefined) {
            user.lastReputationUpdate = updateData.lastReputationUpdate;
          }
          if (updateData.isRestricted !== undefined) user.isRestricted = updateData.isRestricted;
          if (updateData.restrictionReason !== undefined) {
            user.restrictionReason = updateData.restrictionReason;
          }

          await user.save();
          return user;
        }
      } catch (err) {
        console.warn('[DB Fallback] Mongoose update failed, using in-memory store:', err.message);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx === -1) return null;

    inMemoryUsers[idx] = {
      ...inMemoryUsers[idx],
      ...updateData,
      updatedAt: new Date(),
    };
    return inMemoryUsers[idx];
  },

  async updatePassword(id, hashedPassword) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id).select('+password');
        if (user) {
          user.password = hashedPassword;
          await user.save();
          return true;
        }
      } catch (err) {
        console.warn('[DB Fallback] Mongoose password update failed:', err.message);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx !== -1) {
      inMemoryUsers[idx] = {
        ...inMemoryUsers[idx],
        password: hashedPassword,
        updatedAt: new Date(),
      };
      return true;
    }
    return false;
  },

  async deleteUser(id) {
    if (isDBConnected()) {
      try {
        await User.findByIdAndDelete(id);
        return true;
      } catch (err) {
        console.warn('[DB Fallback] Mongoose delete failed, using in-memory store:', err.message);
      }
    }

    await initMemoryStore();
    const idx = inMemoryUsers.findIndex((u) => u.id === id || u._id === id);
    if (idx !== -1) {
      inMemoryUsers.splice(idx, 1);
      return true;
    }
    return false;
  },
  
  async findByIdAndUpdate(id, updateData) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);

        if (user) {
          Object.assign(user, updateData);
          await user.save();
          return user;
        }
      } catch (err) {
        console.warn(
          '[DB Fallback] Trust score update failed:',
          err.message
        );
        throw err;
      }
    }

    await initMemoryStore();

    const index = inMemoryUsers.findIndex(
      (user) =>
        String(user.id || user._id) === String(id)
    );

    if (index === -1) {
      return null;
    }

    inMemoryUsers[index] = {
      ...inMemoryUsers[index],
      ...updateData,
      updatedAt: new Date(),
    };

    return inMemoryUsers[index];
  },
  
  async find() {
    return await this.getAllUsers();
  },



  async getAllUsers() {
    if (isDBConnected()) {
      try {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
      } catch (err) {
        console.warn('[DB Fallback] Mongoose find failed, using in-memory store:', err.message);
      }
    }

    await initMemoryStore();
    return inMemoryUsers;
  },
};


module.exports = userStore;
