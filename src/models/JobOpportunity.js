// models/JobOpportunity.js
const mongoose = require('mongoose');

const JobOpportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  salary_range: {
    type: String,
    trim: true
  },
  job_description: {
    type: String,
    trim: true
  },
  contact_email: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true // Only creates createdAt field to match your schema
});

module.exports = mongoose.models.JobOpportunity || mongoose.model('JobOpportunity', JobOpportunitySchema);