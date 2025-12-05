const { BasePage } = require('./basePage');

/**
 * Login Page - Handles all login page interactions
 * Encapsulates page elements and provides methods for user interactions
 */
class LoginPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Login form elements - Following selector priority: input types → CSS classes → text → role
        this.emailInput = page.locator('input[type="email"], input[name*="email"], input[id*="email"]').first();
        this.passwordInput = page.locator('input[type="password"], input[name*="password"], input[id*="password"]').first();
        this.loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
        // More flexible heading locator to match various login page headings
        this.loginHeading = page.locator('h1, h2, h3').filter({ hasText: /login|sign in|account|customer/i }).first();
        this.errorMessage = page.locator('[role="alert"], .alert.alert-danger, [class*="error"], [class*="alert"]').first();
        this.registerLink = page.locator('a[href*="register"], a:has-text("Register"), a:has-text("Sign Up")').first();
        this.forgotPasswordLink = page.locator('a[href*="forgot"], a:has-text("Forgot")').first();
    }

    /**
     * Navigates to the login page
     * @returns {Promise<LoginPage>}
     */
    async navigate() {
        await super.navigate('/login');
        return this;
    }

    /**
     * Logs in with provided credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<LoginPage>}
     */
    async login(email, password) {
        await this.waitForElement(this.emailInput, 'visible', 5000);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        return this;
    }

    /**
     * Verifies login heading is visible
     * @returns {Promise<boolean>}
     */
    async isLoginHeadingVisible() {
        try {
            await this.waitForElement(this.loginHeading, 'visible', 5000);
            return await this.isVisible(this.loginHeading);
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets error message text
     * @returns {Promise<string>}
     */
    async getErrorMessage() {
        await this.waitForElement(this.errorMessage, 'visible', 5000);
        return await this.getText(this.errorMessage);
    }

    /**
     * Verifies error message is displayed
     * @param {string} expectedMessage - Expected error text
     * @returns {Promise<LoginPage>}
     */
    async verifyErrorMessage(expectedMessage) {
        const message = await this.getErrorMessage();
        if (!message.includes(expectedMessage)) {
            throw new Error(`Expected error message to contain "${expectedMessage}" but got "${message}"`);
        }
        return this;
    }

    /**
     * Clicks on register link
     * @returns {Promise<LoginPage>}
     */
    async clickRegisterLink() {
        await this.registerLink.click();
        return this;
    }

    /**
     * Clicks on forgot password link
     * @returns {Promise<LoginPage>}
     */
    async clickForgotPasswordLink() {
        await this.forgotPasswordLink.click();
        return this;
    }
}

module.exports = { LoginPage };
