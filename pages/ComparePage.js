const { BasePage } = require('./BasePage');

/**
 * Compare Page - Handles product comparison functionality
 * Follows Single Responsibility Principle: Only manages compare page interactions
 * @extends BasePage
 */
class ComparePage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Page heading locators
        this.pageHeading = page.locator('#content h1, h1:has-text("Product Comparison")');
        
        // Compare table locators
        this.compareTable = page.locator('#content table');
        this.compareTableRows = page.locator('#content table tbody tr');
        
        // Product links in the compare table - these are the product names
        this.productLinks = page.locator('#content table a[href*="product/product"]');
        
        // Remove button locators - specifically the remove links
        this.removeButtons = page.locator('#content table a[href*="remove"]');
        
        // Empty compare message
        this.emptyMessage = page.locator('#content p, #content').filter({ hasText: /not chosen any products/i });
        
        // Continue shopping button
        this.continueButton = page.locator('a.btn:has-text("Continue"), button:has-text("Continue")');
        
        // Add to cart buttons in compare table
        this.addToCartButtons = page.locator('#content input[value="Add to Cart"], #content button:has-text("Add to Cart")');
    }

    /**
     * Navigates directly to the compare page
     * @returns {Promise<ComparePage>}
     */
    async navigateToComparePage() {
        await this.navigate('/index.php?route=product/compare');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Checks if the compare page is displayed
     * @returns {Promise<boolean>}
     */
    async isComparePageDisplayed() {
        try {
            await this.waitForElement(this.pageHeading, 'visible', 5000);
            const headingText = await this.getText(this.pageHeading);
            return headingText.toLowerCase().includes('comparison') || 
                   headingText.toLowerCase().includes('compare');
        } catch (error) {
            return false;
        }
    }

    /**
     * Checks if compare table is visible
     * @returns {Promise<boolean>}
     */
    async isCompareTableVisible() {
        try {
            await this.waitForElement(this.compareTable, 'visible', 5000);
            return await this.isVisible(this.compareTable);
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the count of products in the compare table
     * @returns {Promise<number>}
     */
    async getComparedProductsCount() {
        try {
            // Get unique product names
            const names = await this.getComparedProductNames();
            return names.length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Gets all product names from the compare table
     * @returns {Promise<Array<string>>}
     */
    async getComparedProductNames() {
        const names = [];
        
        try {
            // Wait for table to be visible
            await this.compareTable.waitFor({ state: 'visible', timeout: 5000 });
            
            // Get all product links in the table
            const linkCount = await this.productLinks.count();
            
            for (let i = 0; i < linkCount; i++) {
                const name = await this.productLinks.nth(i).textContent();
                if (name && name.trim()) {
                    // Avoid duplicates (same product may appear twice in table)
                    const trimmedName = name.trim();
                    if (!names.includes(trimmedName)) {
                        names.push(trimmedName);
                    }
                }
            }
            
            return names;
        } catch (error) {
            console.log('Error getting compared product names:', error.message);
            return names;
        }
    }

    /**
     * Verifies if a specific product is in the compare list
     * @param {string} productName - Name of the product to find
     * @returns {Promise<boolean>}
     */
    async isProductInCompareList(productName) {
        const names = await this.getComparedProductNames();
        const normalizedSearch = productName.toLowerCase().trim();
        
        return names.some(name => 
            name.toLowerCase().includes(normalizedSearch) || 
            normalizedSearch.includes(name.toLowerCase())
        );
    }

    /**
     * Verifies if all expected products are in the compare list
     * @param {Array<string>} expectedProducts - Array of product names to verify
     * @returns {Promise<{allFound: boolean, foundProducts: Array<string>, missingProducts: Array<string>}>}
     */
    async verifyProductsInCompareList(expectedProducts) {
        const comparedProducts = await this.getComparedProductNames();
        const foundProducts = [];
        const missingProducts = [];
        
        for (const expected of expectedProducts) {
            const normalizedExpected = expected.toLowerCase().trim();
            const found = comparedProducts.some(name => 
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
     * Checks if compare list is empty
     * @returns {Promise<boolean>}
     */
    async isCompareListEmpty() {
        try {
            const messageVisible = await this.emptyMessage.isVisible();
            if (messageVisible) {
                return true;
            }
            
            // Check if table has no products
            const productCount = await this.getComparedProductsCount();
            return productCount === 0;
        } catch (error) {
            return true;
        }
    }

    /**
     * Removes a product from compare by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<ComparePage>}
     */
    async removeProductByIndex(index) {
        const removeButton = this.removeButtons.nth(index);
        await this.waitForElement(removeButton, 'visible', 5000);
        await removeButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Removes all products from compare
     * @returns {Promise<ComparePage>}
     */
    async removeAllProducts() {
        let count = await this.removeButtons.count();
        
        while (count > 0) {
            await this.removeButtons.first().click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(500);
            count = await this.removeButtons.count();
        }
        
        return this;
    }

    /**
     * Clicks continue shopping button
     * @returns {Promise<ComparePage>}
     */
    async clickContinue() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Adds a product to cart from compare by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<ComparePage>}
     */
    async addProductToCartByIndex(index) {
        const addToCartButton = this.addToCartButtons.nth(index);
        await this.waitForElement(addToCartButton, 'visible', 5000);
        await addToCartButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets the empty compare message text
     * @returns {Promise<string>}
     */
    async getEmptyMessage() {
        try {
            await this.waitForElement(this.emptyMessage, 'visible', 5000);
            return await this.getText(this.emptyMessage);
        } catch (error) {
            return '';
        }
    }
}

module.exports = { ComparePage };

