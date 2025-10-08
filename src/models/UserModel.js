const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: String,
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '0800000000',
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['admin', 'asst_admin', 'ima', 'librarian', 'ict', 'facility'],
    default: 'librarian',
  },
  userImg: {
    secure_url: String,
    public_id: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
