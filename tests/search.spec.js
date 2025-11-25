const { test, expect } = require('@playwright/test');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Search Tests - Following SOLID principles:
 * - SRP: Each test focuses on single search behavior
 * - DIP: Depends on TestFactory abstraction
 * - OCP: Extensible through configuration
 */
test.describe('Product Search Tests', () => {
    let searchResultsPage;
    let testFactory;

    test.beforeEach(async ({ page }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        searchResultsPage = testFactory.createSearchResultsPage(page);
        await searchResultsPage.navigate('/');
    });

    test('should search for iPhone and display results with matching products', async () => {
        // Single responsibility: search functionality and result verification
        const searchTerm = 'iphone';
        
        // Perform the search
        await searchResultsPage.searchForProduct(searchTerm);
        
        // Verify search results are displayed
        const resultsDisplayed = await searchResultsPage.areSearchResultsDisplayed();
        expect(resultsDisplayed).toBe(true);
        
        // Verify search results count is greater than 0
        const resultsCount = await searchResultsPage.getSearchResultsCount();
        expect(resultsCount).toBeGreaterThan(0);
        
        // Verify the searched product appears in results
        const productInResults = await searchResultsPage.verifyProductInResults(searchTerm);
        expect(productInResults).toBe(true);
        
        // Get matching products for logging
        const matchingProducts = await searchResultsPage.getMatchingProducts(searchTerm);
        console.log(`Found ${matchingProducts.length} products matching "${searchTerm}":`, matchingProducts);
    });

    test('should display all product titles in search results', async () => {
        // Single responsibility: verify all product titles are visible
        const searchTerm = 'phone';
        
        await searchResultsPage.searchForProduct(searchTerm);
        
        const allTitles = await searchResultsPage.getAllProductTitles();
        expect(allTitles.length).toBeGreaterThan(0);
        
        // Verify all titles are non-empty strings
        allTitles.forEach(title => {
            expect(title).toBeTruthy();
            expect(typeof title).toBe('string');
        });
        
        console.log(`Search for "${searchTerm}" returned ${allTitles.length} products`);
    });

    test('should find specific product - iPhone in search results', async () => {
        // Single responsibility: verify specific product search
        const searchTerm = 'Palm Treo Pro';
        
        await searchResultsPage.searchForProduct(searchTerm);
        
        // Get all matching products
        const matchingProducts = await searchResultsPage.getMatchingProducts(searchTerm);
        
        // Verify at least one matching product
        expect(matchingProducts.length).toBeGreaterThan(0);
        
        // Verify all matching products contain the search term
        matchingProducts.forEach(product => {
            expect(product.toLowerCase()).toContain(searchTerm.toLowerCase());
        });
    });

    test('should handle search with no results gracefully', async () => {
        // Single responsibility: verify no results scenario
        const searchTerm = 'xyznonexistentproduct123';
        
        await searchResultsPage.searchForProduct(searchTerm);
        
        // Check if no results message is displayed or results count is 0
        const noResultsDisplayed = await searchResultsPage.isNoResultsMessageDisplayed();
        const resultsCount = await searchResultsPage.getSearchResultsCount();
        
        // Either no results message should be shown or count should be 0
        expect(noResultsDisplayed || resultsCount === 0).toBe(true);
    });
});

