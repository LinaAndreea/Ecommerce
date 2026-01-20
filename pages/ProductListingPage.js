const { BasePage } = require('./BasePage');

/**
 * Product Listing Page - Handles product browsing and compare functionality
 * Follows Single Responsibility Principle: Only manages product listing interactions
 * @extends BasePage
 */
class ProductListingPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Product card locators - Following selector priority
        this.productCards = page.locator('.product-thumb');
        this.productTitles = page.locator('.product-thumb h4 a');
        
        // Compare button locators - Using class btn-compare
        this.compareButtons = page.locator('button.btn-compare, button[onclick*="compare.add"]');
        
        // Wishlist button locators - Following selector priority
        this.wishlistButtons = page.locator('button.btn-wishlist, button[onclick*="wishlist.add"]');
        
        // Success notification locators
        this.successAlert = page.locator('.alert-success');
        this.compareLink = page.locator('a[href*="product/compare"]');
        
        // Compare total indicator in header
        this.compareTotal = page.locator('#compare-total, a[href*="product/compare"]');
    }

    /**
     * Navigates to a category page to view products
     * @param {string} categoryPath - Category path (default: all products category)
     * @returns {Promise<ProductListingPage>}
     */
    async navigateToCategory(categoryPath = '/index.php?route=product/category&path=18') {
        await this.navigate(categoryPath);
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            await this.page.waitForLoadState('load', { timeout: 5000 });
            await this.page.waitForTimeout(1000);
        }
        await this.waitForProductsToLoad();
        return this;
    }

    /**
     * Waits for products to load on the page
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<ProductListingPage>}
     */
    async waitForProductsToLoad(timeout = 10000) {
        try {
            await this.productCards.first().waitFor({ state: 'visible', timeout });
        } catch (error) {
            console.log('Products may not be visible yet, continuing...');
        }
        return this;
    }

    /**
     * Gets the count of visible products
     * @returns {Promise<number>}
     */
    async getProductCount() {
        return await this.productCards.count();
    }

    /**
     * Gets all visible product names
     * @returns {Promise<Array<string>>}
     */
    async getAllProductNames() {
        const names = [];
        const count = await this.productTitles.count();
        
        for (let i = 0; i < count; i++) {
            const title = await this.productTitles.nth(i).textContent();
            if (title && title.trim()) {
                names.push(title.trim());
            }
        }
        return names;
    }

    /**
     * Gets the product name at a specific index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<string>}
     */
    async getProductNameAtIndex(index) {
        const titleElement = this.productTitles.nth(index);
        await this.waitForElement(titleElement, 'visible', 5000);
        const name = await titleElement.textContent();
        return name ? name.trim() : '';
    }

    /**
     * Adds a product to compare by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<ProductListingPage>}
     */
    async addProductToCompareByIndex(index) {
        const productCard = this.productCards.nth(index);
        await this.scrollIntoViewIfNeeded(productCard);
        
        // Hover to reveal action buttons
        await productCard.hover();
        await this.page.waitForTimeout(300);
        
        // Find compare button within this product card
        const compareButton = productCard.locator('button[onclick*="compare.add"]').first();
        
        // Try clicking the button - use force click to bypass actionability checks
        try {
            await compareButton.waitFor({ state: 'visible', timeout: 3000 });
            await compareButton.click({ force: true, timeout: 3000 });
            console.log(`Product ${index} clicked for compare`);
        } catch (error) {
            console.log(`Force click failed for product ${index}, trying JavaScript click...`);
            
            // Fallback: Execute the compare function directly via JavaScript
            // Get the product ID from the button's onclick attribute and call compare.add directly
            const productId = await productCard.evaluate((card) => {
                const btn = card.querySelector('button[onclick*="compare.add"]');
                if (btn) {
                    const onclick = btn.getAttribute('onclick');
                    const match = onclick.match(/compare\.add\('?(\d+)'?\)/);
                    return match ? match[1] : null;
                }
                return null;
            });
            
            if (productId) {
                // Call the compare.add function directly without clicking
                await this.page.evaluate((id) => {
                    if (typeof compare !== 'undefined' && compare.add) {
                        compare.add(id);
                    }
                }, productId);
                console.log(`Product ${index} added via JavaScript with ID: ${productId}`);
            }
        }
        
        // Wait for the AJAX response to complete - use shorter timeout and fallback
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            await this.page.waitForTimeout(1000);
        }
        await this.page.waitForTimeout(500);
        return this;
    }

    /**
     * Adds multiple products to compare
     * @param {Array<number>} indices - Array of product indices to add
     * @returns {Promise<Array<string>>} Array of product names added to compare
     */
    async addMultipleProductsToCompare(indices) {
        const addedProducts = [];
        
        for (const index of indices) {
            const productName = await this.getProductNameAtIndex(index);
            await this.addProductToCompareByIndex(index);
            addedProducts.push(productName);
        }
        
        return addedProducts;
    }

    /**
     * Clicks the compare link in the success notification
     * @returns {Promise<ProductListingPage>}
     */
    async clickCompareLink() {
        await this.successAlert.waitFor({ state: 'visible', timeout: 5000 });
        const link = this.successAlert.locator('a[href*="product/compare"]');
        await link.click();
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            await this.page.waitForLoadState('load', { timeout: 5000 });
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Navigates to compare page via header link
     * @returns {Promise<ProductListingPage>}
     */
    async navigateToComparePage() {
        await this.compareTotal.click();
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            await this.page.waitForLoadState('load', { timeout: 5000 });
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Gets product locator by index for detailed interactions
     * @param {number} index - Product index
     * @returns {Locator}
     */
    getProductCardLocator(index) {
        return this.productCards.nth(index);
    }

    /**
     * Adds a product to cart by index from listing page
     * @param {number} index - Product index (0-based)
     * @returns {Promise<ProductListingPage>}
     */
    async addProductToCartByIndex(index) {
        const productCard = this.productCards.nth(index);
        await this.scrollIntoViewIfNeeded(productCard);
        
        // Hover to reveal action buttons
        await productCard.hover();
        await this.page.waitForTimeout(300);
        
        // Find add to cart button within this product card
        const addToCartButton = productCard.locator('button[onclick*="cart.add"], button:has-text("Add to Cart")').first();
        
        try {
            await addToCartButton.waitFor({ state: 'visible', timeout: 3000 });
            await addToCartButton.click({ force: true, timeout: 3000 });
            console.log(`Product ${index} added to cart`);
        } catch (error) {
            console.log(`Force click failed for product ${index}, trying JavaScript...`);
            
            // Fallback: Get product ID and call cart.add directly
            const productId = await productCard.evaluate((card) => {
                const btn = card.querySelector('button[onclick*="cart.add"]');
                if (btn) {
                    const onclick = btn.getAttribute('onclick');
                    const match = onclick.match(/cart\.add\('?(\d+)'?\)/);
                    return match ? match[1] : null;
                }
                return null;
            });
            
            if (productId) {
                await this.page.evaluate((id) => {
                    if (typeof cart !== 'undefined' && cart.add) {
                        cart.add(id);
                    }
                }, productId);
                console.log(`Product ${index} added via JavaScript with ID: ${productId}`);
            }
        }
        
        // Wait for AJAX - use shorter timeout and fallback
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            await this.page.waitForTimeout(1000);
        }
        await this.page.waitForTimeout(1000);
        return this;
    }

    /**
     * Adds multiple products to cart
     * @param {Array<number>} indices - Array of product indices
     * @returns {Promise<Array<string>>} Array of product names added
     */
    async addMultipleProductsToCart(indices) {
        const addedProducts = [];
        
        for (const index of indices) {
            const productName = await this.getProductNameAtIndex(index);
            await this.addProductToCartByIndex(index);
            addedProducts.push(productName);
        }
        
        return addedProducts;
    }

    /**
     * Adds a product to wishlist by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<ProductListingPage>}
     */
    async addProductToWishlistByIndex(index) {
        const productCard = this.productCards.nth(index);
        await this.scrollIntoViewIfNeeded(productCard);
        
        // Hover to reveal action buttons
        await productCard.hover();
        await this.page.waitForTimeout(300);
        
        // Find wishlist button within this product card
        const wishlistButton = productCard.locator('button[onclick*="wishlist.add"]').first();
        
        // Get product ID for JavaScript fallback
        const productId = await productCard.evaluate((card) => {
            const btn = card.querySelector('button[onclick*="wishlist.add"]');
            if (btn) {
                const onclick = btn.getAttribute('onclick');
                const match = onclick.match(/wishlist\.add\('?(\d+)'?\)/);
                return match ? match[1] : null;
            }
            return null;
        });
        
        // Try clicking the button
        try {
            await wishlistButton.waitFor({ state: 'visible', timeout: 3000 });
            await wishlistButton.click({ force: true, timeout: 3000 });
            console.log(`Product ${index} clicked for wishlist`);
        } catch (error) {
            console.log(`Force click failed for product ${index}, trying JavaScript click...`);
            
            if (productId) {
                // Call the wishlist.add function directly
                await this.page.evaluate((id) => {
                    if (typeof wishlist !== 'undefined' && wishlist.add) {
                        wishlist.add(id);
                    }
                }, productId);
                console.log(`Product ${index} added to wishlist via JavaScript with ID: ${productId}`);
            }
        }
        
        // Wait for success notification to appear
        try {
            await this.successAlert.waitFor({ state: 'visible', timeout: 5000 });
            const alertText = await this.successAlert.textContent();
            console.log(`Wishlist success alert: ${alertText}`);
            
            // Wait for alert to be processed
            await this.page.waitForTimeout(500);
        } catch (alertError) {
            console.log(`No success alert detected for product ${index}, continuing...`);
        }
        
        // Wait for the AJAX response to complete - use shorter timeout and fallback
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
            // Fallback: just wait a bit for the AJAX to complete
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Adds multiple products to wishlist
     * @param {Array<number>} indices - Array of product indices to add
     * @returns {Promise<Array<string>>} Array of product names added to wishlist
     */
    async addMultipleProductsToWishlist(indices) {
        const addedProducts = [];
        
        for (const index of indices) {
            const productName = await this.getProductNameAtIndex(index);
            await this.addProductToWishlistByIndex(index);
            addedProducts.push(productName);
        }
        
        return addedProducts;
    }
}

module.exports = { ProductListingPage };

