const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    jobId: { type: String, unique: true, required: true },
    title: String,
    company: String,
    location: String,
    dateApplied: { type: Date, default: Date.now },
    status: { type: String, enum: ['Applied', 'Failed', 'Skipped'], default: 'Applied' },
    jobLink: String,
    notes: String,
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
