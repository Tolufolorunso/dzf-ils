// models/BookSummaryModel.js
const mongoose = require('mongoose');

const BookSummarySchema = new mongoose.Schema(
  {
    patronId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patron',
      required: true,
    },
    patronBarcode: {
      type: String,
      required: true,
      trim: true,
    },
    patronName: {
      type: String,
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cataloging',
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    bookBarcode: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      minlength: 100, // Minimum 100 characters for a proper summary
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: String, // Staff member who reviewed
    },
    reviewDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    points: {
      type: Number,
      default: 0, // Points awarded after review
    },
    feedback: {
      type: String, // Staff feedback on the summary
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
BookSummarySchema.index({ patronBarcode: 1, submissionDate: 1 });
BookSummarySchema.index({ submissionDate: 1 });
BookSummarySchema.index({ status: 1 });

// Compound unique index to ensure one summary per patron per book
BookSummarySchema.index({ patronBarcode: 1, bookBarcode: 1 }, { unique: true });

export default mongoose.models.BookSummary ||
  mongoose.model('BookSummary', BookSummarySchema);
