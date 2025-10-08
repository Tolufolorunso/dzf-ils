const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  dept: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    required: true,
  },
  addedBy: String,
  barcode: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    secure_url: String,
    public_id: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Inventory ||
  mongoose.model('Inventory', InventorySchema);
