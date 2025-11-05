const { test, expect } = require('@playwright/test');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Home Page Tests - Following SOLID principles:
 * - SRP: Each test focuses on single behavior
 * - DIP: Depends on TestFactory abstraction
 * - OCP: Extensible through configuration
 */
test.describe('Home Page Navigation Tests', () => {
    let homePage;
    let testFactory;

    test.beforeEach(async ({ page }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        homePage = testFactory.createHomePage(page);
        await homePage.navigate();
    });

    test('should display correct text in home navigation link', async () => {
        // Single responsibility: verify home link text
        await expect(homePage.navHomeLink).toHaveText('Home');
    });

    test('should navigate to home page successfully', async () => {
        // Single responsibility: verify navigation behavior
        await homePage.navigate();
        const currentUrl = await homePage.page.url();
        const configService = testFactory.getConfigService();
        const expectedBaseUrl = configService.get('baseURL');
        
        expect(currentUrl).toContain(expectedBaseUrl);
    });
});