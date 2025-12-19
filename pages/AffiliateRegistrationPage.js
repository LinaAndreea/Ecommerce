const { BasePage } = require('./BasePage');

/**
 * Affiliate Registration Page - Handles affiliate account registration
 * Follows Single Responsibility Principle: Only manages affiliate registration
 * @extends BasePage
 */
class AffiliateRegistrationPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Form input locators
        this.companyInput = page.locator('input[name="company"]');
        this.websiteInput = page.locator('input[name="website"]');
        this.taxIdInput = page.locator('input[name="tax"]');
        
        // Payment method locators (common options)
        this.paymentMethodCheque = page.locator('input[value="cheque"]');
        this.paymentMethodPaypal = page.locator('input[value="paypal"]');
        this.paymentMethodBankTransfer = page.locator('input[value="bank"]');
        
        // Additional info fields
        this.chequePayeeInput = page.locator('input[name="cheque"]');
        this.paypalEmailInput = page.locator('input[name="paypal"]');
        this.bankNameInput = page.locator('input[name="bank_name"]');
        this.bankAccountInput = page.locator('input[name="bank_account_name"]');
        this.bankAccountNumberInput = page.locator('input[name="bank_account_number"]');
        
        // Agreement checkbox - multiple selector strategies
        this.agreeCheckbox = page.locator('input[name="agree"], input[type="checkbox"]').first();
        this.agreeLabel = page.locator('label[for="input-agree"], label:has-text("agree"), label:has-text("terms")').first();
        
        // Submit button
        this.continueButton = page.locator('input[type="submit"]').first();
        
        // Success/error messages
        this.successMessage = page.locator('.alert-success');
        this.errorMessage = page.locator('.alert-danger');
    }

    /**
     * Navigates to affiliate registration page
     * @returns {Promise<AffiliateRegistrationPage>}
     */
    async navigateToAffiliateRegistration() {
        await this.navigate('/index.php?route=account/affiliate/add');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Checks if user is already registered as affiliate
     * @returns {Promise<boolean>}
     */
    async isAlreadyAffiliate() {
        const currentUrl = this.page.url();
        const content = await this.page.content().catch(() => '');
        
        // If redirected away or shows already registered message
        if (content.includes('already registered') || 
            content.includes('already an affiliate') ||
            content.includes('You already have an affiliate account') ||
            currentUrl.includes('account/affiliate&') ||  // Already on affiliate page (not /add)
            currentUrl.includes('account/tracking')) {  // Has access to tracking
            return true;
        }
        
        // Check if page shows "page not found" - might mean already registered
        if (content.includes('page you requested cannot be found')) {
            // This is ambiguous - could mean no access OR already registered
            // Try to navigate to tracking page to check
            return false;  // Let the test handle this case
        }
        
        return false;
    }

    /**
     * Registers user as affiliate with provided information
     * @param {Object} affiliateData - Affiliate registration data
     * @returns {Promise<AffiliateRegistrationPage>}
     */
    async registerAsAffiliate(affiliateData = {}) {
        // Default affiliate data
        const data = {
            company: affiliateData.company || 'Test Company Ltd',
            website: affiliateData.website || 'https://test-company.com',
            taxId: affiliateData.taxId || '123456789',
            paymentMethod: affiliateData.paymentMethod || 'cheque',
            chequePayee: affiliateData.chequePayee || 'Test Company',
            ...affiliateData
        };

        try {
            // Fill company information
            if (await this.companyInput.isVisible()) {
                await this.companyInput.fill(data.company);
            }

            // Fill website
            if (await this.websiteInput.isVisible()) {
                await this.websiteInput.fill(data.website);
            }

            // Fill tax ID (optional field)
            try {
                if (await this.taxIdInput.isVisible({ timeout: 2000 })) {
                    await this.taxIdInput.fill(data.taxId);
                }
            } catch (error) {
                console.log('Tax ID field not required or not visible');
            }

            // Select payment method
            if (data.paymentMethod === 'cheque') {
                await this.paymentMethodCheque.check();
                await this.page.waitForTimeout(500);
                
                if (await this.chequePayeeInput.isVisible()) {
                    await this.chequePayeeInput.fill(data.chequePayee);
                }
            } else if (data.paymentMethod === 'paypal') {
                await this.paymentMethodPaypal.check();
                await this.page.waitForTimeout(500);
                
                if (await this.paypalEmailInput.isVisible()) {
                    await this.paypalEmailInput.fill(data.paypalEmail || 'test@paypal.com');
                }
            }

            // Accept terms and conditions
            try {
                // Try to check the checkbox directly first
                const checkboxCount = await this.agreeCheckbox.count();
                if (checkboxCount > 0) {
                    const isChecked = await this.agreeCheckbox.isChecked();
                    if (!isChecked) {
                        // Try clicking the checkbox directly
                        await this.agreeCheckbox.check({ force: true });
                    }
                } else {
                    // If no checkbox found, try clicking any agreement element
                    console.log('No agreement checkbox found - form may not require it');
                }
            } catch (error) {
                console.log('Agreement checkbox handling:', error.message);
                // Continue anyway - some forms might not have this
            }

            // Submit form
            await this.continueButton.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(1000);

        } catch (error) {
            console.log('Error during affiliate registration:', error.message);
            throw error;
        }

        return this;
    }

    /**
     * Verifies if affiliate registration was successful
     * @returns {Promise<boolean>}
     */
    async isRegistrationSuccessful() {
        try {
            const currentUrl = this.page.url();
            
            // Check if redirected to success page or affiliate page
            if (currentUrl.includes('account/success') || 
                currentUrl.includes('account/affiliate') ||
                currentUrl.includes('account/account')) {
                return true;
            }

            // Check for success message
            const successVisible = await this.successMessage.isVisible({ timeout: 3000 });
            if (successVisible) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets error message if registration failed
     * @returns {Promise<string>}
     */
    async getErrorMessage() {
        try {
            if (await this.errorMessage.isVisible({ timeout: 3000 })) {
                return await this.getText(this.errorMessage);
            }
            return '';
        } catch (error) {
            return '';
        }
    }
}

module.exports = { AffiliateRegistrationPage };

