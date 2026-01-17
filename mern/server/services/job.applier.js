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

        // Wait for modal to appear
        const modalSelector = '.jobs-easy-apply-content, .jobs-easy-apply-modal';
        try {
            await page.waitForSelector(modalSelector, { timeout: 10000 });
        } catch {
            Utils.log("Easy Apply Modal did not appear in time.", logCallback);
            return;
        }

        let attempts = 0;
        const MAX_STEPS = 20;

        while (attempts < MAX_STEPS) {
            await Utils.delay(1000);

            // 1. Handle Questions (Inputs/Radios)
            await this.fillQuestions(page, logCallback);

            // 2. Identify Action Buttons
            const submitBtn = await this.findButtonByText(page, ["submit application", "submit"]);
            const nextBtn = await this.findButtonByText(page, ["continue to next step", "next"]);
            const reviewBtn = await this.findButtonByText(page, ["review your application", "review"]);

            if (submitBtn) {
                Utils.log("Found Submit button. Clicking...", logCallback);
                await this.clickButton(page, submitBtn);
                await Utils.delay(4000);
                // Check if success (modal closes or success msg)
                await page.keyboard.press('Escape');
                return;
            }

            if (nextBtn) {
                Utils.log("Found Next button. Clicking...", logCallback);
                await this.clickButton(page, nextBtn);

                await Utils.delay(1500);
                // Check for validation error
                const error = await page.$('.artdeco-inline-feedback--error');
                if (error) {
                    Utils.log("Validation error. Cannot proceed. closing...", logCallback);
                    await this.closeModal(page, logCallback);
                    return;
                }
                attempts++;
                continue;
            }

            if (reviewBtn) {
                Utils.log("Found Review button. Clicking...", logCallback);
                await this.clickButton(page, reviewBtn);
                attempts++;
                continue;
            }

            // If we are here, we might be stuck or done. 
            // Check if there's a "Done" button or similar?

            Utils.log(`No clear navigation buttons found (Attempt ${attempts}).`, logCallback);
            attempts++;
        }

        Utils.log("Max steps reached. Closing modal.", logCallback);
        await this.closeModal(page, logCallback);
    }

    async findButtonByText(page, texts) {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            // Check visibility first
            const isVisible = await page.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
            }, btn);
            if (!isVisible) continue;

            const inner = await page.evaluate(el => el.innerText, btn).catch(() => "");
            const lower = inner.toLowerCase().trim();
            if (texts.some(t => lower === t || lower.includes(t))) {
                return btn;
            }
        }
        return null;
    }

    async fillQuestions(page, logCallback) {
        try {
            // Text Inputs
            const inputs = await page.$$('input[type="text"], input[type="number"], textarea');
            for (const input of inputs) {
                const id = await page.evaluate(el => el.id, input);
                if (!id) continue;

                const label = await page.$(`label[for="${id}"]`);
                if (label) {
                    const text = await page.evaluate(el => el.innerText, label).catch(() => "");
                    const lower = text.toLowerCase();
                    if (lower.includes('years') || lower.includes('experience')) {
                        const val = await page.evaluate(el => el.value, input);
                        if (!val) {
                            await input.type('0', { delay: 50 });
                            Utils.log(`Auto-filled '0' for: ${text.substring(0, 30)}...`, logCallback);
                        }
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }

    async closeModal(page, logCallback) {
        Utils.log("Closing modal...", logCallback);
        await page.keyboard.press('Escape');
        await Utils.delay(1000);

        // Handle "Save this application?" dialog (Discard / Save)
        // We want to click "Discard"
        const discardBtn = await this.findButtonByText(page, ["discard"]);
        if (discardBtn) {
            Utils.log("Found Discard button. Clicking...", logCallback);
            await this.clickButton(page, discardBtn);
        }
    }
}

module.exports = new JobApplierService();
