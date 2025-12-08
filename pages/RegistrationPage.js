const { BasePage } = require('./BasePage');

/**
 * Registration Page - Handles user registration interactions
 * Follows Single Responsibility Principle: Only manages registration functionality
 * @extends BasePage
 */
class RegistrationPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Personal details input locators
        this.firstNameInput = page.locator('input[name="firstname"]');
        this.lastNameInput = page.locator('input[name="lastname"]');
        this.emailInput = page.locator('input[name="email"]');
        this.telephoneInput = page.locator('input[name="telephone"]');

        // Password input locators
        this.passwordInput = page.locator('input[name="password"]');
        this.confirmPasswordInput = page.locator('input[name="confirm"]');

        // Newsletter subscription locators - use labels for custom styled radio buttons
        this.newsletterYesLabel = page.locator('label[for="input-newsletter-yes"]');
        this.newsletterNoLabel = page.locator('label[for="input-newsletter-no"]');
        this.newsletterYesInput = page.locator('#input-newsletter-yes');
        this.newsletterNoInput = page.locator('#input-newsletter-no');

        // Privacy policy and terms locators - use label for custom styled checkbox
        this.privacyPolicyCheckbox = page.locator('#input-agree');
        this.privacyPolicyLabel = page.locator('label[for="input-agree"]');

        // Action button locators
        this.continueButton = page.locator('input[type="submit"][value="Continue"]');

        // Alert and message locators
        this.alertDanger = page.locator('.alert-danger');
        this.alertSuccess = page.locator('.alert-success');
        this.warningMessage = page.locator('.alert-warning');

        // Field-specific error locators
        this.emailError = page.locator('input[name="email"] + .text-danger, #error-email');
        
        // Page heading locators
        this.pageHeading = page.locator('h1');
        this.accountCreatedHeading = page.locator('h1:has-text("Your Account Has Been Created")');
    }

    /**
     * Navigates to the registration page
     * @returns {Promise<RegistrationPage>}
     */
    async navigateToRegistration() {
        await this.navigate('/index.php?route=account/register');
        await this.waitForElement(this.firstNameInput, 'visible', 10000);
        return this;
    }

    /**
     * Fills in the registration form with provided user data
     * @param {Object} userData - User registration data
     * @param {string} userData.firstname - First name
     * @param {string} userData.lastname - Last name
     * @param {string} userData.email - Email address
     * @param {string} userData.telephone - Phone number
     * @param {string} userData.password - Password
     * @returns {Promise<RegistrationPage>}
     */
    async fillRegistrationForm(userData) {
        await this.firstNameInput.fill(userData.firstname);
        await this.lastNameInput.fill(userData.lastname);
        await this.emailInput.fill(userData.email);
        await this.telephoneInput.fill(userData.telephone);
        await this.passwordInput.fill(userData.password);
        await this.confirmPasswordInput.fill(userData.password);
        return this;
    }

    /**
     * Accepts the privacy policy by checking the checkbox
     * @returns {Promise<RegistrationPage>}
     */
    async acceptPrivacyPolicy() {
        // Check if already checked, if not then click
        const isChecked = await this.privacyPolicyCheckbox.isChecked();
        if (!isChecked) {
            await this.privacyPolicyLabel.click();
        }
        return this;
    }

    /**
     * Selects newsletter subscription preference
     * @param {boolean} subscribe - True to subscribe, false to decline
     * @returns {Promise<RegistrationPage>}
     */
    async selectNewsletter(subscribe = false) {
        if (subscribe) {
            await this.newsletterYesLabel.click();
        } else {
            // Check if already selected (default is No)
            const isNoSelected = await this.newsletterNoInput.isChecked();
            if (!isNoSelected) {
                await this.newsletterNoLabel.click();
            }
        }
        return this;
    }

    /**
     * Clicks the continue/submit button to submit registration
     * @returns {Promise<RegistrationPage>}
     */
    async submitRegistration() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Completes the full registration process
     * @param {Object} userData - User registration data
     * @param {boolean} subscribeNewsletter - Newsletter subscription preference
     * @returns {Promise<RegistrationPage>}
     */
    async register(userData, subscribeNewsletter = false) {
        await this.fillRegistrationForm(userData);
        await this.selectNewsletter(subscribeNewsletter);
        await this.acceptPrivacyPolicy();
        await this.submitRegistration();
        return this;
    }

    /**
     * Checks if registration was successful by looking for success indicators
     * @returns {Promise<boolean>}
     */
    async isRegistrationSuccessful() {
        try {
            // Check for success heading or URL containing success
            const currentUrl = this.page.url();
            if (currentUrl.includes('account/success')) {
                return true;
            }
            
            // Check for success heading
            const successHeadingCount = await this.accountCreatedHeading.count();
            return successHeadingCount > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the error message displayed after failed registration
     * @returns {Promise<string>}
     */
    async getErrorMessage() {
        try {
            await this.waitForElement(this.alertDanger, 'visible', 5000);
            return await this.getText(this.alertDanger);
        } catch (error) {
            // Try warning message as fallback
            try {
                await this.waitForElement(this.warningMessage, 'visible', 2000);
                return await this.getText(this.warningMessage);
            } catch {
                return '';
            }
        }
    }

    /**
     * Verifies error message is displayed with expected text
     * @param {string} expectedMessage - Expected error text (partial match)
     * @returns {Promise<boolean>}
     */
    async verifyErrorMessage(expectedMessage) {
        const errorText = await this.getErrorMessage();
        return errorText.toLowerCase().includes(expectedMessage.toLowerCase());
    }

    /**
     * Checks if error alert is currently visible
     * @returns {Promise<boolean>}
     */
    async isErrorDisplayed() {
        try {
            const dangerVisible = await this.alertDanger.isVisible();
            const warningVisible = await this.warningMessage.isVisible();
            return dangerVisible || warningVisible;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the page heading text
     * @returns {Promise<string>}
     */
    async getPageHeading() {
        return await this.getText(this.pageHeading);
    }
}

module.exports = { RegistrationPage };

