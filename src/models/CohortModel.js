const mongoose = require('mongoose');
import { normalizeCohortType } from '@/lib/cohort-utils';

const CohortSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: true,
      unique: true,
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
    active: {
      type: Boolean,
      default: true,
    },
    cohortType: {
      type: String,
      required: true,
      trim: true,
      set: normalizeCohortType,
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
CohortSchema.index({ barcode: 1, active: 1 });

export default mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema);
