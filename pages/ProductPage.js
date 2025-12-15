const { BasePage } = require('./BasePage');

/**
 * Product Page - Handles individual product page interactions
 * Follows Single Responsibility Principle: Only manages product page actions
 * @extends BasePage
 */
class ProductPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Product information locators
        this.productTitle = page.locator('h1, .product-title').first();
        this.productPrice = page.locator('.price-new, .product-price').first();
        
        // Add to cart section
        this.quantityInput = page.locator('input[name="quantity"]').first();
        this.addToCartButton = page.locator('button#button-cart, button:has-text("Add to Cart")').first();
        
        // Success notification
        this.successAlert = page.locator('.alert-success').first();
        this.cartLink = page.locator('a[href*="checkout/cart"]').first();
    }

    /**
     * Navigates to a specific product page
     * @param {string} productPath - Product URL path or ID
     * @returns {Promise<ProductPage>}
     */
    async navigateToProduct(productPath) {
        await this.navigate(productPath);
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets the product name
     * @returns {Promise<string>}
     */
    async getProductName() {
        await this.waitForElement(this.productTitle, 'visible', 5000);
        return await this.getText(this.productTitle);
    }

    /**
     * Sets product quantity
     * @param {number} quantity - Number of items
     * @returns {Promise<ProductPage>}
     */
    async setQuantity(quantity) {
        await this.quantityInput.fill(quantity.toString());
        return this;
    }

    /**
     * Adds product to cart
     * @param {number} quantity - Optional quantity (default: 1)
     * @returns {Promise<ProductPage>}
     */
    async addToCart(quantity = 1) {
        if (quantity > 1) {
            await this.setQuantity(quantity);
        }
        
        await this.addToCartButton.click();
        
        // Wait for success notification
        try {
            await this.waitForElement(this.successAlert, 'visible', 5000);
        } catch (error) {
            console.log('Success alert not visible, continuing...');
        }
        
        await this.page.waitForTimeout(1000);
        return this;
    }

    /**
     * Verifies success message is displayed
     * @returns {Promise<boolean>}
     */
    async isSuccessMessageDisplayed() {
        try {
            return await this.isVisible(this.successAlert);
        } catch (error) {
            return false;
        }
    }
}

module.exports = { ProductPage };
