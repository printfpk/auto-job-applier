const Utils = require('../utils');
const ExceptionRules = require('./exception_rules');

class FormFiller {
    static async fill(page, logCallback) {
        try {
            // 1. INPUTS & TEXTAREAS
            const inputs = await page.$$('input[type="text"], input[type="number"], input[type="tel"], textarea');
            for (const input of inputs) {
                const id = await page.evaluate(el => el.id, input);
                if (!id) continue;

                const label = await page.$(`label[for="${id}"]`);
                if (label) {
                    const text = await page.evaluate(el => el.innerText, label).catch(() => "");
                    const lower = text.toLowerCase();
                    const val = await page.evaluate(el => el.value, input);

                    if (val) continue; // Skip if already filled

                    // Iterate over Input Rules
                    for (const rule of ExceptionRules.inputs) {
                        if (rule.keywords.some(k => lower.includes(k))) {
                            await input.type(rule.value, { delay: 50 });
                            Utils.log(`${rule.log} for: ${text.substring(0, 30)}...`, logCallback);
                            break; // Stop after first match
                        }
                    }
                }
            }

            // 2. DROPDOWNS (<select>)
            const selects = await page.$$('select');
            for (const select of selects) {
                const id = await page.evaluate(el => el.id, select);
                const label = await page.$(`label[for="${id}"]`);
                const text = label ? await page.evaluate(el => el.innerText, label).catch(() => "") : "";
                const lower = text.toLowerCase();

                const options = await page.evaluate(el => {
                    return Array.from(el.options).map(o => ({ text: o.text, val: o.value }));
                }, select);

                // Helper to select by text match
                const selectByText = async (keywords) => {
                    const opt = options.find(o => keywords.some(k => o.text.toLowerCase().includes(k)));
                    if (opt) {
                        await page.select(`select#${id}`, opt.val);
                        Utils.log(`Selected '${opt.text}' for ${text.substring(0, 30)}...`, logCallback);
                        return true;
                    }
                    return false;
                };

                // Iterate over Select Rules
                for (const rule of ExceptionRules.selects) {
                    if (rule.keywords.some(k => lower.includes(k))) {
                        await selectByText(rule.options);
                        // Don't break here necessarily, as some logic might overlap, but usually safe to break or continue
                    }
                }
            }

            // 3. RADIO BUTTONS (Fieldsets)
            // (Keeping the Universal 'Yes' Logic as it is simple and requested)
            const fieldsets = await page.$$('fieldset');
            for (const fieldset of fieldsets) {
                const legend = await fieldset.$('legend');
                const text = legend ? await page.evaluate(el => el.innerText, legend).catch(() => "") : "";

                // Universal Logic: Always select YES
                let yesRadio = await fieldset.$('label[data-test-text-selectable-option__label="Yes"]');

                if (!yesRadio) {
                    const labels = await fieldset.$$('label');
                    for (const l of labels) {
                        const t = await page.evaluate(el => el.innerText, l);
                        const tLower = t.trim().toLowerCase();
                        if (tLower.startsWith('yes')) {
                            yesRadio = l;
                            break;
                        }
                    }
                }

                if (yesRadio) {
                    await yesRadio.click();
                    Utils.log(`Clicked 'Yes' for: ${text.substring(0, 30)}...`, logCallback);
                }
            }

            // 4. CHECKBOXES
            const checkboxes = await page.$$('input[type="checkbox"]');
            for (const checkbox of checkboxes) {
                const isChecked = await page.evaluate(el => el.checked, checkbox);
                if (isChecked) continue;

                const id = await page.evaluate(el => el.id, checkbox);
                const label = id ? await page.$(`label[for="${id}"]`) : null;
                const text = label ? await page.evaluate(el => el.innerText, label).catch(() => "") : "";
                const lower = text.toLowerCase();

                // Iterate over Checkbox Rules
                for (const rule of ExceptionRules.checkboxes) {
                    if (rule.keywords.some(k => lower.includes(k))) {
                        await checkbox.click();
                        Utils.log(`${rule.log}: ${text.substring(0, 30)}...`, logCallback);
                        break;
                    }
                }
            }

        } catch (e) {
            // ignore
        }
    }
}
module.exports = FormFiller;
