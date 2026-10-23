const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    content: {
      type: String,
      required: [true, 'Article content is required'],
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Article category is required'],
      trim: true,
      enum: [
        'Science',
        'Technology',
        'Environment',
        'Health',
        'History',
        'Business',
        'Education',
        'Other',
      ],
    },

    tags: {
      type: [String],
      default: [],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'approved',
        'published',
        'rejected',
        'changes_requested',
      ],
      default: 'draft',
    },

    adminNote: {
      message: {
        type: String,
        default: '',
        trim: true,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },

    reviewFeedback: {
      type: String,
      default: '',
      trim: true,
    },

    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },

    quiz: {
      enabled: {
        type: Boolean,
        default: false,
      },

      question: {
        type: String,
        default: '',
        trim: true,
      },

      options: {
        type: [String],
        default: [],
      },

      correctAnswer: {
        type: String,
        default: '',
        trim: true,
      },
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Author Analytics & Freshness Alerts ---
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },

    linksAudit: {
      lastAuditedAt: { type: Date, default: null },
      totalLinks: { type: Number, default: 0 },
      brokenLinksCount: { type: Number, default: 0 },
      links: [
        {
          url: String,
          text: String,
          status: Number,
          statusText: String,
          isBroken: Boolean,
          skipped: Boolean,
          checkedAt: Date,
        },
      ],
    },

    readingTime: {
      type: Number,
      default: 1,
      min: 1,
    },

    aiModeration: {
      score: {
        type: Number,
        default: null,
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'pending', null],
        default: null,
      },
      flags: {
        type: [String],
        default: [],
      },
      reason: {
        type: String,
        default: '',
      },
      checkedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Calculate approximate reading time before saving.
articleSchema.pre('save', function (next) {
  if (this.content) {
    const wordCount = this.content
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

// Calculate reading time when content is updated.
articleSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update && update.content) {
    const wordCount = update.content
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    update.readingTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

module.exports = mongoose.model('Article', articleSchema);