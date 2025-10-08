const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commenter: {
    type: String,
    required: true,
  },
  targetUser: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const requisitionSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
  },
  description: String,
  rationale: {
    type: String,
    required: true,
  },
  quautity: {
    type: Number,
    default: 1,
  },
  comments: [commentSchema],
  price: Number,
  createdBy: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'done', 'received', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

export default mongoose.models.Requisition ||
  mongoose.model('Requisition', requisitionSchema);
