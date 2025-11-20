const { BasePage } = require('./BasePage');

/**
 * Search Results Page - Single Responsibility: Handle search functionality and results verification
 * Follows LSP by properly extending BasePage
 */
class SearchResultsPage extends BasePage {
    constructor(page, configService) {
        super(page, configService);
        
        // Use configuration-based selectors
        this.searchInput = this.getLocator('search.input');
        this.searchButton = this.getLocator('search.button');
        this.searchResultsContainer = this.getLocator('search.resultsContainer');
        this.searchResultItems = this.getLocator('search.resultItems');
        this.productTitles = this.getLocator('search.productTitles');
        this.noResultsMessage = this.getLocator('search.noResultsMessage');
    }

    /**
     * Perform a search for a product
     * @param {string} searchTerm - The term to search for
     */
    async searchForProduct(searchTerm) {
        await this.searchInput.click();
        await this.searchInput.fill(searchTerm);
        await this.searchButton.click();
        // Wait for search results to load
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Verify if search results are displayed
     * @returns {boolean} True if results container is visible
     */
    async areSearchResultsDisplayed() {
        try {
            // Wait for page to load after search
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
            const count = await this.searchResultItems.count();
            return count > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the count of search result items
     * @returns {number} Number of search results
     */
    async getSearchResultsCount() {
        try {
            // Don't wait for selector if it might not exist (no results case)
            await this.page.waitForLoadState('networkidle', { timeout: 3000 });
            return await this.searchResultItems.count();
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get all product titles from search results
     * @returns {Array<string>} Array of product titles
     */
    async getAllProductTitles() {
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 3000 });
            const count = await this.productTitles.count();
            if (count === 0) return [];
            
            const titles = await this.productTitles.allTextContents();
            return titles.map(title => title.trim()).filter(title => title.length > 0);
        } catch (error) {
            return [];
        }
    }

    /**
     * Verify if the searched product appears in results
     * @param {string} searchTerm - The search term to verify
     * @returns {boolean} True if at least one product matches the search term
     */
    async verifyProductInResults(searchTerm) {
        const titles = await this.getAllProductTitles();
        const searchTermLower = searchTerm.toLowerCase();
        
        // Check if any product title contains the search term (case-insensitive)
        return titles.some(title => title.toLowerCase().includes(searchTermLower));
    }

    /**
     * Get matching products from search results
     * @param {string} searchTerm - The search term to match
     * @returns {Array<string>} Array of matching product titles
     */
    async getMatchingProducts(searchTerm) {
        const titles = await this.getAllProductTitles();
        const searchTermLower = searchTerm.toLowerCase();
        
        return titles.filter(title => title.toLowerCase().includes(searchTermLower));
    }

    /**
     * Verify if "no results" message is displayed
     * @returns {boolean} True if no results message is visible
     */
    async isNoResultsMessageDisplayed() {
        try {
            return await this.noResultsMessage.isVisible();
        } catch (error) {
            return false;
        }
    }
}

module.exports = { SearchResultsPage };

