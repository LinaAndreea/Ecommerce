const { BasePage } = require('./BasePage');

/**
 * Wishlist Page - Handles all wishlist page interactions
 * Encapsulates page elements and provides methods for user interactions
 */
class WishlistPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Wishlist page elements - Following selector priority
        this.wishlistHeading = page.locator('h1, h2, h3').filter({ hasText: /wishlist|wish list/i }).first();
        this.wishlistTable = page.locator('table, [class*="wishlist"], [id*="wishlist"]').first();
        this.emptyWishlistMessage = page.locator('[class*="empty"], [class*="no-items"], p, div').filter({ hasText: /empty|no items|no products/i }).first();
        this.wishlistItems = page.locator('tr[class*="item"], [class*="wishlist-item"], tbody tr').filter({ hasText: /.+/ });
        this.continueButton = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
        this.removeButtons = page.locator('button:has-text("Remove"), a[class*="remove"], button[class*="remove"]');
        this.addToCartButtons = page.locator('button:has-text("Add to Cart"), button[class*="cart"]');
        
        // Product name locators within wishlist table
        this.wishlistProductRows = page.locator('#content table tbody tr');
        this.wishlistProductLinks = page.locator('#content table tbody tr td a[href*="product"]');
    }

    /**
     * Navigates to the wishlist page
     * @param {string} path - Optional path override (default: '/wishlist')
     * @returns {Promise<WishlistPage>}
     */
    async navigate(path = '/wishlist') {
        await super.navigate(path);
        return this;
    }

    /**
     * Checks if wishlist is empty
     * @returns {Promise<boolean>}
     */
    async isWishlistEmpty() {
        try {
            await this.waitForElement(this.emptyWishlistMessage, 'visible', 3000);
            return await this.isVisible(this.emptyWishlistMessage);
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets count of wishlist items
     * @returns {Promise<number>}
     */
    async getWishlistItemCount() {
        try {
            await this.waitForElement(this.wishlistTable, 'visible', 3000);
            return await this.getCount(this.wishlistItems);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Verifies wishlist heading is visible
     * @returns {Promise<boolean>}
     */
    async isWishlistHeadingVisible() {
        try {
            await this.waitForElement(this.wishlistHeading, 'visible', 5000);
            return await this.isVisible(this.wishlistHeading);
        } catch (error) {
            return false;
        }
    }

    /**
     * Removes product from wishlist by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<WishlistPage>}
     */
    async removeProduct(index = 0) {
        const removeButton = this.removeButtons.nth(index);
        await this.waitForElement(removeButton, 'visible', 5000);
        await removeButton.click();
        return this;
    }

    /**
     * Adds product to cart from wishlist by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<WishlistPage>}
     */
    async addProductToCart(index = 0) {
        const addToCartButton = this.addToCartButtons.nth(index);
        await this.waitForElement(addToCartButton, 'visible', 5000);
        await addToCartButton.click();
        return this;
    }

    /**
     * Gets empty wishlist message text
     * @returns {Promise<string>}
     */
    async getEmptyMessage() {
        await this.waitForElement(this.emptyWishlistMessage, 'visible', 5000);
        return await this.getText(this.emptyWishlistMessage);
    }

    /**
     * Gets all product names from the wishlist
     * @returns {Promise<Array<string>>}
     */
    async getWishlistProductNames() {
        const names = [];
        try {
            await this.waitForElement(this.wishlistTable, 'visible', 5000);
            const count = await this.wishlistProductLinks.count();
            
            for (let i = 0; i < count; i++) {
                const name = await this.wishlistProductLinks.nth(i).textContent();
                if (name && name.trim()) {
                    names.push(name.trim());
                }
            }
        } catch (error) {
            console.log('Error getting wishlist product names:', error.message);
        }
        return names;
    }

    /**
     * Verifies that specific products are in the wishlist
     * @param {Array<string>} expectedProducts - Array of product names to verify
     * @returns {Promise<{allFound: boolean, foundProducts: Array<string>, missingProducts: Array<string>}>}
     */
    async verifyProductsInWishlist(expectedProducts) {
        const wishlistProducts = await this.getWishlistProductNames();
        const foundProducts = [];
        const missingProducts = [];
        
        for (const expectedProduct of expectedProducts) {
            const found = wishlistProducts.some(
                wishlistProduct => wishlistProduct.toLowerCase().includes(expectedProduct.toLowerCase()) ||
                                   expectedProduct.toLowerCase().includes(wishlistProduct.toLowerCase())
            );
            
            if (found) {
                foundProducts.push(expectedProduct);
            } else {
                missingProducts.push(expectedProduct);
            }
        }
        
        return {
            allFound: missingProducts.length === 0,
            foundProducts,
            missingProducts
        };
    }
}

module.exports = { WishlistPage };
