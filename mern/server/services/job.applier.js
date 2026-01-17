const Utils = require('./utils');

class JobApplierService {
    async processJob(page, settings, logCallback) {
        try {
            // Wait a bit for the layout to settle
            await Utils.delay(2000);

            // 1. Get Title
            const titleEl = await page.$('.job-details-jobs-unified-top-card__job-title');
            const title = titleEl ? await page.evaluate(el => el.innerText, titleEl) : "Unknown Title";
            Utils.log(`Checking job: ${title}`, logCallback);

            // 2. Find Easy Apply Button
            let applyBtn = await this.findApplyButton(page);

            if (applyBtn) {
                Utils.log("Easy Apply button found. Clicking...", logCallback);
                await this.clickButton(page, applyBtn);
                await Utils.delay(2000);
                await this.handleModal(page, logCallback);
            } else {
                Utils.log("No Easy Apply button found (Already applied / External).", logCallback);
            }
        } catch (e) {
            console.error("Error processing job:", e);
        }
    }

    async findApplyButton(page) {
        // Strategy A: Specific Selectors
        const selectors = [
            '.jobs-apply-button--top-card button',
            '.jobs-apply-button',
            'button[aria-label*="Easy Apply"]'
        ];

        for (const s of selectors) {
            const btn = await page.$(s);
            if (btn) {
                // Double check text
                const txt = await page.evaluate(el => el.innerText, btn).catch(() => "");
                if (txt.toLowerCase().includes('easy apply')) return btn;
            }
        }

        // Strategy B: Visible Text Search (fallback)
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.innerText, btn).catch(() => "");
            if (text.toLowerCase().includes('easy apply')) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                }, btn);
                if (isVisible) return btn;
            }
        }
        return null;
    }

    async clickButton(page, element) {
        try {
            await element.click();
        } catch (e) {
            await page.evaluate(el => el.click(), element);
        }
    }

    async handleModal(page, logCallback) {
        Utils.log("Handling Application Modal...", logCallback);
        // Wait for modal
        try {
            await page.waitForSelector('.jobs-easy-apply-content', { timeout: 5000 });
        } catch {
            Utils.log("Modal did not appear.", logCallback);
            return;
        }

        let attempts = 0;
        const MAX_STEPS = 15;

        while (attempts < MAX_STEPS) {
            await Utils.delay(1000); // Pace ourselves

            // 1. Handle Questions (Inputs/Radios)
            await this.fillQuestions(page, logCallback);

            // 2. Identify Action Buttons
            const submitBtn = await page.$('button[aria-label="Submit application"]');
            const nextBtn = await page.$('button[aria-label="Continue to next step"]');
            const reviewBtn = await page.$('button[aria-label="Review your application"]');

            if (submitBtn) {
                Utils.log("Submitting application...", logCallback);
                await this.clickButton(page, submitBtn);
                await Utils.delay(3000); // wait for success
                await page.keyboard.press('Escape'); // close success/confetti
                return;
            }

            if (nextBtn) {
                Utils.log("Clicking Next...", logCallback);
                await this.clickButton(page, nextBtn);

                // Check for errors after clicking Next
                await Utils.delay(1000);
                const error = await page.$('.artdeco-inline-feedback--error');
                if (error) {
                    Utils.log("Form validation error detected. Stopping this application.", logCallback);
                    await this.closeModal(page);
                    return;
                }
                continue;
            }

            if (reviewBtn) {
                Utils.log("Reviewing application...", logCallback);
                await this.clickButton(page, reviewBtn);
                continue;
            }

            // No buttons found? Maybe we are done or stuck.
            Utils.log("No navigation buttons found. Closing modal.", logCallback);
            await this.closeModal(page);
            break;
        }
    }

    async fillQuestions(page, logCallback) {
        try {
            // Text Inputs: Fill 0 for "years" or "experience" if empty
            const labels = await page.$$('label');
            for (const label of labels) {
                const text = await page.evaluate(el => el.innerText, label).catch(() => "");
                const lower = text.toLowerCase();
                if (lower.includes('years') || lower.includes('experience')) {
                    const id = await page.evaluate(el => el.getAttribute('for'), label);
                    if (id) {
                        const input = await page.$(`#${id}`);
                        if (input) {
                            const val = await page.evaluate(el => el.value, input);
                            if (!val) {
                                await input.type('0', { delay: 50 });
                                Utils.log(`Auto-filled '0' for: ${text.substring(0, 20)}...`, logCallback);
                            }
                        }
                    }
                }
            }

            // Radio Buttons: Always select first option if none selected (Risky but automated)
            // ... can implement later if needed
        } catch (e) {
            console.error(e);
        }
    }

    async closeModal(page) {
        await page.keyboard.press('Escape');
        await Utils.delay(500);

        // "Discard" confirmation?
        const discardBtn = await page.$('button[data-control-name="discard_application_confirm_btn"]');
        if (discardBtn) await this.clickButton(page, discardBtn);
    }
}

module.exports = new JobApplierService();
