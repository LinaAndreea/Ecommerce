class HomePage {
    constructor(page) {
        this.page = page;
        // target the navbar "Home" link using the full selector
        this.navHomeLink = page.locator('#widget-navbar-217834 > ul > li:nth-child(1) > a > div > span');
    }

    async navigate() {
        await this.page.goto('https://ecommerce-playground.lambdatest.io/');
        await this.page.waitForLoadState('domcontentloaded');
    }
}

module.exports = { HomePage };