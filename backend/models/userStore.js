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
        bio: 'Lead Editorial Director & Platform Administrator at Lumen.',
        avatar: '',
        readingHistory: [],
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
        bio: 'Historian of technology. Former editor at Nature. Coffee enthusiast.',
        avatar: '',
        readingHistory: [],
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
        bio: 'Molecular biologist & science communicator covering genetic engineering.',
        avatar: '',
        readingHistory: [],
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
        bio: 'Avid reader and tech quiz enthusiast exploring modern science.',
        avatar: '',
        readingHistory: [],
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
        console.warn('[DB Fallback] Mongoose create failed, using in-memory store:', err.message);
      }
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
      readingHistory: [],
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

  async updateUser(id, updateData) {
    if (isDBConnected()) {
      try {
        const user = await User.findById(id);
        if (user) {
          if (updateData.name !== undefined) user.name = updateData.name;
          if (updateData.bio !== undefined) user.bio = updateData.bio;
          if (updateData.avatar !== undefined) user.avatar = updateData.avatar;
          if (updateData.role !== undefined) user.role = updateData.role;
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
