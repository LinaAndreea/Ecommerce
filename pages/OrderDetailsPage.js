const { BasePage } = require('./BasePage');

/**
 * Order Details Page - Handles order details and returns
 * Follows Single Responsibility Principle: Only manages order details functionality
 * @extends BasePage
 */
class OrderDetailsPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Order details elements
        this.orderHeading = page.locator('h1, h2').filter({ hasText: /order information|order details/i }).first();
        this.orderTable = page.locator('table, .table-responsive').first();
        this.orderItems = page.locator('table tbody tr, .table-responsive tbody tr');
        this.productNames = page.locator('table td a[href*="product"], .table-responsive td a[href*="product"]');

        // Order information
        this.orderIdElement = page.locator('[class*="order-id"], .order-info').first();
        this.orderStatus = page.locator('[class*="status"], td:has-text("Status")').first();

        // Return product actions
        this.returnButtons = page.locator('a:has-text("Return"), button:has-text("Return"), a[href*="return"]');
        this.returnProductLinks = page.locator('a[href*="account/return/add"]');

        // Return form elements
        this.returnReasonSelect = page.locator('select[name="return_reason_id"]').first();
        this.returnCommentTextarea = page.locator('textarea[name="comment"]').first();
        this.returnSubmitButton = page.locator('input[value="Submit"], button:has-text("Submit")').first();
        
        // Product selection for return
        this.productCheckboxes = page.locator('input[name="product_id"], input[type="checkbox"][name*="product"]');
    }

    /**
     * Navigates to order history page
     * @returns {Promise<OrderDetailsPage>}
     */
    async navigateToOrderHistory() {
        await this.navigate('/index.php?route=account/order');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Navigates to a specific order details page
     * @param {string} orderId - Order ID
     * @returns {Promise<OrderDetailsPage>}
     */
    async navigateToOrderDetails(orderId) {
        await this.navigate(`/index.php?route=account/order/info&order_id=${orderId}`);
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets all order items
     * @returns {Promise<Array<string>>}
     */
    async getOrderItems() {
        const items = [];
        try {
            // Wait for page to load
            await this.page.waitForLoadState('networkidle');
            
            // Try multiple selectors for order items
            const productSelectors = [
                'table tbody td a[href*="product"]',
                'table td.text-left a',
                '.table-responsive td a[href*="product"]',
                'table tr td:nth-child(2)' // Product name is usually in 2nd column
            ];
            
            for (const selector of productSelectors) {
                const elements = this.page.locator(selector);
                const count = await elements.count();
                
                if (count > 0) {
                    for (let i = 0; i < count; i++) {
                        const text = await elements.nth(i).textContent();
                        if (text && text.trim() && !items.includes(text.trim())) {
                            items.push(text.trim());
                        }
                    }
                    
                    if (items.length > 0) {
                        break;
                    }
                }
            }
        } catch (error) {
            console.log('Could not get order items:', error.message);
        }
        return items;
    }

    /**
     * Verifies order contains expected items
     * @param {number} expectedCount - Expected number of items
     * @returns {Promise<boolean>}
     */
    async verifyOrderItemCount(expectedCount) {
        const items = await this.getOrderItems();
        return items.length === expectedCount;
    }

    /**
     * Checks if there are any orders in the order history
     * @returns {Promise<boolean>}
     */
    async hasOrders() {
        try {
            // Check for actual View buttons/links which indicate orders exist
            const viewButtons = this.page.locator(
                'a[href*="order/info"], ' +
                'a:has-text("View"), ' +
                'button:has-text("View")'
            );
            const viewCount = await viewButtons.count();
            
            // If we have view buttons, we have orders
            if (viewCount > 0) {
                return true;
            }
            
            // Check for "no orders" message as fallback
            const noOrdersMessage = this.page.locator('p, div').filter({ hasText: /no.*order|haven't.*order|no.*purchase/i });
            const hasNoOrdersMessage = await noOrdersMessage.count() > 0;
            
            return !hasNoOrdersMessage;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clicks View button for the most recent order
     * @returns {Promise<OrderDetailsPage>}
     */
    async viewMostRecentOrder() {
        // Try multiple possible selectors for the View button
        const viewButton = this.page.locator(
            'a[href*="account/order/info"], ' +
            'a[href*="order/info"], ' +
            'a:has-text("View"), ' +
            'button:has-text("View"), ' +
            '.btn:has-text("View"), ' +
            'i.fa-eye'
        ).first();
        
        const count = await viewButton.count();
        
        if (count > 0) {
            await this.waitForElement(viewButton, 'visible', 5000);
            await viewButton.click();
            await this.page.waitForLoadState('networkidle');
        } else {
            throw new Error('No View button found in order history');
        }
        
        return this;
    }

    /**
     * Navigates to return product page
     * @returns {Promise<OrderDetailsPage>}
     */
    async clickReturnProduct() {
        try {
            // Look for return link with multiple possible selectors
            const returnSelectors = [
                'a:has-text("Return")',
                'a[href*="account/return/add"]',
                'button:has-text("Return")',
                'a:has-text("Product Returns")'
            ];
            
            let clicked = false;
            for (const selector of returnSelectors) {
                const element = this.page.locator(selector).first();
                const count = await element.count();
                
                if (count > 0) {
                    try {
                        await element.waitFor({ state: 'visible', timeout: 3000 });
                        await element.click();
                        await this.page.waitForLoadState('networkidle');
                        clicked = true;
                        break;
                    } catch (e) {
                        // Try next selector
                    }
                }
            }
            
            if (!clicked) {
                // Alternative: use direct navigation to return page
                const currentUrl = this.page.url();
                const orderId = currentUrl.match(/order_id=(\d+)/)?.[1];
                
                if (orderId) {
                    await this.navigate(`/index.php?route=account/return/add&order_id=${orderId}`);
                    await this.page.waitForLoadState('networkidle');
                } else {
                    throw new Error('Could not navigate to return page');
                }
            }
        } catch (error) {
            throw error;
        }
        return this;
    }

    /**
     * Selects a product to return by index
     * @param {number} index - Product index (0-based)
     * @returns {Promise<OrderDetailsPage>}
     */
    async selectProductToReturn(index = 0) {
        try {
            await this.waitForElement(this.productCheckboxes.nth(index), 'visible', 5000);
            await this.productCheckboxes.nth(index).check();
        } catch (error) {
            console.log('Product checkbox not found or already checked');
        }
        return this;
    }

    /**
     * Fills return form and submits
     * @param {Object} returnData - Return information
     * @returns {Promise<OrderDetailsPage>}
     */
    async fillReturnForm(returnData = {}) {
        // Select return reason
        if (returnData.reason) {
            await this.returnReasonSelect.selectOption(returnData.reason);
        } else {
            // Select first available reason
            await this.returnReasonSelect.selectOption({ index: 1 });
        }

        // Fill comment if provided
        if (returnData.comment) {
            await this.returnCommentTextarea.fill(returnData.comment);
        }

        return this;
    }

    /**
     * Submits the return request
     * @returns {Promise<OrderDetailsPage>}
     */
    async submitReturn() {
        await this.returnSubmitButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Complete process to return an item
     * @param {number} productIndex - Index of product to return
     * @param {Object} returnData - Return details
     * @returns {Promise<OrderDetailsPage>}
     */
    async returnItem(productIndex = 0, returnData = {}) {
        await this.clickReturnProduct();
        await this.selectProductToReturn(productIndex);
        await this.fillReturnForm(returnData);
        await this.submitReturn();
        return this;
    }
}

module.exports = { OrderDetailsPage };

