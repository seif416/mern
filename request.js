const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  medicinename: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: false },
  phone: { type: String, required: false },
  description: { type: String, required: false },
  requested: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);

