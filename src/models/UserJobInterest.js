// models/UserJobInterest.js
const mongoose = require('mongoose');

const UserJobInterestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpportunity',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['interested', 'applied', 'saved'] // Ensures valid status values
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Creates createdAt and updatedAt fields
});

// Create compound index to ensure uniqueness of user-job combinations
UserJobInterestSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.models.UserJobInterest || mongoose.model('UserJobInterest', UserJobInterestSchema)