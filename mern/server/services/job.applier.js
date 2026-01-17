const Utils = require('./utils');
const DomHelper = require('./applier/dom.helper');
const ModalManager = require('./applier/modal.manager');

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
                await DomHelper.clickButton(page, applyBtn);
                await Utils.delay(2000);

                // 3. Handle Modal
                await ModalManager.handle(page, logCallback);
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

        // Strategy B: Visible Text Search via DomHelper
        return await DomHelper.findButtonByText(page, ["easy apply"]);
    }
}

module.exports = new JobApplierService();
