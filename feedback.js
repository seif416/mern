const mongoose = require('mongoose');

// Define a Mongoose schema for Feedback
const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String // Assuming the comment is a text field
  }
});

// Create a Mongoose model for Feedback using the schema
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
