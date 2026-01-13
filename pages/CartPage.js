const { BasePage } = require('./BasePage');

/**
 * Cart Page - Handles shopping cart interactions
 * Follows Single Responsibility Principle: Only manages cart functionality
 * @extends BasePage
 */
class CartPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Cart page elements
        this.pageHeading = page.locator('h1, h2').filter({ hasText: /shopping cart/i }).first();
        this.cartTable = page.locator('.table-responsive table, #content table').first();
        
        // Cart items
        this.cartItems = page.locator('.table-responsive tbody tr, #content table tbody tr');
        this.productNames = page.locator('.table-responsive td.text-left a, #content table td a[href*="product"]');
        this.productQuantities = page.locator('input[name^="quantity"]');
        
        // Empty cart message
        this.emptyCartMessage = page.locator('p').filter({ hasText: /shopping cart is empty|no products in your cart/i }).first();
        
        // Cart actions
        this.updateButton = page.locator('button[type="submit"]:has-text("Update"), button:has-text("Update")').first();
        this.continueShoppingButton = page.locator('a:has-text("Continue Shopping")').first();
        this.checkoutButton = page.locator('a:has-text("Checkout")').first();
        
        // Remove buttons - multiple possible selectors
        this.removeButtons = page.locator(
            'button[data-original-title="Remove"], ' +
            'button[title="Remove"], ' +
            'button.btn-danger, ' +
            'td button[onclick*="remove"], ' +
            'a[onclick*="cart.remove"], ' +
            'button:has(i.fa-times), ' +
            'button:has(i.fa-trash)'
        );
    }

    /**
     * Navigates to the shopping cart page
     * @returns {Promise<CartPage>}
     */
    async navigateToCart() {
        await this.navigate('/index.php?route=checkout/cart');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets the count of items in cart
     * @returns {Promise<number>}
     */
    async getCartItemCount() {
        try {
            await this.waitForElement(this.cartTable, 'visible', 5000);
            const count = await this.cartItems.count();
            // Subtract header row if present
            return count > 0 ? count - 1 : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Gets all product names from cart
     * @returns {Promise<Array<string>>}
     */
    async getCartProductNames() {
        const names = [];
        
        try {
            await this.waitForElement(this.cartTable, 'visible', 5000);
            const count = await this.productNames.count();
            
            for (let i = 0; i < count; i++) {
                const name = await this.productNames.nth(i).textContent();
                if (name && name.trim()) {
                    names.push(name.trim());
                }
            }
        } catch (error) {
            console.log('Could not get cart product names:', error.message);
        }
        
        return names;
    }

    /**
     * Verifies if cart is empty
     * @returns {Promise<boolean>}
     */
    async isCartEmpty() {
        try {
            const messageVisible = await this.isVisible(this.emptyCartMessage);
            if (messageVisible) {
                return true;
            }
            
            const itemCount = await this.getCartItemCount();
            return itemCount === 0;
        } catch (error) {
            return true;
        }
    }

    /**
     * Verifies if specific products are in cart
     * @param {Array<string>} expectedProducts - Array of product names to verify
     * @returns {Promise<{allFound: boolean, foundProducts: Array<string>, missingProducts: Array<string>}>}
     */
    async verifyProductsInCart(expectedProducts) {
        const cartProducts = await this.getCartProductNames();
        const foundProducts = [];
        const missingProducts = [];
        
        for (const expected of expectedProducts) {
            const normalizedExpected = expected.toLowerCase().trim();
            const found = cartProducts.some(name => 
                name.toLowerCase().includes(normalizedExpected) || 
                normalizedExpected.includes(name.toLowerCase())
            );
            
            if (found) {
                foundProducts.push(expected);
            } else {
                missingProducts.push(expected);
            }
        }
        
        return {
            allFound: missingProducts.length === 0,
            foundProducts,
            missingProducts
        };
    }

    /**
     * Removes a product from cart by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<CartPage>}
     */
    async removeProductByIndex(index) {
        const removeButton = this.removeButtons.nth(index);
        await removeButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Updates cart quantities
     * @returns {Promise<CartPage>}
     */
    async updateCart() {
        await this.updateButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Proceeds to checkout
     * @returns {Promise<CartPage>}
     */
    async proceedToCheckout() {
        try {
            // Try scrolling and clicking
            await this.scrollIntoViewIfNeeded(this.checkoutButton);
            await this.page.waitForTimeout(500);
            await this.checkoutButton.click({ timeout: 5000 });
        } catch (error) {
            // Fallback: Navigate directly to checkout
            console.log('Using fallback navigation to checkout');
            await this.navigate('/index.php?route=checkout/checkout');
        }
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Clears all items from the cart
     * @returns {Promise<CartPage>}
     */
    async clearCart() {
        await this.navigateToCart();
        
        try {
            // Check if cart is already empty
            const isEmpty = await this.isCartEmpty();
            if (isEmpty) {
                console.log('Cart is already empty');
                return this;
            }
            
            // Remove all items one by one
            let itemCount = await this.getCartItemCount();
            console.log(`Clearing ${itemCount} items from cart...`);
            
            let attempts = 0;
            const maxAttempts = 20;
            
            while (itemCount > 0 && attempts < maxAttempts) {
                attempts++;
                
                try {
                    // Find any remove button on the page
                    const removeButton = this.page.locator(
                        'button[data-original-title="Remove"], ' +
                        'button[title="Remove"], ' +
                        'button.btn-danger, ' +
                        'button:has(i.fa-times), ' +
                        'button:has(i.fa-trash), ' +
                        'a[onclick*="cart.remove"]'
                    ).first();
                    
                    const buttonCount = await removeButton.count();
                    if (buttonCount === 0) {
                        console.log('No remove button found, cart might be empty');
                        break;
                    }
                    
                    // Click the first remove button
                    await removeButton.waitFor({ state: 'visible', timeout: 3000 });
                    await removeButton.click();
                    await this.page.waitForLoadState('networkidle');
                    await this.page.waitForTimeout(500);
                    
                    // Check new count
                    itemCount = await this.getCartItemCount();
                } catch (error) {
                    console.log(`Attempt ${attempts}: Could not remove item -`, error.message);
                    break;
                }
            }
            
            const finalCount = await this.getCartItemCount();
            if (finalCount === 0) {
                console.log('✅ Cart cleared successfully');
            } else {
                console.log(`⚠️ Cart still has ${finalCount} items after cleanup`);
            }
        } catch (error) {
            console.log('Error clearing cart:', error.message);
        }
        
        return this;
    }
}

module.exports = { CartPage };
