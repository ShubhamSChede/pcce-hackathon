// models/UserDetail.js
const mongoose = require('mongoose');

const UserDetailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  is_subscribed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Creates createdAt and updatedAt fields
});

module.exports = mongoose.models.UserDetail || mongoose.model('UserDetail', UserDetailSchema);