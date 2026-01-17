const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    linkedInUsername: { type: String, required: true },
    linkedInPassword: { type: String, required: true },

    // Search Preferences
    searchTerms: [String],
    searchLocation: { type: String, default: "United States" },

    // Filters
    experienceLevels: [String], // e.g., ['Entry level', 'Associate']
    jobTypes: [String],        // e.g., ['Full-time', 'Contract']
    datePosted: { type: String, default: "Any time" },
    remoteFilter: { type: String, default: "Any" }, // On-site, Remote, Hybrid
    salary: { type: String, default: "" },

    // Applier Settings
    easyApplyOnly: { type: Boolean, default: true },
    randomDelayParams: {
        min: { type: Number, default: 2000 },
        max: { type: Number, default: 5000 }
    },

    // Personal Info for forms
    firstName: String,
    lastName: String,
    phone: String,
    address: String,
    resumePath: String, // Path to local resume file

    // AI Config
    useAI: { type: Boolean, default: false },
    aiProvider: { type: String, enum: ['openai', 'gemini', 'deepseek'], default: 'openai' },
    aiApiKey: String,
});

module.exports = mongoose.model('Settings', SettingsSchema);
