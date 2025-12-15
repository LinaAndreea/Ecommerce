const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductListingPage } = require('../pages/ProductListingPage');
const { WishlistPage } = require('../pages/WishlistPage');
const { MyAccountPage } = require('../pages/MyAccountPage');
const { TestFactory } = require('../.github/factories/TestFactory');
const fs = require('fs');
const path = require('path');

/**
 * Wishlist Persistence Tests - Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through Page Objects
 */
test.describe('Wishlist Persistence Feature:', () => {

    let loginPage;
    let productListingPage;
    let wishlistPage;
    let myAccountPage;
    let testFactory;
    let configService;
    let baseUrl;

    // Test data - products selected for wishlist
    let selectedProductNames = [];

    test.beforeEach(async ({ page }) => {
        // Initialize factory and services
        testFactory = new TestFactory();
        configService = testFactory.getConfigService();
        baseUrl = configService.get('baseURL');

        // Initialize Page Objects
        loginPage = new LoginPage(page, baseUrl);
        productListingPage = new ProductListingPage(page, baseUrl);
        wishlistPage = new WishlistPage(page, baseUrl);
        myAccountPage = new MyAccountPage(page, baseUrl);

        // Reset selected products for each test
        selectedProductNames = [];
    });

    test.afterEach(async ({ page }) => {
        // Cleanup: Clear wishlist after each test
        try {
            // Check if page is still usable before attempting cleanup
            if (page.isClosed()) {
                console.log('Cleanup: Page is already closed, skipping cleanup');
                return;
            }
            
            await page.goto(`${baseUrl}/index.php?route=account/wishlist`, { timeout: 10000 });
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
            console.log('Cleanup: Wishlist cleanup skipped -', error.message);
        }
    });

    test('should persist wishlist items after re-login', async ({ page }) => {
        // Load test user credentials
        const testUserPath = path.join(__dirname, 'test-user.json');
        const testUser = JSON.parse(fs.readFileSync(testUserPath, 'utf-8'));

        // Given I have logged in to the AUT
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, testUser.password);
        
        // Verify login was successful
        const isLoggedIn = await loginPage.isLoginSuccessful();
        expect(isLoggedIn).toBeTruthy();
        console.log('Initial login successful');

        // And I have navigated to the products offered for purchase
        await productListingPage.navigateToCategory('/index.php?route=product/category&path=18');
        
        // Verify products are displayed
        const productCount = await productListingPage.getProductCount();
        expect(productCount).toBeGreaterThanOrEqual(3);
        console.log(`Found ${productCount} products on page`);

        // And I have selected a few items (minimum 3) to my wishlist
        const indicesToAdd = [0, 1, 2];
        selectedProductNames = await productListingPage.addMultipleProductsToWishlist(indicesToAdd);
        
        console.log('Products added to wishlist:', selectedProductNames);
        expect(selectedProductNames.length).toBe(3);

        // Verify products are in wishlist BEFORE logout
        await wishlistPage.navigate('/index.php?route=account/wishlist');
        await page.waitForLoadState('networkidle');
        
        const wishlistBeforeLogout = await wishlistPage.getWishlistProductNames();
        console.log('Wishlist products BEFORE logout:', wishlistBeforeLogout);
        expect(wishlistBeforeLogout.length).toBeGreaterThanOrEqual(3);

        // And I relog (logout and login again)
        await myAccountPage.logout();
        
        // Verify logout was successful
        const isLogoutSuccessful = await myAccountPage.isLogoutSuccessful();
        expect(isLogoutSuccessful).toBeTruthy();
        console.log('Logout successful');

        // Login again with same credentials
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, testUser.password);
        
        // Verify second login was successful
        const isReloggedIn = await loginPage.isLoginSuccessful();
        expect(isReloggedIn).toBeTruthy();
        console.log('Re-login successful');

        // When I navigate to the wishlist page
        await wishlistPage.navigate('/index.php?route=account/wishlist');
        await page.waitForLoadState('networkidle');
        
        // Wait for the wishlist table to be visible
        await page.waitForTimeout(1000);

        // Then the wishlist should be filled in with the items selected before the relog
        const wishlistProducts = await wishlistPage.getWishlistProductNames();
        console.log('Wishlist products after re-login:', wishlistProducts);
        
        const wishlistItemCount = wishlistProducts.length;
        console.log(`Wishlist contains ${wishlistItemCount} items`);
        
        // Verify we have at least 3 products (the ones we added)
        expect(wishlistItemCount).toBeGreaterThanOrEqual(3);

        // Verify each selected product is in the wishlist
        const verificationResult = await wishlistPage.verifyProductsInWishlist(selectedProductNames);
        
        console.log('Verification result:', verificationResult);
        
        expect(verificationResult.allFound).toBeTruthy();
        expect(verificationResult.missingProducts).toHaveLength(0);
    });

});
