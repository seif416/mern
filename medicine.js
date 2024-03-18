const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
medicinename:String,
exp_date:Date,
address:String,
phone:String,
photo:String,
description:String
});

const Medicine = mongoose.model('Medicine', MedicineSchema);

module.exports = Medicine;