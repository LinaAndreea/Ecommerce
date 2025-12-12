const { BasePage } = require('./BasePage');

/**
 * Login Page - Handles all login page interactions
 * Follows Single Responsibility Principle: Only manages login functionality
 * @extends BasePage
 */
class LoginPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Form input locators
        this.emailInput = page.locator('input[name="email"]');
        this.passwordInput = page.locator('input[name="password"]');

        // Action button locators
        this.loginButton = page.locator('input[type="submit"][value="Login"]');

        // Navigation link locators
        this.forgotPasswordLink = page.locator('a:has-text("Forgotten Password")');
        this.continueToRegisterButton = page.locator('a.btn:has-text("Continue")');

        // Alert and message locators
        this.alertDanger = page.locator('.alert-danger');
        this.alertSuccess = page.locator('.alert-success');
    }

    /**
     * Navigates to the login page
     * @returns {Promise<LoginPage>}
     */
    async navigateToLogin() {
        await this.navigate('/index.php?route=account/login');
        await this.waitForElement(this.emailInput, 'visible', 10000);
        return this;
    }

    /**
     * Logs in with provided credentials
     * @param {string} email - User email address
     * @param {string} password - User password
     * @returns {Promise<LoginPage>}
     */
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Verifies successful login by checking URL redirect
     * @returns {Promise<boolean>}
     */
    async isLoginSuccessful() {
        const currentUrl = this.page.url();
        return currentUrl.includes('account/account') || 
               currentUrl.includes('route=account/account');
    }

    /**
     * Gets the error message displayed after failed login
     * @returns {Promise<string>}
     */
    async getErrorMessage() {
        try {
            await this.waitForElement(this.alertDanger, 'visible', 5000);
            return await this.getText(this.alertDanger);
        } catch (error) {
            return '';
        }
    }

    /**
     * Verifies error message is displayed
     * @param {string} expectedMessage - Expected error text (partial match)
     * @returns {Promise<boolean>}
     */
    async verifyErrorMessage(expectedMessage) {
        const errorText = await this.getErrorMessage();
        return errorText.toLowerCase().includes(expectedMessage.toLowerCase());
    }

    /**
     * Clicks continue button to navigate to registration page
     * @returns {Promise<LoginPage>}
     */
    async clickContinueToRegister() {
        await this.continueToRegisterButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }
}

module.exports = { LoginPage };
