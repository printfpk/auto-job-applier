const Utils = require('./utils');

class AuthService {
    async login(page, username, password, logCallback) {
        if (!page) throw new Error("Page not initialized");

        Utils.log("Navigating to LinkedIn Login...", logCallback);
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

        if (page.url().includes("feed")) {
            Utils.log("Already logged in.", logCallback);
            return true;
        }

        try {
            await page.type('#username', username, { delay: 50 });
            await page.type('#password', password, { delay: 50 });

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
                page.click('[type="submit"]'),
            ]);

            if (page.url().includes("feed") || page.url().includes("check")) {
                Utils.log("Login successful.", logCallback);
                return true;
            } else {
                Utils.log("Login failed.", logCallback);
                return false;
            }
        } catch (error) {
            console.error("Login Error:", error);
            return false;
        }
    }
}

module.exports = new AuthService();
