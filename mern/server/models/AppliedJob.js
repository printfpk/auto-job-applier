const mongoose = require('mongoose');

const AppliedJobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    jobId: { type: String }, // Optional LinkedIn job ID if we can extract it
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Applied' } // Applied, Skipped, etc.
});

// Compound index to ensure uniqueness of Title + Company
AppliedJobSchema.index({ jobTitle: 1, companyName: 1 }, { unique: true });

module.exports = mongoose.model('AppliedJob', AppliedJobSchema);
