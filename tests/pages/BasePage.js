/**
 * Base Page - Single Responsibility: Common page functionality
 * Follows DIP by depending on page abstraction and configuration
 */
class BasePage {
    constructor(page, configService) {
        this.page = page;
        this.config = configService;
        this.baseURL = this.config.get('baseURL');
    }

    async navigate(path = '') {
        await this.page.goto(`${this.baseURL}${path}`);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async waitForSelector(selector, options = {}) {
        return await this.page.waitForSelector(selector, { state: 'visible', ...options });
    }

    getLocator(selectorPath) {
        const selector = this.config.get(`selectors.${selectorPath}`);
        return this.page.locator(selector);
    }
}

module.exports = { BasePage };
