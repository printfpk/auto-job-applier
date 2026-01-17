const Utils = require('../utils');

class FormFiller {
    static async fill(page, logCallback) {
        try {
            const inputs = await page.$$('input[type="text"], input[type="number"], textarea');
            for (const input of inputs) {
                const id = await page.evaluate(el => el.id, input);
                if (!id) continue;

                const label = await page.$(`label[for="${id}"]`);
                if (label) {
                    const text = await page.evaluate(el => el.innerText, label).catch(() => "");
                    const lower = text.toLowerCase();

                    // Logic to fill common fields
                    if (lower.includes('years') || lower.includes('experience') || lower.includes('months')) {
                        const val = await page.evaluate(el => el.value, input);
                        if (!val) {
                            await input.type('1', { delay: 50 });
                            Utils.log(`Auto-filled '1' for: ${text.substring(0, 30)}...`, logCallback);
                        }
                    }
                    else if (lower.includes('ctc') || lower.includes('salary') || lower.includes('pay') || lower.includes('expectations')) {
                        const val = await page.evaluate(el => el.value, input);
                        if (!val) {
                            await input.type('0', { delay: 50 });
                            Utils.log(`Auto-filled '0' for: ${text.substring(0, 30)}...`, logCallback);
                        }
                    }
                    else if (lower.includes('notice') || lower.includes('period') || lower.includes('soon')) {
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
}

module.exports = FormFiller;
