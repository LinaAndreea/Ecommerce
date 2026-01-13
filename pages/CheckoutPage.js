const { BasePage } = require('./BasePage');

/**
 * Checkout Page - Handles checkout process interactions
 * Follows Single Responsibility Principle: Only manages checkout functionality
 * @extends BasePage
 */
class CheckoutPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Checkout form elements
        this.billingFirstName = page.locator('input[name="firstname"]').first();
        this.billingLastName = page.locator('input[name="lastname"]').first();
        this.billingAddress = page.locator('input[name="address_1"]').first();
        this.billingCity = page.locator('input[name="city"]').first();
        this.billingPostcode = page.locator('input[name="postcode"]').first();
        this.billingCountry = page.locator('select[name="country_id"]').first();
        this.billingRegion = page.locator('select[name="zone_id"]').first();

        // Checkout action buttons
        this.continueButton = page.locator('input[value="Continue"], button:has-text("Continue")').first();
        this.confirmOrderButton = page.locator('#button-confirm, button:has-text("Confirm Order"), input[value="Confirm Order"]').first();

        // Payment and shipping method
        this.paymentMethodRadio = page.locator('input[name="payment_method"]').first();
        this.shippingMethodRadio = page.locator('input[name="shipping_method"]').first();

        // Terms and conditions
        this.termsCheckbox = page.locator('input[name="agree"], input[type="checkbox"][name*="agree"]').first();

        // Order confirmation
        this.orderConfirmationHeading = page.locator('h1').filter({ hasText: /order.*placed|order.*confirmed|success/i }).first();
        this.orderSuccessMessage = page.locator('.alert-success, [class*="success"]').first();
    }

    /**
     * Navigates to checkout page
     * @returns {Promise<CheckoutPage>}
     */
    async navigateToCheckout() {
        await this.navigate('/index.php?route=checkout/checkout');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Fills billing details
     * @param {Object} billingData - Billing information
     * @returns {Promise<CheckoutPage>}
     */
    async fillBillingDetails(billingData) {
        if (billingData.firstName) await this.billingFirstName.fill(billingData.firstName);
        if (billingData.lastName) await this.billingLastName.fill(billingData.lastName);
        if (billingData.address) await this.billingAddress.fill(billingData.address);
        if (billingData.city) await this.billingCity.fill(billingData.city);
        if (billingData.postcode) await this.billingPostcode.fill(billingData.postcode);
        if (billingData.country) await this.billingCountry.selectOption(billingData.country);
        if (billingData.region) {
            await this.page.waitForTimeout(500);
            await this.billingRegion.selectOption(billingData.region);
        }
        return this;
    }

    /**
     * Clicks continue button
     * @returns {Promise<CheckoutPage>}
     */
    async clickContinue() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Selects payment method
     * @returns {Promise<CheckoutPage>}
     */
    async selectPaymentMethod() {
        try {
            await this.waitForElement(this.paymentMethodRadio, 'visible', 5000);
            await this.paymentMethodRadio.check();
        } catch (error) {
            console.log('Payment method already selected or not required');
        }
        return this;
    }

    /**
     * Selects shipping method
     * @returns {Promise<CheckoutPage>}
     */
    async selectShippingMethod() {
        try {
            await this.waitForElement(this.shippingMethodRadio, 'visible', 5000);
            await this.shippingMethodRadio.check();
        } catch (error) {
            console.log('Shipping method already selected or not required');
        }
        return this;
    }

    /**
     * Accepts terms and conditions
     * @returns {Promise<CheckoutPage>}
     */
    async acceptTerms() {
        try {
            await this.waitForElement(this.termsCheckbox, 'visible', 5000);
            await this.termsCheckbox.check();
        } catch (error) {
            console.log('Terms checkbox not found or already checked');
        }
        return this;
    }

    /**
     * Confirms the order
     * @returns {Promise<CheckoutPage>}
     */
    async confirmOrder() {
        await this.waitForElement(this.confirmOrderButton, 'visible', 10000);
        await this.confirmOrderButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Completes the entire checkout process
     * @returns {Promise<CheckoutPage>}
     */
    async completeCheckout() {
        // Wait for page to load
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        
        console.log('Current URL:', this.page.url());
        
        // Look for any continue buttons to progress through checkout steps
        const continueButtons = this.page.locator('button:has-text("Continue"), input[value="Continue"], #button-save, #button-payment-address, #button-shipping-address');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`Checkout step attempt ${attempts}`);
            
            // Check if we're at order confirmation
            const confirmButton = this.page.locator('#button-confirm, button#button-confirm').first();
            const confirmExists = await confirmButton.count();
            
            if (confirmExists > 0) {
                try {
                    await confirmButton.waitFor({ state: 'visible', timeout: 3000 });
                    console.log('Found confirm order button, clicking...');
                    await confirmButton.scrollIntoViewIfNeeded();
                    await confirmButton.click();
                    await this.page.waitForLoadState('networkidle');
                    console.log('Order confirmed!');
                    break;
                } catch (error) {
                    console.log('Confirm button not ready:', error.message);
                }
            }
            
            // Look for continue button to proceed to next step
            const continueCount = await continueButtons.count();
            if (continueCount > 0) {
                try {
                    const visibleContinue = continueButtons.first();
                    await visibleContinue.waitFor({ state: 'visible', timeout: 3000 });
                    console.log('Clicking continue button...');
                    await visibleContinue.scrollIntoViewIfNeeded();
                    await visibleContinue.click();
                    await this.page.waitForLoadState('networkidle');
                    await this.page.waitForTimeout(1000);
                    continue;
                } catch (error) {
                    console.log('Continue button not found or not clickable');
                }
            }
            
            // Check for terms checkbox
            const termsCheckbox = this.page.locator('input[name="agree"], input[type="checkbox"]').first();
            const termsCount = await termsCheckbox.count();
            if (termsCount > 0) {
                try {
                    const isChecked = await termsCheckbox.isChecked();
                    if (!isChecked) {
                        console.log('Accepting terms...');
                        await termsCheckbox.check();
                        await this.page.waitForTimeout(500);
                    }
                } catch (error) {
                    console.log('Could not check terms:', error.message);
                }
            }
            
            // If no action was taken, break to avoid infinite loop
            if (continueCount === 0 && confirmExists === 0) {
                console.log('No actionable elements found, exiting checkout loop');
                break;
            }
        }
        
        return this;
    }

    /**
     * Verifies order was placed successfully
     * @returns {Promise<boolean>}
     */
    async isOrderPlacedSuccessfully() {
        try {
            await this.waitForElement(this.orderConfirmationHeading, 'visible', 10000);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the order confirmation message
     * @returns {Promise<string>}
     */
    async getOrderConfirmationMessage() {
        try {
            await this.waitForElement(this.orderSuccessMessage, 'visible', 5000);
            return await this.getText(this.orderSuccessMessage);
        } catch (error) {
            return '';
        }
    }
}

module.exports = { CheckoutPage };

