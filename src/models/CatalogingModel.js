// models/CatalogingModel.js

const mongoose = require('mongoose')

const CatalogingSchema = new mongoose.Schema(
  {
    title: {
      mainTitle: {
        type: String,
        required: true,
      },
      subtitle: {
        type: String,
      },
    },

    author: {
      mainAuthor: {
        type: String,
        required: true,
      },
      additionalAuthors: {
        type: Array,
      },
    },

    publicationInfo: {
      publisher: {
        type: String,
        required: true,
      },
      place: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    ISBN: {
      type: String,
      required: true,
    },
    classification: {
      type: String,
      required: true,
    },
    controlNumber: {
      type: String,
      required: true,
    },
    indexTermGenre: {
      type: Array,
      required: true,
    },
    informationSummary: {
      type: String,
    },
    language: {
      type: String,
      required: true,
      default: 'english',
    },
    physicalDescription: {
      type: String,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    holdingsInformation: {
      type: Number,
    },
    image_url: {
      type: String,
    },
    isCheckedOut: { type: Boolean, default: false },

    checkedOutHistory: [
      {
        checkedOutBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Patron',
        },
        checkedOutAt: { type: Date, default: null },
        dueDate: Date,
      },
    ],

    patronsCheckedOutHistory: [
      {
        checkedOutBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Patron',
        },
        checkedOutAt: { type: Date, default: null },
        dueDate: Date,
        fullname: String,
        contactNumber: String,
        barcode: String,
      },
    ],

    library: {
      type: String,
      default: 'AAoJ',
      required: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Cataloging ||
  mongoose.model('Cataloging', CatalogingSchema)
