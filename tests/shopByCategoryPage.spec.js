
const { test, expect } = require('@playwright/test');
const { TestFactory } = require('./factories/TestFactory');

/**
 * Shop by Category Page Tests - Following SOLID principles:
 * - SRP: Each test focuses on single behavior
 * - DIP: Depends on TestFactory abstraction
 * - OCP: Extensible through configuration
 */
test.describe('Shop by Category Page Tests', () => {
    let shopByCategoryPage;
    let testFactory;

    test.beforeEach(async ({ page }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        shopByCategoryPage = testFactory.createShopByCategoryPage(page);
    });

    test('should navigate to category page successfully', async () => {
        // Single responsibility: verify navigation
        await shopByCategoryPage.navigateToCategoryPage();
        
        const currentUrl = await shopByCategoryPage.getCurrentURL();
        expect(currentUrl).toContain('product/category&path=30');
    });

    test('should display category section after clicking shop by category button', async () => {
        // Arrange
        await shopByCategoryPage.navigateToCategoryPage();
        
        // Act - Single responsibility: button interaction
        await shopByCategoryPage.clickShopByCategoryButton();
        
        // Assert - Single responsibility: verification
        const isCategorySectionVisible = await shopByCategoryPage.isCategorySectionVisible();
        expect(isCategorySectionVisible).toBeTruthy();
    });

    test('should display category components with proper names after clicking shop by category', async () => {
        // Arrange - Single responsibility: page setup
        await shopByCategoryPage.navigateToCategoryPage();
        
        // Act - Single responsibility: trigger category display
        await shopByCategoryPage.clickShopByCategoryButton();
        
        // Assert - Single responsibility: validate category components and names
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