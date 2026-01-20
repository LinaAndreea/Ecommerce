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
        
        // Cart actions - Update button has icon, not text!
        this.updateButton = page.locator('button[type="submit"][data-original-title="Update"], button[data-original-title="Update"], button.btn-primary:has(i.fa-sync-alt)').first();
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

    /**
     * Gets locator for a specific product row by name
     * @param {string} productName - Product name to search for
     * @returns {Locator}
     */
    getProductRow(productName) {
        return this.page.locator('tr').filter({ 
            has: this.page.locator(`a:text-is("${productName}"), a:has-text("${productName}")`)
        }).first();
    }

    /**
     * Gets the quantity input for a specific product
     * @param {string} productName - Product name
     * @returns {Locator}
     */
    getProductQuantityInput(productName) {
        const row = this.getProductRow(productName);
        return row.locator('input[name^="quantity"]').first();
    }

    /**
     * Updates quantity for a specific product
     * @param {string} productName - Product name
     * @param {number} quantity - New quantity
     * @returns {Promise<CartPage>}
     */
    async updateProductQuantity(productName, quantity) {
        const quantityInput = this.getProductQuantityInput(productName);
        
        await this.waitForElement(quantityInput, 'visible', 5000);
        await quantityInput.clear();
        await quantityInput.fill(quantity.toString());
        
        console.log(`✅ Updated quantity for "${productName}" to ${quantity}`);
        return this;
    }

    /**
     * Updates quantities for multiple products
     * @param {Array<{productName: string, quantity: number}>} products - Array of products with quantities
     * @returns {Promise<CartPage>}
     */
    async updateMultipleProductQuantities(products) {
        for (const product of products) {
            await this.updateProductQuantity(product.productName, product.quantity);
        }
        return this;
    }

    /**
     * Gets the unit price for a specific product
     * @param {string} productName - Product name
     * @returns {Promise<number>}
     */
    async getProductUnitPrice(productName) {
        const row = this.getProductRow(productName);
        
        try {
            // Look for unit price column (typically 3rd or 4th column)
            const priceCell = row.locator('td').nth(2);
            const priceText = await priceCell.textContent();
            
            // Extract numeric value from price (remove currency symbols, commas, etc.)
            const price = this.extractPrice(priceText);
            return price;
        } catch (error) {
            console.log(`Could not get unit price for "${productName}":`, error.message);
            return 0;
        }
    }

    /**
     * Gets the total price for a specific product (unit price * quantity)
     * @param {string} productName - Product name
     * @returns {Promise<number>}
     */
    async getProductTotalPrice(productName) {
        const row = this.getProductRow(productName);
        
        try {
            // Look for total column (typically last column before remove button)
            const totalCell = row.locator('td').last();
            const totalText = await totalCell.textContent();
            
            // Extract numeric value from total
            const total = this.extractPrice(totalText);
            return total;
        } catch (error) {
            console.log(`Could not get total price for "${productName}":`, error.message);
            return 0;
        }
    }

    /**
     * Gets the cart subtotal
     * @returns {Promise<number>}
     */
    async getSubtotal() {
        try {
            const subtotalRow = this.page.locator('tr').filter({ 
                has: this.page.locator('td, th').filter({ hasText: /sub-total|subtotal/i })
            }).first();
            
            const priceCell = subtotalRow.locator('td').last();
            const priceText = await priceCell.textContent();
            
            return this.extractPrice(priceText);
        } catch (error) {
            console.log('Could not get subtotal:', error.message);
            return 0;
        }
    }

    /**
     * Gets the cart total (grand total)
     * @returns {Promise<number>}
     */
    async getTotal() {
        try {
            const totalRow = this.page.locator('tr').filter({ 
                has: this.page.locator('td, th').filter({ hasText: /^total$/i })
            }).last();
            
            const priceCell = totalRow.locator('td').last();
            const priceText = await priceCell.textContent();
            
            return this.extractPrice(priceText);
        } catch (error) {
            console.log('Could not get total:', error.message);
            return 0;
        }
    }

    /**
     * Extracts numeric price from text
     * @param {string} priceText - Text containing price
     * @returns {number} Numeric price value
     */
    extractPrice(priceText) {
        if (!priceText) return 0;
        
        // Remove currency symbols, spaces, and extract number
        // Handles formats like: $123.45, $1,234.56, €123,45
        const cleaned = priceText
            .replace(/[^\d.,\-]/g, '') // Remove non-numeric except decimal separators
            .replace(/,/g, ''); // Remove thousand separators
        
        const price = parseFloat(cleaned);
        return isNaN(price) ? 0 : price;
    }

    /**
     * Calculates expected total for multiple products
     * @param {Array<{productName: string, quantity: number, unitPrice: number}>} products - Products with quantities and prices
     * @returns {number} Expected total
     */
    calculateExpectedTotal(products) {
        let total = 0;
        for (const product of products) {
            total += product.quantity * product.unitPrice;
        }
        return total;
    }

    /**
     * Gets all cart item details
     * @returns {Promise<Array<{name: string, unitPrice: number, quantity: number, total: number}>>}
     */
    async getAllCartItemDetails() {
        const items = [];
        
        try {
            // Wait for cart table to be present
            await this.page.waitForTimeout(1000);
            
            // Try multiple selectors for cart rows
            const cartRowSelectors = [
                '.table-responsive tbody tr',
                '#content table tbody tr',
                'table tbody tr',
                '#shopping-cart tbody tr',
                '[id*="cart"] tbody tr'
            ];
            
            let cartRows = null;
            for (const selector of cartRowSelectors) {
                const locator = this.page.locator(selector);
                const count = await locator.count();
                if (count > 0) {
                    cartRows = locator;
                    console.log(`✅ Found ${count} cart rows using selector: ${selector}`);
                    break;
                }
            }
            
            if (!cartRows) {
                console.log('⚠️ No cart rows found with any selector');
                return items;
            }
            
            const count = await cartRows.count();
            
            for (let i = 0; i < count; i++) {
                const row = cartRows.nth(i);
                
                // Try multiple selectors for product name - be more flexible
                const nameSelectors = [
                    'td a[href*="product"]',
                    'td.text-left a',
                    'td a:not([onclick*="remove"])',  // Exclude remove buttons
                    '.product-name a',
                    'td:nth-child(2) a'  // Usually the second column has the name
                ];
                
                let name = null;
                for (const selector of nameSelectors) {
                    try {
                        const nameLink = row.locator(selector).first();
                        const linkCount = await nameLink.count();
                        if (linkCount > 0) {
                            const textContent = await nameLink.textContent();
                            if (textContent && textContent.trim()) {
                                name = textContent;
                                break;
                            }
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }
                
                if (!name || !name.trim()) {
                    console.log(`⚠️ Could not find name for row ${i}, trying text content...`);
                    // Fallback: try to get any text from the row
                    try {
                        const allText = await row.textContent();
                        console.log(`  Row ${i} text: ${allText}`);
                    } catch (e) {
                        // Ignore
                    }
                    continue;
                }
                
                // Get quantity
                const quantityInput = row.locator('input[name^="quantity"]').first();
                const quantityCount = await quantityInput.count();
                let quantity = 1;
                
                if (quantityCount > 0) {
                    const quantityValue = await quantityInput.inputValue();
                    quantity = parseInt(quantityValue) || 1;
                }
                
                // Get unit price - try multiple columns
                let unitPrice = 0;
                const cells = row.locator('td');
                const cellCount = await cells.count();
                
                // Usually: Image | Name | Model | Quantity | Unit Price | Total | Remove
                // Try to find price in 4th or 5th column (index 3 or 4)
                if (cellCount >= 5) {
                    const unitPriceCell = cells.nth(4);
                    const unitPriceText = await unitPriceCell.textContent();
                    unitPrice = this.extractPrice(unitPriceText);
                    
                    // If that doesn't work, try column 3
                    if (unitPrice === 0 && cellCount >= 4) {
                        const altPriceCell = cells.nth(3);
                        const altPriceText = await altPriceCell.textContent();
                        unitPrice = this.extractPrice(altPriceText);
                    }
                }
                
                // Get total price - try multiple columns to find it
                let total = 0;
                if (cellCount >= 6) {
                    // Try column 5 (common for Total column)
                    let totalCell = cells.nth(5);
                    let totalText = await totalCell.textContent();
                    total = this.extractPrice(totalText);
                    
                    // If that's 0 or same as unit price, try second to last column
                    if (total === 0 || total === unitPrice) {
                        totalCell = cells.nth(cellCount - 2);
                        totalText = await totalCell.textContent();
                        total = this.extractPrice(totalText);
                    }
                    
                    // If still wrong, try last column
                    if (total === 0 || total === unitPrice) {
                        totalCell = cells.nth(cellCount - 1);
                        totalText = await totalCell.textContent();
                        total = this.extractPrice(totalText);
                    }
                }
                
                items.push({
                    name: name.trim(),
                    unitPrice,
                    quantity,
                    total
                });
                
                console.log(`  → Item ${i + 1}: ${name.trim()} | Qty: ${quantity} | Unit: $${unitPrice.toFixed(2)} | Total: $${total.toFixed(2)}`);
            }
        } catch (error) {
            console.log('Error getting cart item details:', error.message);
        }
        
        return items;
    }
}

module.exports = { CartPage };
