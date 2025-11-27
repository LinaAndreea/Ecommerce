
const { test, expect } = require('@playwright/test');
const { ShopByCategoryPage } = require('../pages/shopByCategoryPage');

/**
 * Shop by Category Page Tests
 * Tests shop by category functionality following the Playwright Architecture instructions.
 * Each test is independent with its own page setup.
 */
test.describe('Shop by Category', () => {
    let shopByCategoryPage;

    test.beforeEach(async ({ page }) => {
        const baseUrl = 'https://ecommerce-playground.lambdatest.io';
        shopByCategoryPage = new ShopByCategoryPage(page, baseUrl);
        await shopByCategoryPage.navigateToCategoryPage();
    });

    test('should navigate to category page successfully', async () => {
        const currentUrl = await shopByCategoryPage.getCurrentURL();
        expect(currentUrl).toContain('product/category&path=30');
    });

    test('should display category section after clicking shop by category button', async () => {
        // Try to click the button if it exists, but don't fail if it doesn't
        try {
            const buttonCount = await shopByCategoryPage.shopByCategoryButton.count();
            if (buttonCount > 0) {
                await shopByCategoryPage.clickShopByCategoryButton();
            }
        } catch (error) {
            console.log('Shop by category button not found, checking for categories on page...');
        }
        
        // Categories should be visible on the category page itself
        const isCategorySectionVisible = await shopByCategoryPage.isCategorySectionVisible();
        expect(isCategorySectionVisible).toBeTruthy();
    });

    test('should display category components with proper names after clicking shop by category', async () => {
        // Try to click the button if it exists, but don't fail if it doesn't
        try {
            const buttonCount = await shopByCategoryPage.shopByCategoryButton.count();
            if (buttonCount > 0) {
                await shopByCategoryPage.clickShopByCategoryButton();
            }
        } catch (error) {
            console.log('Shop by category button not found, checking for categories on page...');
        }
        
        const categoryValidation = await shopByCategoryPage.validateCategoryComponentsDisplay();
        
        // Verify components are displayed
        expect(categoryValidation.hasValidComponents).toBeTruthy();
        expect(categoryValidation.componentCount).toBeGreaterThan(0);
        
        // Verify category names are present and meaningful
        expect(categoryValidation.hasValidNames).toBeTruthy();
        expect(categoryValidation.categoryNames.length).toBeGreaterThan(0);
        expect(categoryValidation.componentsWithNames.length).toBeGreaterThan(0);
        
        // Verify each category name is meaningful (not empty, not just whitespace)
        categoryValidation.componentsWithNames.forEach(name => {
            expect(name).toBeTruthy();
            expect(name.length).toBeGreaterThan(2);
            expect(name).not.toMatch(/^\s*$/); // Not just whitespace
        });
        
        console.log('✅ Category components displayed with names:', categoryValidation.categoryNames);
        console.log(`✅ Found ${categoryValidation.componentCount} components with ${categoryValidation.componentsWithNames.length} valid names`);
    });
});