const { BasePage } = require('./BasePage');

/**
 * Change Password Page - Handles password change functionality
 * Follows Single Responsibility Principle: Only manages password change operations
 * @extends BasePage
 */
class ChangePasswordPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Password form input locators
        this.passwordInput = page.locator('input[name="password"]');
        this.confirmPasswordInput = page.locator('input[name="confirm"]');

        // Action button locators
        this.continueButton = page.locator('input[type="submit"][value="Continue"]');

        // Sidebar navigation locators
        this.sidebarPasswordLink = page.locator('#column-right a:has-text("Password")');

        // Alert and message locators
        this.alertSuccess = page.locator('.alert-success');
        this.alertDanger = page.locator('.alert-danger');

        // Page heading
        this.pageHeading = page.locator('h1, h2').filter({ hasText: /password/i }).first();
    }

    /**
     * Navigates to the Change Password page directly
     * @returns {Promise<ChangePasswordPage>}
     */
    async navigateToChangePassword() {
        await this.navigate('/index.php?route=account/password');
        await this.page.waitForLoadState('networkidle');
        await this.waitForElement(this.passwordInput, 'visible', 10000);
        return this;
    }

    /**
     * Navigates to Change Password page from account sidebar
     * @returns {Promise<ChangePasswordPage>}
     */
    async navigateToChangePasswordFromSidebar() {
        await this.waitForElement(this.sidebarPasswordLink, 'visible', 5000);
        await this.sidebarPasswordLink.click();
        await this.page.waitForLoadState('networkidle');
        await this.waitForElement(this.passwordInput, 'visible', 10000);
        return this;
    }

    /**
     * Changes the account password
     * @param {string} newPassword - The new password to set
     * @returns {Promise<ChangePasswordPage>}
     */
    async changePassword(newPassword) {
        await this.passwordInput.fill(newPassword);
        await this.confirmPasswordInput.fill(newPassword);
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Verifies if password change was successful
     * @returns {Promise<boolean>}
     */
    async isPasswordChangeSuccessful() {
        try {
            await this.waitForElement(this.alertSuccess, 'visible', 5000);
            const successText = await this.getText(this.alertSuccess);
            return successText.toLowerCase().includes('success') || 
                   successText.toLowerCase().includes('password') ||
                   successText.toLowerCase().includes('updated');
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the success message after password change
     * @returns {Promise<string>}
     */
    async getSuccessMessage() {
        try {
            await this.waitForElement(this.alertSuccess, 'visible', 5000);
            return await this.getText(this.alertSuccess);
        } catch (error) {
            return '';
        }
    }

    /**
     * Gets the error message if password change fails
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
     * Checks if password page is displayed
     * @returns {Promise<boolean>}
     */
    async isPasswordPageDisplayed() {
        try {
            const isPasswordInputVisible = await this.isVisible(this.passwordInput);
            const isConfirmInputVisible = await this.isVisible(this.confirmPasswordInput);
            return isPasswordInputVisible && isConfirmInputVisible;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { ChangePasswordPage };

