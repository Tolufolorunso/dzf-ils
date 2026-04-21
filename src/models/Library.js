const mongoose = require('mongoose');

const MODEL_NAME = 'Library';

const LibrarySchema = new mongoose.Schema({
  libraryName: {
    type: String,
    require: true,
    lowercase: true,
  },
  address: {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    country: {
      type: String,
    },
  },
  competitionDetails: {
    isActive: {
      type: Boolean,
      default: false,
    },
    title: String,
    results: {
      reading: {
        isPublished: {
          type: Boolean,
          default: false,
        },
        publishedAt: Date,
        publishedBy: {
          type: String,
          default: '',
          trim: true,
        },
      },
    },
  },
});

if (mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

export default mongoose.model(MODEL_NAME, LibrarySchema);
