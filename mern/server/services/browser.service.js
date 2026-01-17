const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Utils = require('./utils');

puppeteer.use(StealthPlugin());

class BrowserService {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async start(logCallback) {
        if (this.browser) return this.page;

        Utils.log("Starting Browser...", logCallback);
        this.browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
            defaultViewport: null,
        });

        const pages = await this.browser.pages();
        this.page = pages[0];

        // Evasion
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        Utils.log("Browser Started.", logCallback);
        return this.page;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    getPage() {
        return this.page;
    }
}

module.exports = new BrowserService();
