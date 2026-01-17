const BrowserService = require('./browser.service');
const AuthService = require('./auth.service');
const JobSeekerService = require('./job.seeker.js');
const Utils = require('./utils');

class AutomationService {
    constructor() {
        this.logCallback = null;
    }

    setLogger(callback) {
        this.logCallback = callback;
    }

    log(message) {
        Utils.log(message, this.logCallback);
    }

    async startBrowser() {
        try {
            await BrowserService.start((msg) => this.log(msg));
        } catch (error) {
            console.error(error);
            this.log(`Error starting browser: ${error.message}`);
        }
    }

    async login(username, password) {
        try {
            const page = await BrowserService.start((msg) => this.log(msg));
            return await AuthService.login(page, username, password, (msg) => this.log(msg));
        } catch (error) {
            this.log(`Login Error: ${error.message}`);
            return false;
        }
    }

    async runJobSearch(settings) {
        try {
            const page = BrowserService.getPage();
            if (!page) {
                this.log("Browser not started.");
                return;
            }

            await JobSeekerService.search(page, settings, (msg) => this.log(msg));

            this.log("Job Search Completed.");
        } catch (error) {
            this.log(`Job Search Error: ${error.message}`);
            console.error(error);
        }
    }

    async closeBrowser() {
        await BrowserService.close();
        this.log("Browser Closed.");
    }
}

module.exports = new AutomationService();
