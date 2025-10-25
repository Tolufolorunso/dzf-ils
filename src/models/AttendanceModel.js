// models/AttendanceModel.js
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
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
    classType: {
      type: String,
      enum: [
        'literacy',
        'reading_club',
        'book_discussion',
        'workshop',
        'other',
      ],
      default: 'literacy',
    },
    className: {
      type: String,
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
    },
    attendanceTime: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: String,
      required: true, // Staff member who marked attendance
    },
    points: {
      type: Number,
      default: 5, // Points awarded for attendance
    },
    notes: {
      type: String,
      trim: true,
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
AttendanceSchema.index({ patronBarcode: 1, classDate: 1 });
AttendanceSchema.index({ classDate: 1 });
AttendanceSchema.index({ patronId: 1, classDate: 1 });

export default mongoose.models.Attendance ||
  mongoose.model('Attendance', AttendanceSchema);
