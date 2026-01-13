const { BasePage } = require('./BasePage');

/**
 * Returns Page - Handles product returns page interactions
 * Follows Single Responsibility Principle: Only manages returns page functionality
 * @extends BasePage
 */
class ReturnsPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Returns page elements
        this.pageHeading = page.locator('h1, h2').filter({ hasText: /product returns|return/i }).first();
        this.returnsTable = page.locator('table, .table-responsive').first();
        
        // Return items
        this.returnItems = page.locator('table tbody tr, .table-responsive tbody tr');
        this.returnProductNames = page.locator('table tbody td, .table-responsive tbody td').first();
        
        // Return status
        this.returnStatuses = page.locator('td:has-text("Pending"), td:has-text("Approved"), td:has-text("Complete")');
        
        // Empty returns message
        this.emptyReturnsMessage = page.locator('p').filter({ hasText: /no returns|not made any returns/i }).first();
        
        // Continue button
        this.continueButton = page.locator('a.btn:has-text("Continue")').first();
    }

    /**
     * Navigates to the returns page
     * @returns {Promise<ReturnsPage>}
     */
    async navigateToReturns() {
        await this.navigate('/index.php?route=account/return');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets all returned product names
     * @returns {Promise<Array<string>>}
     */
    async getReturnedProducts() {
        const products = [];
        
        try {
            await this.waitForElement(this.returnsTable, 'visible', 5000);
            const rows = await this.returnItems.count();
            
            // Skip header row, start from 1
            for (let i = 1; i < rows; i++) {
                const row = this.returnItems.nth(i);
                const cells = row.locator('td');
                const cellCount = await cells.count();
                
                if (cellCount > 0) {
                    // Product name is usually in the second column (index 1)
                    const productCell = cells.nth(1);
                    const productName = await productCell.textContent();
                    if (productName && productName.trim()) {
                        products.push(productName.trim());
                    }
                }
            }
        } catch (error) {
            console.log('Could not get returned products:', error.message);
        }
        
        return products;
    }

    /**
     * Gets the count of returned items
     * @returns {Promise<number>}
     */
    async getReturnedItemsCount() {
        try {
            await this.waitForElement(this.returnsTable, 'visible', 5000);
            const count = await this.returnItems.count();
            // Subtract header row
            return count > 0 ? count - 1 : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Verifies if returns page is empty
     * @returns {Promise<boolean>}
     */
    async isReturnsPageEmpty() {
        try {
            const messageVisible = await this.isVisible(this.emptyReturnsMessage);
            if (messageVisible) {
                return true;
            }
            
            const itemCount = await this.getReturnedItemsCount();
            return itemCount === 0;
        } catch (error) {
            return true;
        }
    }

    /**
     * Verifies if a specific product is in returns
     * @param {string} productName - Product name to verify
     * @returns {Promise<boolean>}
     */
    async verifyProductInReturns(productName) {
        const returnedProducts = await this.getReturnedProducts();
        const normalizedSearchName = productName.toLowerCase().trim();
        
        return returnedProducts.some(name => 
            name.toLowerCase().includes(normalizedSearchName) || 
            normalizedSearchName.includes(name.toLowerCase())
        );
    }

    /**
     * Verifies at least one return exists on the page
     * @returns {Promise<boolean>}
     */
    async verifyReturnsExist() {
        const count = await this.getReturnedItemsCount();
        return count > 0;
    }

    /**
     * Gets return status for the most recent return
     * @returns {Promise<string>}
     */
    async getMostRecentReturnStatus() {
        try {
            await this.waitForElement(this.returnsTable, 'visible', 5000);
            // Get first data row (index 1, after header)
            const firstDataRow = this.returnItems.nth(1);
            const cells = firstDataRow.locator('td');
            const cellCount = await cells.count();
            
            if (cellCount > 0) {
                // Status is typically in the 2nd column (index 1)
                // Columns: Return ID | Status | Date Added | Order ID | Customer | Actions
                const statusCell = cells.nth(1);
                const status = await statusCell.textContent();
                return status ? status.trim() : '';
            }
        } catch (error) {
            console.log('Could not get return status:', error.message);
        }
        return '';
    }

    /**
     * Verifies a return exists with Pending/Awaiting status
     * @returns {Promise<boolean>}
     */
    async verifyPendingReturnExists() {
        const status = await this.getMostRecentReturnStatus();
        const statusLower = status.toLowerCase();
        return statusLower.includes('pending') || 
               statusLower.includes('awaiting') || 
               statusLower.includes('processing');
    }
}

module.exports = { ReturnsPage };

