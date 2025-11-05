const { BasePage } = require('./BasePage');

/**
 * Home Page - Single Responsibility: Handle home page specific interactions
 * Follows LSP by properly extending BasePage
 */
class HomePage extends BasePage {
    constructor(page, configService) {
        super(page, configService);
        // Use configuration-based selector
        this.navHomeLink = this.getLocator('navbar.home');
    }

    async navigate() {
        await super.navigate('/');
    }

    async getHomeNavText() {
        return await this.navHomeLink.textContent();
    }
}

module.exports = { HomePage };