const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
});

const commentSchema = new mongoose.Schema({
  commenter: {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  commentDate: {
    type: Date,
    default: Date.now,
  },
  commentText: {
    type: String,
    required: true,
  },
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  assignedBy: {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  assignedTo: {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'completed', 'archived'],
    default: 'To Do',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  comments: [commentSchema],
  likes: [likeSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
