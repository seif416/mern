const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  medicinename: String,
  exp_date: Date,
  address: String,
  phone: String,
  photo: String,
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to the User model
  }
});

const Medicine = mongoose.model('Medicine', MedicineSchema);

module.exports = Medicine;
