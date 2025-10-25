// models/MonthlyActivityModel.js
const mongoose = require('mongoose');

const MonthlyActivitySchema = new mongoose.Schema(
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
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    booksCheckedOut: {
      type: Number,
      default: 0,
    },
    booksReturned: {
      type: Number,
      default: 0,
    },
    classesAttended: {
      type: Number,
      default: 0,
    },
    summariesSubmitted: {
      type: Number,
      default: 0,
    },
    summariesApproved: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    pointsFromBooks: {
      type: Number,
      default: 0,
    },
    pointsFromAttendance: {
      type: Number,
      default: 0,
    },
    pointsFromSummaries: {
      type: Number,
      default: 0,
    },
    activityScore: {
      type: Number,
      default: 0, // Calculated score based on all activities
    },
    rank: {
      type: Number,
      default: 0, // Monthly rank among all patrons
    },
    isActive: {
      type: Boolean,
      default: false, // True if patron had any activity this month
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
MonthlyActivitySchema.index({ year: 1, month: 1, activityScore: -1 });
MonthlyActivitySchema.index(
  { patronId: 1, year: 1, month: 1 },
  { unique: true }
);
MonthlyActivitySchema.index({ year: 1, month: 1, isActive: 1 });

export default mongoose.models.MonthlyActivity ||
  mongoose.model('MonthlyActivity', MonthlyActivitySchema);
