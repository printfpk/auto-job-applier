const Utils = require('./utils');
const JobApplier = require('./job.applier');

class JobSeekerService {
    async search(page, settings, logCallback) {
        const { searchTerms, searchLocation } = settings;

        for (const term of searchTerms) {
            Utils.log(`Starting search for: ${term} in ${searchLocation}`, logCallback);

            const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}&location=${encodeURIComponent(searchLocation)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            await Utils.delay(3000);

            let currentPage = 1;

            while (true) {
                Utils.log(`Processing Page ${currentPage}...`, logCallback);

                // 1. Robustly get Job Cards
                const cards = await this.getJobCards(page, logCallback);

                if (cards.length === 0) {
                    Utils.log("No job cards found. Ending search for this term.", logCallback);
                    break;
                }

                // 2. Iterate through cards
                for (let i = 0; i < cards.length; i++) {
                    await this.processCard(page, i, settings, logCallback);
                }

                // 3. Next Page
                const hasNext = await this.goToNextPage(page, logCallback);
                if (!hasNext) {
                    Utils.log("No next page. Finished this term.", logCallback);
                    break;
                }
                currentPage++;
            }
        }
    }

    async getJobCards(page, logCallback) {
        // Broadest possible selectors for job cards in search results
        // 1. li.jobs-search-results__list-item (Classic)
        // 2. div.job-card-container (Modern)
        // 3. div.job-card-list__entity-lockup (Some layouts)
        // 4. a.job-card-list__title (Just the clickable title)
        const cardSelector = 'li.jobs-search-results__list-item, div.job-card-container, div.job-card-list__entity-lockup';

        try {
            // Just wait for at least one of these to appear
            await page.waitForSelector(cardSelector, { timeout: 10000 });
        } catch (e) {
            Utils.log(`No job cards visible (Timeout). URL: ${page.url()}`, logCallback);
            return [];
        }

        // Helper to scroll list - just scroll the whole window and common containers
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
            const list = document.querySelector('.jobs-search-results-list');
            if (list) list.scrollTo(0, list.scrollHeight);
        });
        await Utils.delay(2000);

        return await page.$$(cardSelector);
    }

    async processCard(page, index, settings, logCallback) {
        try {
            // Refetch cards to avoid stale elements
            const cards = await page.$$('li.jobs-search-results__list-item, div.job-card-container');
            const card = cards[index];

            if (!card) return;

            // Scroll into View
            await page.evaluate(el => el.scrollIntoView({ block: 'center' }), card);
            await Utils.delay(300);

            // Click
            await page.evaluate(el => el.click(), card);

            // Delegate to Applier
            await JobApplier.processJob(page, settings, logCallback);

        } catch (e) {
            Utils.log(`Error on card ${index}: ${e.message}`, logCallback);
        }
    }

    async goToNextPage(page, logCallback) {
        // Selectors for pagination
        const nextSelectors = [
            'button[aria-label="Next"]',
            '.artdeco-pagination__button--next'
        ];

        for (const sel of nextSelectors) {
            const btn = await page.$(sel);
            if (btn) {
                const isDisabled = await page.evaluate(el => el.disabled || el.classList.contains('disabled'), btn);
                if (!isDisabled) {
                    await btn.click();
                    await Utils.delay(4000);
                    return true;
                }
            }
        }
        return false;
    }
}

module.exports = new JobSeekerService();
