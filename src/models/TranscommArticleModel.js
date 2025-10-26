// models/TranscommArticleModel.js
const mongoose = require('mongoose');

const TranscommArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'drnicer-values',
        'leadership-basics',
        'communication',
        'teamwork',
        'problem-solving',
        'confidence',
        'inspiration',
      ],
    },
    readTime: {
      type: String,
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 200,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
TranscommArticleSchema.index({ category: 1, isActive: 1 });
TranscommArticleSchema.index({ createdAt: -1 });
TranscommArticleSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
});

export default mongoose.models.TranscommArticle ||
  mongoose.model('TranscommArticle', TranscommArticleSchema);
