const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema(
  {
    competitionType: {
      type: String,
      enum: [
        'reading',
        'writing',
        'speaking',
        'essay',
        'spelling',
        'listening',
        'other',
      ],
      default: 'reading',
      required: true,
    },
    title: {
      type: String,
      default: 'Reading Competition',
      trim: true,
    },
    sessionKey: {
      type: String,
      required: true,
      trim: true,
    },
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
      trim: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cataloging',
      required: true,
    },
    bookBarcode: {
      type: String,
      required: true,
      trim: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    checkoutDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkedOutBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['checked_out', 'checked_in'],
      default: 'checked_out',
      required: true,
    },
    checkinDate: Date,
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    teacherVerified: {
      type: Boolean,
      default: false,
    },
    teacherVerifiedBy: {
      type: String,
      trim: true,
      default: '',
    },
    gradedBy: {
      type: String,
      trim: true,
      default: '',
    },
    library: {
      type: String,
      default: 'AAoJ',
      required: true,
    },
  },
  { timestamps: true },
);

CompetitionSchema.index(
  { competitionType: 1, sessionKey: 1, patronBarcode: 1, bookBarcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sessionKey: { $exists: true },
      patronBarcode: { $exists: true },
      bookBarcode: { $exists: true },
    },
  }
);
CompetitionSchema.index({ competitionType: 1, sessionKey: 1, status: 1 });
CompetitionSchema.index({ competitionType: 1, sessionKey: 1, patronBarcode: 1 });

export default mongoose.models.Competition ||
  mongoose.model('Competition', CompetitionSchema);
