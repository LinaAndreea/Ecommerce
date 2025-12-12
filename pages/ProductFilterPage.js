const { BasePage } = require('./BasePage');

/**
 * Product Filter Page - Handles all product filtering interactions
 * Encapsulates filter elements and provides methods for filter operations
 * @extends BasePage
 */
class ProductFilterPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Filter container
        this.filterContainer = page.locator('#mz-filter-0, #mz-filter-1').first();
        
        // Price range filters
        this.minPriceInput = page.locator('input[name="mz_fp[min]"]').first();
        this.maxPriceInput = page.locator('input[name="mz_fp[max]"]').first();
        this.priceSlider = page.locator('[data-role="rangeslider"]').first();
        
        // Manufacturer/Brand filters (checkboxes)
        this.manufacturerCheckboxes = page.locator('input[name="mz_fm"]');
        this.manufacturerLabels = page.locator('.mz-filter-group.manufacturer label');
        
        // Search filter
        this.searchInput = page.locator('input[name="mz_fq"]').first();
        
        // Category filter from main search page
        this.categoryDropdown = page.locator('select[name="category_id"]').first();
        
        // Results area
        this.productGrid = page.locator('.content-products').first();
        this.productItems = page.locator('.product-thumb, .product-item, .product-layout');
        this.noResultsMessage = page.locator('.content-products p').filter({ hasText: /no product|no results/i }).first();
        
        // Sort dropdown
        this.sortDropdown = page.locator('select').filter({ hasText: /sort|price/i }).first();
        
        // Search criteria section
        this.searchCriteriaInput = page.locator('input#input-search').first();
        this.searchButton = page.locator('button#button-search').first();
        this.descriptionCheckbox = page.locator('input#description').first();
    }

    /**
     * Navigates to the product search/filter page
     * @param {string} path - Optional path override
     * @returns {Promise<ProductFilterPage>}
     */
    async navigate(path = '/index.php?route=product/search') {
        await super.navigate(path);
        return this;
    }

    /**
     * Selects a category from dropdown
     * @param {string} categoryName - Category name to select
     * @returns {Promise<ProductFilterPage>}
     */
    async selectCategory(categoryName) {
        await this.waitForElement(this.categoryDropdown, 'visible', 5000);
        await this.categoryDropdown.selectOption({ label: categoryName });
        await this.page.waitForTimeout(1000); // Wait for filter to apply
        return this;
    }

    /**
     * Sets price range filter using input fields
     * @param {string|number} minPrice - Minimum price
     * @param {string|number} maxPrice - Maximum price
     * @returns {Promise<ProductFilterPage>}
     */
    async setPriceRange(minPrice, maxPrice) {
        if (minPrice) {
            await this.minPriceInput.fill(minPrice.toString());
            await this.minPriceInput.dispatchEvent('change');
        }
        if (maxPrice) {
            await this.maxPriceInput.fill(maxPrice.toString());
            await this.maxPriceInput.dispatchEvent('change');
        }
        await this.page.waitForTimeout(1500); // Wait for AJAX filter to apply
        return this;
    }

    /**
     * Selects manufacturer/brand by checking the checkbox
     * @param {string} brandName - Brand name to select (e.g., "Apple", "HTC", "Canon")
     * @returns {Promise<ProductFilterPage>}
     */
    async selectBrand(brandName) {
        try {
            // Wait for manufacturer filter group to be available
            const manufacturerGroup = this.page.locator('.mz-filter-group.manufacturer').first();
            await this.waitForElement(manufacturerGroup, 'visible', 10000);
            
            // Wait a bit for AJAX to populate filters
            await this.page.waitForTimeout(1000);
            
            // Find the label that contains the brand name
            const brandLabel = this.page.locator(`.mz-filter-group.manufacturer label:has-text("${brandName}")`).first();
            const labelCount = await brandLabel.count();
            
            if (labelCount === 0) {
                console.log(`⚠️ Brand "${brandName}" filter not found. Available filters might be filtered out.`);
                return this;
            }
            
            // Get the 'for' attribute from the label to find the checkbox ID
            const labelFor = await brandLabel.getAttribute('for');
            
            if (!labelFor) {
                console.log(`⚠️ Could not find checkbox ID for brand "${brandName}"`);
                return this;
            }
            
            const brandCheckbox = this.page.locator(`#${labelFor}`);
            
            // Scroll the filter panel to make checkbox visible
            const filterContent = this.page.locator('.mz-filter-group.manufacturer .mz-filter-group-content').first();
            await filterContent.evaluate((el, checkboxId) => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox && el) {
                    checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, labelFor);
            
            // Wait for scroll animation
            await this.page.waitForTimeout(500);
            
            // Try to check the checkbox using JavaScript if normal click fails
            try {
                await brandCheckbox.check({ timeout: 5000 });
            } catch (error) {
                console.log('Using JavaScript to check the checkbox');
                await brandCheckbox.evaluate(el => el.click());
            }
            
            await this.page.waitForTimeout(1500); // Wait for AJAX filter to apply
            
            console.log(`✅ Selected brand: ${brandName}`);
            
        } catch (error) {
            console.log(`⚠️ Could not select brand "${brandName}": ${error.message}`);
            // Don't throw error, just log it - brand might not be available for selected category
        }
        
        return this;
    }

    /**
     * Selects multiple brands
     * @param {Array<string>} brandNames - Array of brand names
     * @returns {Promise<ProductFilterPage>}
     */
    async selectMultipleBrands(brandNames) {
        for (const brandName of brandNames) {
            await this.selectBrand(brandName);
        }
        return this;
    }

    /**
     * Performs search using the search criteria input
     * @param {string} searchTerm - Search term
     * @returns {Promise<ProductFilterPage>}
     */
    async searchProduct(searchTerm) {
        await this.searchCriteriaInput.fill(searchTerm);
        await this.searchButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        return this;
    }

    /**
     * Enables search in product descriptions
     * @returns {Promise<ProductFilterPage>}
     */
    async enableDescriptionSearch() {
        if (!(await this.descriptionCheckbox.isChecked())) {
            await this.descriptionCheckbox.check();
        }
        return this;
    }

    /**
     * Applies multiple filters in combination
     * @param {Object} filters - Filter configuration object
     * @param {string} filters.category - Category to filter by
     * @param {string} filters.minPrice - Minimum price
     * @param {string} filters.maxPrice - Maximum price
     * @param {string|Array<string>} filters.brands - Brand(s) to filter by
     * @param {string} filters.search - Search term
     * @param {boolean} filters.searchInDescription - Search in descriptions
     * @returns {Promise<ProductFilterPage>}
     */
    async applyFilters(filters) {
        // Check if we need to navigate to search page first
        const needsSearchPage = filters.category || filters.search;
        
        if (needsSearchPage) {
            // Check if search button exists (means we're on the initial search page)
            const searchButtonExists = await this.searchButton.count() > 0;
            
            if (searchButtonExists) {
                // We're on initial search page, can use the search form
                if (filters.category) {
                    await this.selectCategory(filters.category);
                }
                
                if (filters.search) {
                    await this.searchCriteriaInput.fill(filters.search);
                }
                
                if (filters.searchInDescription) {
                    await this.enableDescriptionSearch();
                }
                
                // Click search button to navigate to results
                await this.searchButton.click();
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            } else {
                // Already on results page, navigate directly with URL parameters
                let searchUrl = '/index.php?route=product/search';
                const params = new URLSearchParams();
                
                if (filters.search) {
                    params.append('search', filters.search);
                }
                
                if (filters.category) {
                    // Map category names to IDs (based on HTML structure)
                    const categoryMap = {
                        'Components': '25',
                        'Cameras': '33',
                        'Laptops': '18',
                        'Tablets': '57',
                        'Software': '17',
                        'Desktops': '20',
                        'Phones & PDAs': '24',
                        'MP3 Players': '34'
                    };
                    const categoryId = categoryMap[filters.category] || '0';
                    params.append('category_id', categoryId);
                }
                
                if (filters.searchInDescription) {
                    params.append('description', 'true');
                }
                
                if (params.toString()) {
                    searchUrl += '&' + params.toString();
                }
                
                await this.navigate(searchUrl);
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            }
            
            // Wait for filter panel to load after navigation
            await this.page.waitForTimeout(2000);
        }
        
        // Apply price filters (these work via AJAX on results page)
        if (filters.minPrice || filters.maxPrice) {
            await this.setPriceRange(filters.minPrice, filters.maxPrice);
        }
        
        // Apply brand filters (these work via AJAX on results page)
        if (filters.brands) {
            const brands = Array.isArray(filters.brands) ? filters.brands : [filters.brands];
            await this.selectMultipleBrands(brands);
        }
        
        return this;
    }

    /**
     * Gets count of filtered products
     * @returns {Promise<number>}
     */
    async getProductCount() {
        try {
            await this.waitForElement(this.productGrid, 'visible', 5000);
            const count = await this.getCount(this.productItems);
            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Verifies products are displayed
     * @returns {Promise<boolean>}
     */
    async hasProducts() {
        const count = await this.getProductCount();
        return count > 0;
    }

    /**
     * Gets all product names from results
     * @returns {Promise<Array<string>>}
     */
    async getProductNames() {
        const names = [];
        try {
            await this.waitForElement(this.productItems.first(), 'visible', 5000);
            const count = await this.getProductCount();
            
            for (let i = 0; i < count && i < 20; i++) { // Limit to first 20 for performance
                const productName = this.productItems.nth(i).locator('h4, .product-name, .caption h4, [class*="title"]').first();
                const name = await this.getText(productName);
                if (name) {
                    names.push(name.trim());
                }
            }
        } catch (error) {
            console.log('Error getting product names:', error.message);
        }
        
        return names;
    }

    /**
     * Verifies no results message is displayed
     * @returns {Promise<boolean>}
     */
    async hasNoResults() {
        try {
            return await this.isVisible(this.noResultsMessage);
        } catch (error) {
            return false;
        }
    }
}

module.exports = { ProductFilterPage };
