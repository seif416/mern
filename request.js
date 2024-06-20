const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  medicinename: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  photo: { type: String, required: true },
  description: { type: String, required: true },
  requested: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now } // Add this field if not already present
});

module.exports = mongoose.model('Request', requestSchema);
