const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const mongoose = require('mongoose');

puppeteer.use(StealthPlugin());

class AutomationService {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logCallback = null;
    }

    setLogger(callback) {
        this.logCallback = callback;
    }

    log(message) {
        console.log(`[Bot] ${message}`);
        if (this.logCallback) this.logCallback(message);
    }

    async startBrowser() {
        if (this.browser) return; // Browser already running

        this.log("Starting Browser...");
        this.browser = await puppeteer.launch({
            headless: false, // Run in headful mode to see what's happening
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null,
        });

        const pages = await this.browser.pages();
        this.page = pages[0];

        // Basic bot detection evasion
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        this.log("Browser Started.");
    }

    async login(username, password) {
        if (!this.page) await this.startBrowser();

        this.log("Navigating to LinkedIn Login...");
        await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        // Check if already logged in
        if (this.page.url().includes("feed")) {
            this.log("Already logged in.");
            return true;
        }

        try {
            await this.page.type('#username', username, { delay: 50 });
            await this.page.type('#password', password, { delay: 50 });
            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
                this.page.click('[type="submit"]'),
            ]);

            if (this.page.url().includes("feed") || this.page.url().includes("check")) {
                this.log("Login successful (or challenge presented).");
                return true;
            } else {
                this.log("Login failed.");
                return false;
            }
        } catch (error) {
            console.error("Login Error:", error);
            return false;
        }
    }

    async runJobSearch(settings) {
        if (!this.page) return;

        const { searchTerms, searchLocation } = settings;

        for (const term of searchTerms) {
            this.log(`Searching for: ${term} in ${searchLocation}`);
            const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}&location=${encodeURIComponent(searchLocation)}`;

            await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            await this.page.waitForSelector('.jobs-search-results-list', { timeout: 10000 }).catch(() => this.log("Job list not found immediately"));

            // Get job cards
            const jobCards = await this.page.$$('.job-card-container');
            this.log(`Found ${jobCards.length} jobs.`);

            for (const card of jobCards) {
                try {
                    await card.click();
                    await this.page.waitForTimeout(2000); // Wait for details to load

                    const titleEl = await this.page.$('.job-details-jobs-unified-top-card__job-title');
                    const title = titleEl ? await this.page.evaluate(el => el.innerText, titleEl) : "Unknown Title";
                    this.log(`Checking job: ${title}`);

                    // Check for Easy Apply button
                    const easyApplyBtn = await this.page.$('.jobs-apply-button--top-card');
                    if (easyApplyBtn) {
                        const btnText = await this.page.evaluate(el => el.innerText, easyApplyBtn);
                        if (btnText.includes('Easy Apply')) {
                            this.log("Easy Apply available. Clicking...");
                            await easyApplyBtn.click();
                            await this.handleEasyApplyModal(settings);
                        } else {
                            this.log("Not Easy Apply (External). Skipping.");
                        }
                    } else {
                        this.log("Already applied or no button.");
                    }

                } catch (e) {
                    console.error("Error processing job card:", e);
                }
            }
        }
    }

    async handleEasyApplyModal(settings) {
        this.log("Handling Easy Apply Modal...");
        await this.page.waitForSelector('.jobs-easy-apply-content', { timeout: 5000 }).catch(() => this.log("Modal didn't open?"));

        // Very basic loop to click "Next" until "Submit" or error
        let attempts = 0;
        while (attempts < 10) {
            // Check for Submit button
            const submitBtn = await this.page.$('button[aria-label="Submit application"]');
            if (submitBtn) {
                this.log("Found Submit button. Clicking...");
                await submitBtn.click();
                await this.page.waitForTimeout(3000); // Wait for submission
                // Close success modal if exists
                await this.page.keyboard.press('Escape');
                return;
            }

            // Check for Next button
            const nextBtn = await this.page.$('button[aria-label="Continue to next step"]');
            if (nextBtn) {
                this.log("Found Next button. Clicking...");
                await nextBtn.click();
                await this.page.waitForTimeout(1000);
            } else {
                // Check if Review button exists
                const reviewBtn = await this.page.$('button[aria-label="Review your application"]');
                if (reviewBtn) {
                    this.log("Found Review button. Clicking...");
                    await reviewBtn.click();
                    await this.page.waitForTimeout(1000);
                } else {
                    this.log("Stuck in modal. Closing.");
                    await this.page.keyboard.press('Escape');
                    // Confirm discard
                    await this.page.waitForTimeout(500);
                    const discardBtn = await this.page.$('button[data-control-name="discard_application_confirm_btn"]');
                    if (discardBtn) await discardBtn.click();
                    break;
                }
            }
            attempts++;
        }
    }



    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log("Browser Closed.");
        }
    }
}

module.exports = new AutomationService();
