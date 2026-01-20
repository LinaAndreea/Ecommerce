const { BasePage } = require('./BasePage');

/**
 * Special Offers Page - Handles special offers/sale page interactions
 * Follows Single Responsibility Principle: Only manages special offers functionality
 * @extends BasePage
 */
class SpecialOffersPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Page heading
        this.pageHeading = page.locator('h2, h1').filter({ hasText: /special|sale/i }).first();

        // Product listings - More comprehensive selectors
        this.productItems = page.locator('.product-layout, .product-thumb, [class*="product"]');
        this.productNames = page.locator(
            '.product-layout .caption h4 a, ' +
            '.product-thumb h4 a, ' +
            '.caption h4 a, ' +
            'h4 a[href*="product"], ' +
            '.product-name a, ' +
            '[class*="product"] h4 a'
        );
        this.productPrices = page.locator('.price');
        
        // Sale/Special ads/banners
        this.saleAd = page.locator('a[href*="special"], a:has-text("Sale"), .sale, .special-offer').first();
        this.specialBanner = page.locator('[class*="banner"], [class*="promo"]').filter({ hasText: /sale|special/i }).first();
        
        // Add to cart buttons
        this.addToCartButtons = page.locator('button:has-text("Add to Cart"), button[onclick*="cart.add"]');
    }

    /**
     * Navigates to the special offers page
     * @returns {Promise<SpecialOffersPage>}
     */
    async navigateToSpecials() {
        await this.navigate('/index.php?route=product/special');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Clicks on a sale ad or banner
     * @returns {Promise<SpecialOffersPage>}
     */
    async clickSaleAd() {
        try {
            // First try clicking the sale ad
            const adCount = await this.saleAd.count();
            if (adCount > 0 && await this.saleAd.isVisible()) {
                await this.saleAd.click();
                await this.page.waitForLoadState('networkidle');
            } else {
                // Try clicking special banner
                const bannerCount = await this.specialBanner.count();
                if (bannerCount > 0) {
                    await this.specialBanner.click();
                    await this.page.waitForLoadState('networkidle');
                }
            }
        } catch (error) {
            console.log('Sale ad click not needed, already on specials page');
        }
        return this;
    }

    /**
     * Gets locator for a product by name
     * @param {string} productName - Product name to search for
     * @returns {Locator}
     */
    getProductByName(productName) {
        return this.page.locator('.product-layout, .product-thumb, [class*="product-item"], .product').filter({ 
            has: this.page.locator(`a:has-text("${productName}")`)
        }).first();
    }

    /**
     * Adds a product to cart by name
     * @param {string} productName - Product name to add
     * @returns {Promise<SpecialOffersPage>}
     */
    async addProductToCart(productName) {
        const product = this.getProductByName(productName);
        
        try {
            await this.waitForElement(product, 'visible', 5000);
            await this.scrollIntoViewIfNeeded(product);
            
            // Find the add to cart button within this product
            const addButton = product.locator('button:has-text("Add to Cart"), button[onclick*="cart.add"]').first();
            await addButton.click();
            
            // Wait for the success notification
            await this.page.waitForTimeout(2000);
            await this.page.waitForLoadState('networkidle');
            
            console.log(`✅ Added "${productName}" to cart`);
        } catch (error) {
            console.log(`❌ Could not add "${productName}" to cart:`, error.message);
            throw error;
        }
        
        return this;
    }

    /**
     * Adds multiple products to cart by their names
     * @param {Array<string>} productNames - Array of product names to add
     * @returns {Promise<SpecialOffersPage>}
     */
    async addMultipleProductsToCart(productNames) {
        for (const productName of productNames) {
            await this.addProductToCart(productName);
        }
        return this;
    }

    /**
     * Verifies if a product exists on the page
     * @param {string} productName - Product name to verify
     * @returns {Promise<boolean>}
     */
    async isProductAvailable(productName) {
        const product = this.getProductByName(productName);
        try {
            const count = await product.count();
            if (count === 0) return false;
            return await product.isVisible();
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets all available product names
     * @returns {Promise<Array<string>>}
     */
    async getAllProductNames() {
        const names = [];
        try {
            // Wait for page to load products
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1000);
            
            // Try multiple selector strategies
            const productLinkSelectors = [
                '.product-layout .caption h4 a',
                '.product-thumb h4 a',
                '.caption h4 a',
                'h4 a[href*="product"]',
                '.product-name a',
                '[class*="product"] h4 a',
                '#content .product-thumb h4 a',
                '#content h4 a[href*="product"]'
            ];
            
            let foundProducts = null;
            
            for (const selector of productLinkSelectors) {
                const locator = this.page.locator(selector);
                const count = await locator.count();
                
                if (count > 0) {
                    console.log(`✅ Found ${count} products using selector: ${selector}`);
                    foundProducts = locator;
                    break;
                }
            }
            
            if (!foundProducts) {
                console.log('⚠️ No products found with any selector');
                return names;
            }
            
            const count = await foundProducts.count();
            for (let i = 0; i < count; i++) {
                const name = await foundProducts.nth(i).textContent();
                if (name && name.trim()) {
                    names.push(name.trim());
                }
            }
        } catch (error) {
            console.log('Could not get product names:', error.message);
        }
        return names;
    }
}

module.exports = { SpecialOffersPage };

