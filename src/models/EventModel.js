const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    lowercase: true,
  },
  attendee: {
    type: String,
    required: true,
    lowercase: true,
  },
  eventDate: {
    type: Date,
    default: Date.now,
  },
  eventDetail: String,
  arrivalTime: String,
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
