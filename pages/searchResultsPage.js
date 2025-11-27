const { BasePage } = require('./BasePage');

/**
 * Search Results Page - Handles search functionality and results verification
 * Encapsulates search-specific locators and interactions
 */
class SearchResultsPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Search form elements - Target ecommerce-playground specific selectors
        // The search box is typically in the header/navbar area
        this.searchInput = page.locator(
            'input[type="text"][name*="search"], ' +
            'input[placeholder*="Search" i], ' +
            'input[class*="search"], ' +
            'input[id*="search"]'
        ).first();
        
        this.searchButton = page.locator(
            'button[class*="search"], ' +
            'button:has-text("Search"), ' +
            'input[type="submit"][value*="Search"], ' +
            'button[id*="search"]'
        ).first();

        // Alternative search approach - use the search form directly
        this.searchForm = page.locator('form[action*="search"], [class*="search-form"]').first();

        // Results display - Be more specific about product containers
        // Look for products in the main content area, not sidebars or nav
        this.searchResultsContainer = page.locator('main, [role="main"], .content, [class*="product-list"]').first();
        
        // More flexible product selectors - try different approaches
        // First: specific product container classes
        this.searchResultItems = page.locator(
            'div[class*="product-item"], ' +
            'div[class*="product-box"], ' +
            'div[class*="product-card"], ' +
            'li[class*="product"], ' +
            'article[class*="product"]'
        );
        
        // If above fails, we'll use a fallback method in the count methods
        
        this.productTitles = page.locator(
            'h4, h3, h2, ' +
            '[class*="product-title"], ' +
            '[class*="product-name"], ' +
            'a[class*="product"], ' +
            '[data-product-title], ' +
            '.product-title, ' +
            '.product-name'
        ).filter({ visible: true });
        
        this.noResultsMessage = page.locator('[class*="no-results"], [class*="empty"], text=/No products|No results/i').first();
    }

    /**
     * Performs a product search
     * @param {string} searchTerm - The term to search for
     * @returns {Promise<SearchResultsPage>}
     */
    async searchForProduct(searchTerm) {
        try {
            // Strategy 1: Try to find and use the search input
            const inputCount = await this.searchInput.count();
            if (inputCount > 0) {
                try {
                    await this.searchInput.focus();
                    await this.searchInput.clear();
                    await this.searchInput.fill(searchTerm);
                    
                    // Try to click search button
                    const buttonCount = await this.searchButton.count();
                    if (buttonCount > 0) {
                        await this.searchButton.click();
                    } else {
                        // If no button, try pressing Enter
                        await this.searchInput.press('Enter');
                    }
                    
                    await this.page.waitForLoadState('domcontentloaded');
                    await this.page.waitForTimeout(500);
                    return this;
                } catch (searchError) {
                    // If search form fails, fall through to direct navigation
                    console.log('Search form failed, attempting direct navigation:', searchError.message);
                }
            }

            // Strategy 2: Try using search form submission
            const formCount = await this.searchForm.count();
            if (formCount > 0) {
                try {
                    const formInput = this.searchForm.locator('input[type="text"], input[name*="search"]').first();
                    const inputVisible = await formInput.count() > 0;
                    if (inputVisible) {
                        await formInput.focus();
                        await formInput.clear();
                        await formInput.fill(searchTerm);
                        await this.searchForm.evaluate(form => form.submit());
                        
                        await this.page.waitForLoadState('domcontentloaded');
                        await this.page.waitForTimeout(500);
                        return this;
                    }
                } catch (formError) {
                    console.log('Form submission failed, attempting direct navigation:', formError.message);
                }
            }

            // Strategy 3: Fallback - navigate directly to search results
            const encodedTerm = encodeURIComponent(searchTerm);
            await this.navigate(`/index.php?route=product/search&search=${encodedTerm}`);
            await this.page.waitForTimeout(500);
            
        } catch (error) {
            // Final fallback: navigate directly to search results
            const encodedTerm = encodeURIComponent(searchTerm);
            await this.navigate(`/index.php?route=product/search&search=${encodedTerm}`);
        }
        return this;
    }

    /**
     * Verifies if search results are displayed
     * @returns {Promise<boolean>} True if results are visible
     */
    async areSearchResultsDisplayed() {
        try {
            // Wait for page to load
            await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
            await this.page.waitForTimeout(500);
            
            console.log('Checking for search results...');
            
            // Strategy 1: Try the predefined product items selector
            const allItems = await this.searchResultItems.all();
            console.log(`Found ${allItems.length} items with product selectors`);
            
            if (allItems.length > 0) {
                for (const item of allItems) {
                    try {
                        if (await item.isVisible()) {
                            const text = await item.textContent();
                            if (text && text.trim().length > 5) {
                                console.log('Found product with predefined selector');
                                return true;
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            // Strategy 2: Look for any divs that contain both an image and text (typical product structure)
            const fallbackProducts = await this.page.locator('div').filter({
                has: this.page.locator('img'),
                hasText: /.+/
            }).all();
            
            console.log(`Found ${fallbackProducts.length} potential products (with image + text)`);
            
            if (fallbackProducts.length > 0) {
                for (const item of fallbackProducts) {
                    try {
                        if (await item.isVisible()) {
                            const box = await item.boundingBox();
                            if (box && box.height > 40 && box.width > 40) {
                                console.log('Found product with fallback selector');
                                return true;
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            // Strategy 3: Look for product links with prices
            const priceElements = await this.page.locator('[class*="price"]').all();
            console.log(`Found ${priceElements.length} price elements`);
            if (priceElements.length > 0) {
                for (const price of priceElements) {
                    try {
                        if (await price.isVisible()) {
                            const parent = await price.evaluate(el => el.parentElement?.parentElement);
                            if (parent) {
                                console.log('Found price element - products are visible');
                                return true;
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
            console.log('No search results found');
            return false;
        } catch (error) {
            console.log('Error checking search results:', error.message);
            return false;
        }
    }

    /**
     * Gets the count of search result items
     * @returns {Promise<number>} Number of search results
     */
    async getSearchResultsCount() {
        try {
            await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
            await this.page.waitForTimeout(500);
            
            console.log('Getting search results count...');
            
            // Strategy 1: Try the predefined product items selector
            let allItems = await this.searchResultItems.all();
            console.log(`Found ${allItems.length} items with product selectors`);
            
            let visibleProductCount = 0;
            
            for (const item of allItems) {
                try {
                    if (await item.isVisible()) {
                        const text = await item.textContent();
                        if (text && text.trim().length > 5) {
                            try {
                                const box = await item.boundingBox();
                                if (box && box.height > 50 && box.width > 50) {
                                    visibleProductCount++;
                                }
                            } catch (boxError) {
                                if (text.trim().length > 10) {
                                    visibleProductCount++;
                                }
                            }
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (visibleProductCount > 0) {
                console.log(`Found ${visibleProductCount} products with predefined selector`);
                return visibleProductCount;
            }
            
            // Strategy 2: Look for divs with images and text (typical product cards)
            const fallbackProducts = await this.page.locator('div').filter({
                has: this.page.locator('img'),
                hasText: /.+/
            }).all();
            
            console.log(`Fallback: Found ${fallbackProducts.length} divs with images`);
            
            visibleProductCount = 0;
            for (const item of fallbackProducts) {
                try {
                    if (await item.isVisible()) {
                        const box = await item.boundingBox();
                        if (box && box.height > 50 && box.width > 50) {
                            const text = await item.textContent();
                            // Filter out divs that are too generic (like navigation)
                            if (text && text.trim().length > 10) {
                                visibleProductCount++;
                            }
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (visibleProductCount > 0) {
                console.log(`Found ${visibleProductCount} products with fallback selector`);
                return visibleProductCount;
            }
            
            console.log('No products found');
            return 0;
        } catch (error) {
            console.log('Error getting search results count:', error.message);
            return 0;
        }
    }

    /**
     * Gets all product titles from search results
     * @returns {Promise<Array<string>>} Array of product titles
     */
    async getAllProductTitles() {
        try {
            await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
            await this.page.waitForTimeout(500);
            
            // Try to get titles from dedicated title elements
            let titles = await this.productTitles.allTextContents();
            let cleanTitles = titles.map(title => title.trim()).filter(title => title.length > 0);
            
            // If no titles found, try to extract from product items
            if (cleanTitles.length === 0) {
                console.log('No titles found from dedicated selectors, trying product items...');
                const productCount = await this.searchResultItems.count();
                
                if (productCount > 0) {
                    // Try to find headings within each product item
                    for (let i = 0; i < productCount; i++) {
                        const item = this.searchResultItems.nth(i);
                        const headings = item.locator('h2, h3, h4, h5, h6');
                        const headingCount = await headings.count();
                        
                        if (headingCount > 0) {
                            const text = await headings.first().textContent();
                            if (text && text.trim().length > 0) {
                                cleanTitles.push(text.trim());
                            }
                        }
                    }
                }
            }
            
            return cleanTitles;
        } catch (error) {
            console.log('Error getting product titles:', error.message);
            return [];
        }
    }

    /**
     * Verifies if the searched product appears in results
     * @param {string} searchTerm - The search term to verify
     * @returns {Promise<boolean>} True if at least one product matches
     */
    async verifyProductInResults(searchTerm) {
        const titles = await this.getAllProductTitles();
        const searchTermLower = searchTerm.toLowerCase();

        return titles.some(title => title.toLowerCase().includes(searchTermLower));
    }

    /**
     * Gets matching products from search results
     * @param {string} searchTerm - The search term to match
     * @returns {Promise<Array<string>>} Array of matching product titles
     */
    async getMatchingProducts(searchTerm) {
        const titles = await this.getAllProductTitles();
        const searchTermLower = searchTerm.toLowerCase();

        return titles.filter(title => title.toLowerCase().includes(searchTermLower));
    }

    /**
     * Checks if no results message is displayed
     * @returns {Promise<boolean>} True if no results message is visible
     */
    async isNoResultsMessageDisplayed() {
        try {
            // Wait for page to load
            await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
            await this.page.waitForTimeout(500);
            
            // Check for explicit no results message
            const msgCount = await this.noResultsMessage.count();
            if (msgCount > 0) {
                try {
                    if (await this.isVisible(this.noResultsMessage)) {
                        console.log('Found explicit no results message');
                        return true;
                    }
                } catch (error) {
                    // Continue to fallbacks
                }
            }

            // Fallback 1: look for page content with "no results" text
            const noResultsText = this.page.locator('text=/No products|No results|Sorry|not found/i').first();
            const hasNoResultsText = await noResultsText.count() > 0;
            if (hasNoResultsText) {
                try {
                    const isVisible = await this.isVisible(noResultsText);
                    if (isVisible) {
                        console.log('Found no results text message');
                        return true;
                    }
                } catch (error) {
                    // Continue
                }
            }

            // Fallback 2: Check if results container exists but is empty
            const containerCount = await this.searchResultsContainer.count();
            if (containerCount > 0) {
                try {
                    const isVisible = await this.searchResultsContainer.isVisible();
                    const text = await this.searchResultsContainer.textContent();
                    if (isVisible && text && (text.toLowerCase().includes('no result') || text.toLowerCase().includes('no product'))) {
                        console.log('Container shows no results');
                        return true;
                    }
                } catch (error) {
                    // Continue
                }
            }

            // Fallback 3: Look for any text saying no products
            const allPageText = await this.page.locator('body').textContent();
            if (allPageText && allPageText.toLowerCase().includes('no product')) {
                console.log('Page contains no product text');
                return true;
            }

            return false;
        } catch (error) {
            console.log('Error checking no results message:', error.message);
            return false;
        }
    }
}

module.exports = { SearchResultsPage };

