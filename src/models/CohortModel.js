const mongoose = require('mongoose');

const CohortSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    middlename: String,
    schoolClass: {
      type: String,
      trim: true,
      default: '',
    },
    receivedCertificate: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    cohortType: {
      type: String,
      required: true,
      trim: true,
    },
    removedAt: Date,
    attendance: [
      {
        date: Date,
        week: Number,
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

CohortSchema.index({ cohortType: 1, active: 1 });
CohortSchema.index({ cohortType: 1, isRemoved: 1 });
CohortSchema.index({ barcode: 1, active: 1 });
CohortSchema.index({ barcode: 1, cohortType: 1 }, { unique: true });

export default mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema);
