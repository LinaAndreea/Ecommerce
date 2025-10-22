const { test, expect } = require('@playwright/test');
const { HomePage } = require('./HomePage');

test.describe('Home Page Navbar Tests', () => {
    let homePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.navigate();
    });

    test('Verify that the "Home" link is displayed in the navbar.', async () => {
        await expect(homePage.navHomeLink).toHaveText('Home');
    });
});