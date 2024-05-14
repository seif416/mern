const mongoose = require('mongoose');

// Define schema for requested medicines
const RequestSchema = new mongoose.Schema({
  medicinename: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  requested: { type: Boolean, default: false },
  requestedAt: { type: Date, default: Date.now }
});

// Create model for requested medicines
const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;
