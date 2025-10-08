const mongoose = require('mongoose')

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
    },
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
)

export default mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema)
