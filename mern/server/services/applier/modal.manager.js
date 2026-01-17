const Utils = require('../utils');
const DomHelper = require('./dom.helper');
const FormFiller = require('./form.filler');

class ModalManager {
    static async handle(page, logCallback) {
        Utils.log("Handling Application Modal...", logCallback);

        const modalSelector = '.jobs-easy-apply-content, .jobs-easy-apply-modal';
        try {
            await page.waitForSelector(modalSelector, { timeout: 10000 });
        } catch {
            Utils.log("Easy Apply Modal did not appear in time.", logCallback);
            return;
        }

        let attempts = 0;
        const MAX_STEPS = 20;

        try {
            while (attempts < MAX_STEPS) {
                await Utils.delay(1000);

                // SAFETY CHECK: Discard Dialog
                const discardBtn = await DomHelper.findButtonByText(page, ["discard"]);
                if (discardBtn) {
                    Utils.log("Found Discard button (Save App Dialog). Clicking to abort...", logCallback);
                    await DomHelper.clickButton(page, discardBtn);
                    await Utils.delay(2000);
                    return;
                }

                // 1. Fill Questions
                await FormFiller.fill(page, logCallback);

                // 2. Navigation Buttons
                // Priority: Submit > Review > Next
                const submitBtn = await DomHelper.findButtonByText(page, ["submit application", "submit"]);
                const reviewBtn = await DomHelper.findButtonByText(page, ["review your application", "review"]);
                const nextBtn = await DomHelper.findButtonByText(page, ["continue to next step", "next"]);

                if (submitBtn) {
                    Utils.log("Found Submit button. Clicking...", logCallback);
                    await DomHelper.clickButton(page, submitBtn);
                    await Utils.delay(4000);
                    await page.keyboard.press('Escape');
                    return;
                }

                if (reviewBtn) {
                    Utils.log("Found Review button. Clicking...", logCallback);
                    await DomHelper.clickButton(page, reviewBtn);
                    await Utils.delay(2000);
                    attempts++;
                    continue;
                }

                if (nextBtn) {
                    Utils.log("Found Next button. Clicking...", logCallback);
                    await DomHelper.clickButton(page, nextBtn);
                    await Utils.delay(2000);

                    const error = await page.$('.artdeco-inline-feedback--error');
                    if (error) {
                        Utils.log("Validation error. Cannot proceed. closing...", logCallback);
                        return; // proceed to finally
                    }
                    attempts++;
                    continue;
                }

                // Debugging for stuck state
                Utils.log(`No clear navigation buttons found (Attempt ${attempts}).`, logCallback);
                attempts++;
            }
            Utils.log("Max steps reached.", logCallback);
        } catch (e) {
            Utils.log(`Error inside modal loop: ${e.message}`, logCallback);
        } finally {
            await this.close(page, logCallback);
        }
    }

    static async close(page, logCallback) {
        Utils.log("Closing modal...", logCallback);
        await page.keyboard.press('Escape');
        await Utils.delay(1000);

        // Try Dismiss icon
        try {
            const dismissBtn = await page.$('button[aria-label="Dismiss"]');
            if (dismissBtn) {
                await DomHelper.clickButton(page, dismissBtn);
                await Utils.delay(1000);
            }
        } catch (e) { }

        // Try Discard button
        const discardBtn = await DomHelper.findButtonByText(page, ["discard"]);
        if (discardBtn) {
            Utils.log("Found Discard button. Clicking...", logCallback);
            await DomHelper.clickButton(page, discardBtn);
        }
    }
}

module.exports = ModalManager;
