/**
 * Base Page - Foundation class providing common methods
 * Handles navigation, waiting, visibility checks
 * Follows SOLID principles and Page Object Model
 */
class BasePage {
    constructor(page, baseUrl = process.env.BASE_URL || 'http://localhost') {
        this.page = page;
        this.baseUrl = baseUrl;
    }

    /**
     * Navigates to a specific URL path
     * @param {string} path - URL path to navigate to
     * @returns {Promise<void>}
     */
    async navigate(path = '') {
        const fullUrl = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        await this.page.goto(fullUrl);
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Waits for an element to be in a specific state
     * @param {Locator} locator - The element locator
     * @param {string} state - The state to wait for ('visible', 'hidden', 'attached', 'detached')
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<void>}
     */
    async waitForElement(locator, state = 'visible', timeout = 5000) {
        await locator.waitFor({ state, timeout });
    }

    /**
     * Gets the text content of an element
     * @param {Locator} locator - The element locator
     * @returns {Promise<string>} The text content
     */
    async getText(locator) {
        return await locator.textContent();
    }

    /**
     * Scrolls element into view if needed
     * @param {Locator} locator - The element locator
     * @returns {Promise<void>}
     */
    async scrollIntoViewIfNeeded(locator) {
        await locator.scrollIntoViewIfNeeded();
    }

    /**
     * Checks if element is visible
     * @param {Locator} locator - The element locator
     * @returns {Promise<boolean>} True if visible
     */
    async isVisible(locator) {
        return await locator.isVisible();
    }

    /**
     * Gets the count of elements matching locator
     * @param {Locator} locator - The element locator
     * @returns {Promise<number>} The count of elements
     */
    async getCount(locator) {
        return await locator.count();
    }
}

module.exports = { BasePage };
