const mongoose = require('mongoose');

const CohortGroupSchema = new mongoose.Schema(
  {
    cohortType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

CohortGroupSchema.pre('validate', function setDisplayName(next) {
  if (!this.displayName) {
    this.displayName = this.cohortType;
  }

  next();
});

CohortGroupSchema.index({ active: 1, order: 1, cohortType: 1 });

export default mongoose.models.CohortGroup ||
  mongoose.model('CohortGroup', CohortGroupSchema);
