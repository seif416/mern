const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicinename: { type: String, required: true },
  exp_date: { type: Date, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requested: { type: Boolean, default: false } // New field to indicate if the medicine is requested
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
