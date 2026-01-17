const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const JobApplication = require('../models/JobApplication');
const AutomationService = require('../services/automation.service');

// Get Settings
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ linkedInUsername: '', linkedInPassword: '' });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Settings
router.post('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Bot
router.post('/bot/start', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.linkedInUsername || !settings.linkedInPassword) {
            return res.status(400).json({ error: "Missing LinkedIn Credentials" });
        }

        // Run asynchronously
        AutomationService.login(settings.linkedInUsername, settings.linkedInPassword)
            .then(async success => {
                if (success) {
                    console.log("Bot Login Sequence Complete. Starting Search...");
                    await AutomationService.runJobSearch(settings);
                }
                else console.log("Bot Login Sequence Failed");
            })
            .catch(err => console.error("Bot Error", err));

        res.json({ message: "Bot started" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stop Bot
router.post('/bot/stop', async (req, res) => {
    try {
        await AutomationService.closeBrowser();
        res.json({ message: "Bot stopped" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
