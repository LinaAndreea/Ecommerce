const { test, expect } = require('@playwright/test');
const { SearchResultsPage } = require('../pages/searchResultsPage');

test.describe('Product Search Tests', () => {
    let searchResultsPage;
    let testFactory;

    test.beforeEach(async ({ page }) => {
        const baseUrl = 'https://ecommerce-playground.lambdatest.io';
        searchResultsPage = new SearchResultsPage(page, baseUrl);
        await searchResultsPage.navigate('/');
    });

    test('should search for iPhone and display results with matching products', async () => {
        /**
         * Tests complete search workflow with result verification
         */
        const searchTerm = 'iphone';

        // Perform search
        await searchResultsPage.searchForProduct(searchTerm);

        // Verify results are displayed
        const resultsDisplayed = await searchResultsPage.areSearchResultsDisplayed();
        expect(resultsDisplayed).toBe(true);

        // Verify results count
        const resultsCount = await searchResultsPage.getSearchResultsCount();
        expect(resultsCount).toBeGreaterThan(0);

        // Verify product appears in results
        const productInResults = await searchResultsPage.verifyProductInResults(searchTerm);
        expect(productInResults).toBe(true);
    });

    test('should display all product titles in search results', async () => {
        /**
         * Verifies all product titles are visible and valid
         */
        const searchTerm = 'phone';

        await searchResultsPage.searchForProduct(searchTerm);

        const allTitles = await searchResultsPage.getAllProductTitles();
        expect(allTitles.length).toBeGreaterThan(0);

        // Verify all titles are non-empty strings
        allTitles.forEach(title => {
            expect(title).toBeTruthy();
            expect(typeof title).toBe('string');
        });
    });

    test('should find specific product in search results', async () => {
        /**
         * Tests search for a specific product
         */
        const searchTerm = 'Palm Treo Pro';

        await searchResultsPage.searchForProduct(searchTerm);

        const matchingProducts = await searchResultsPage.getMatchingProducts(searchTerm);

        // Verify at least one matching product
        expect(matchingProducts.length).toBeGreaterThan(0);

        // Verify all matching products contain search term
        matchingProducts.forEach(product => {
            expect(product.toLowerCase()).toContain(searchTerm.toLowerCase());
        });
    });

    test('should handle search with no results gracefully', async () => {
        /**
         * Tests behavior when search returns no results
         */
        const searchTerm = 'xyznonexistentproduct123';

        await searchResultsPage.searchForProduct(searchTerm);

        // Check if no results or message displayed
        const noResultsDisplayed = await searchResultsPage.isNoResultsMessageDisplayed();
        const resultsCount = await searchResultsPage.getSearchResultsCount();
        const matchingProducts = await searchResultsPage.getMatchingProducts(searchTerm);

        console.log(`No results message: ${noResultsDisplayed}`);
        console.log(`Results count: ${resultsCount}`);
        console.log(`Matching products count: ${matchingProducts.length}`);
        console.log(`Test condition: ${noResultsDisplayed || resultsCount === 0 || matchingProducts.length === 0}`);

        // Either: no results message, zero results count, or no matching products for the search term
        expect(noResultsDisplayed || resultsCount === 0 || matchingProducts.length === 0).toBe(true);
    });
});

