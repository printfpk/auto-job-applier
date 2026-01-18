const Utils = require('./utils');
const JobApplier = require('./job.applier');
const AppliedJob = require('../models/AppliedJob');

class JobSeekerService {
    async search(page, settings, logCallback) {
        const { searchTerms, searchLocation } = settings;

        // Normalize locations to an array
        const locations = Array.isArray(searchLocation) ? searchLocation : [searchLocation];

        for (const location of locations) {
            for (const term of searchTerms) {
                Utils.log(`Starting search for: "${term}" in "${location}"`, logCallback);

                const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}`;
                try {
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                } catch (e) {
                    Utils.log(`Navigation error (retrying): ${e.message}`, logCallback);
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                }
                await Utils.delay(5000);

                let currentPage = 1;
                let jobsAppliedCount = 0;
                const MAX_JOBS_PER_TERM = 20;

                while (jobsAppliedCount < MAX_JOBS_PER_TERM) {
                    Utils.log(`Processing Page ${currentPage}... (Applied: ${jobsAppliedCount}/${MAX_JOBS_PER_TERM})`, logCallback);

                    const cards = await this.getJobCards(page, logCallback);

                    if (cards.length === 0) {
                        Utils.log("No job cards found. Ending search for this term.", logCallback);
                        break;
                    }

                    for (let i = 0; i < cards.length; i++) {
                        if (jobsAppliedCount >= MAX_JOBS_PER_TERM) break;

                        const applied = await this.processCard(page, i, settings, logCallback);
                        if (applied) {
                            jobsAppliedCount++;
                        }
                    }

                    if (jobsAppliedCount >= MAX_JOBS_PER_TERM) {
                        Utils.log(`Reached limit of ${MAX_JOBS_PER_TERM} jobs for term "${term}". Moving to next term.`, logCallback);
                        break;
                    }

                    const hasNext = await this.goToNextPage(page, logCallback);
                    if (!hasNext) {
                        Utils.log("No next page. Finished this term.", logCallback);
                        break;
                    }
                    currentPage++;
                }
            }
        }
    }

    async getJobCards(page, logCallback) {
        const cardSelector = 'li.jobs-search-results__list-item, div.job-card-container, div.job-card-list__entity-lockup';

        try {
            await page.waitForSelector(cardSelector, { timeout: 10000 });
        } catch (e) {
            Utils.log(`No job cards visible (Timeout). URL: ${page.url()}`, logCallback);
            return [];
        }

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
            const cardSelector = 'li.jobs-search-results__list-item, div.job-card-container, div.job-card-list__entity-lockup';
            const cards = await page.$$(cardSelector);
            const card = cards[index];

            if (!card) return false;

            // 1. Quick "Applied" Badge Check (UI)
            // If the card itself says "Applied", skip immediately
            const isAppliedUI = await page.evaluate(el => {
                const footer = el.querySelector('.job-card-list__footer-wrapper, .job-card-container__footer-item');
                return footer && footer.innerText.toLowerCase().includes('applied');
            }, card);

            if (isAppliedUI) {
                // Utils.log(`Skipping (UI says Applied) job at index ${index}`, logCallback);
                return false;
            }

            await page.evaluate(el => el.scrollIntoView({ block: 'center' }), card);

            const jobInfo = await page.evaluate(el => {
                const titleNode = el.querySelector('.job-card-list__title, .artdeco-entity-lockup__title');
                const compNode = el.querySelector('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle');
                return {
                    title: titleNode ? titleNode.innerText.trim() : "Unknown",
                    company: compNode ? compNode.innerText.trim() : "Unknown"
                };
            }, card);

            // 2. Database Check
            const exists = await AppliedJob.findOne({ jobTitle: jobInfo.title, companyName: jobInfo.company });
            if (exists) {
                Utils.log(`Skipping (DB says Applied): ${jobInfo.title} at ${jobInfo.company}`, logCallback);
                return false;
            }

            try {
                await Utils.delay(500);
                await page.evaluate(el => el.click(), card);
            } catch (e) {
                return false;
            }

            // Wait for details panel to update
            await Utils.delay(3000);

            // Delegate to Applier
            const success = await JobApplier.processJob(page, settings, logCallback);

            if (success) {
                // Save to DB
                try {
                    await AppliedJob.create({
                        jobTitle: jobInfo.title,
                        companyName: jobInfo.company,
                        status: 'Applied'
                    });
                    Utils.log(`Saved to DB: ${jobInfo.title}`, logCallback);
                } catch (err) {
                    // duplicate key error might happen if race condition, ignore
                }
                return true;
            }

            return false;

        } catch (e) {
            // Ignore detached errors effectively
            if (!e.message.includes('detached') && !e.message.includes('destroyed')) {
                Utils.log(`Error on card ${index}: ${e.message}`, logCallback);
            }
            return false;
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
