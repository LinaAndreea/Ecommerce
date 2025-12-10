const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductListingPage } = require('../pages/ProductListingPage');
const { ComparePage } = require('../pages/ComparePage');
const { TestFactory } = require('../.github/factories/TestFactory');
const fs = require('fs');
const path = require('path');

/**
 * Compare Products Tests - Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through Page Objects
 */
test.describe('Compare Products Feature:', () => {

    let loginPage;
    let productListingPage;
    let comparePage;
    let testFactory;
    let configService;
    let baseUrl;

    // Test data - products selected for comparison
    let selectedProductNames = [];

    test.beforeEach(async ({ page }) => {
        // Initialize factory and services
        testFactory = new TestFactory();
        configService = testFactory.getConfigService();
        baseUrl = configService.get('baseURL');

        // Initialize Page Objects
        loginPage = new LoginPage(page, baseUrl);
        productListingPage = new ProductListingPage(page, baseUrl);
        comparePage = new ComparePage(page, baseUrl);

        // Reset selected products for each test
        selectedProductNames = [];
    });

    test.afterEach(async ({ page }) => {
        // Cleanup: Clear compare list after each test via direct navigation
        try {
            // Check if page is still usable before attempting cleanup
            if (page.isClosed()) {
                console.log('Cleanup: Page is already closed, skipping cleanup');
                return;
            }
            
            await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=product/compare', { timeout: 10000 });
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
            
            // Remove all products if any exist
            let removeLinks = await page.locator('#content table a[href*="remove"]').all();
            while (removeLinks.length > 0) {
                await removeLinks[0].click();
                await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
                await page.waitForTimeout(500);
                removeLinks = await page.locator('#content table a[href*="remove"]').all();
            }
        } catch (error) {
            console.log('Cleanup: Compare list cleanup skipped -', error.message);
        }
    });

    test('should display the same products that were selected for comparison', async ({ page }) => {
        // Load test user credentials
        const testUserPath = path.join(__dirname, 'test-user.json');
        const testUser = JSON.parse(fs.readFileSync(testUserPath, 'utf-8'));

        // Given I have logged in to the AUT
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, testUser.password);
        
        // Verify login was successful
        const isLoggedIn = await loginPage.isLoginSuccessful();
        expect(isLoggedIn).toBeTruthy();

        // And I have navigated to a product listing page
        await productListingPage.navigateToCategory('/index.php?route=product/category&path=18');
        
        // Verify products are displayed
        const productCount = await productListingPage.getProductCount();
        expect(productCount).toBeGreaterThanOrEqual(3);

        // And I have marked 3 products for compare
        const indicesToCompare = [0, 1, 2];
        selectedProductNames = await productListingPage.addMultipleProductsToCompare(indicesToCompare);
        
        console.log('Products added to compare:', selectedProductNames);
        expect(selectedProductNames.length).toBe(3);

        // When I navigate to the compare items page
        await comparePage.navigateToComparePage();

        // Then the application should display the compare page
        const isComparePageDisplayed = await comparePage.isComparePageDisplayed();
        expect(isComparePageDisplayed).toBeTruthy();

        // And the compare table should be visible
        const isTableVisible = await comparePage.isCompareTableVisible();
        expect(isTableVisible).toBeTruthy();

        // And the same products that I have selected should be displayed
        const comparedProductsCount = await comparePage.getComparedProductsCount();
        expect(comparedProductsCount).toBe(3);

        // Verify each selected product is in the compare list
        const verificationResult = await comparePage.verifyProductsInCompareList(selectedProductNames);
        
        console.log('Verification result:', verificationResult);
        console.log('Compared products:', await comparePage.getComparedProductNames());
        
        expect(verificationResult.allFound).toBeTruthy();
        expect(verificationResult.missingProducts).toHaveLength(0);
    });

});

