const Utils = require('../utils');

class DomHelper {
    static async isVisible(page, element) {
        return await page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
        }, element);
    }

    static async findButtonByText(page, texts) {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            // Check visibility first
            const visible = await this.isVisible(page, btn);
            if (!visible) continue;

            const inner = await page.evaluate(el => el.innerText, btn).catch(() => "");
            const lower = inner.toLowerCase().trim();
            if (texts.some(t => lower === t || lower.includes(t))) {
                return btn;
            }
        }
        return null;
    }

    static async clickButton(page, element) {
        try {
            await element.click();
        } catch (e) {
            await page.evaluate(el => el.click(), element);
        }
    }
}

module.exports = DomHelper;
