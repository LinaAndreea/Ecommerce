const { BasePage } = require('./BasePage');

/**
 * My Account Page - Handles authenticated user account interactions
 * Follows Single Responsibility Principle: Only manages account page functionality
 * @extends BasePage
 */
class MyAccountPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Account navigation menu locators
        this.myAccountDropdown = page.locator('a.dropdown-toggle').filter({ hasText: 'My account' });
        this.logoutLink = page.locator('a[href*="route=account/logout"]').first();
        this.loginLink = page.locator('a[href*="route=account/login"]').first();
        this.registerLink = page.locator('a[href*="route=account/register"]').first();

        // Account sidebar navigation
        this.sidebarLogout = page.locator('#column-right a:has-text("Logout")');
        this.sidebarMyAccount = page.locator('#column-right a:has-text("My Account")');
        this.sidebarEditAccount = page.locator('#column-right a:has-text("Edit Account")');

        // Account page content locators
        this.accountHeading = page.locator('h2:has-text("My Account")');
        this.editAccountLink = page.locator('a:has-text("Edit your account information")');
        this.changePasswordLink = page.locator('a:has-text("Change your password")');

        // Logout confirmation locators
        this.logoutHeading = page.locator('h1:has-text("Account Logout")');
        this.logoutMessage = page.locator('#content p');
        this.continueButton = page.locator('a.btn:has-text("Continue")');
    }

    /**
     * Navigates to My Account page
     * @returns {Promise<MyAccountPage>}
     */
    async navigateToMyAccount() {
        await this.navigate('/index.php?route=account/account');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Logs out from the current session using the dropdown menu
     * @returns {Promise<MyAccountPage>}
     */
    async logout() {
        // Click on the account dropdown first
        await this.myAccountDropdown.hover();
        await this.page.waitForTimeout(300);
        
        // Click logout from dropdown
        await this.logoutLink.waitFor({ state: 'visible', timeout: 5000 });
        await this.logoutLink.click();
        
        // Wait for logout to complete - use shorter timeout and fallback
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            // Fallback: wait for load state if networkidle times out
            await this.page.waitForLoadState('load', { timeout: 5000 });
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Logs out using sidebar navigation (for account page)
     * @returns {Promise<MyAccountPage>}
     */
    async logoutFromSidebar() {
        await this.sidebarLogout.click();
        
        // Wait for logout to complete - use shorter timeout and fallback
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            // Fallback: wait for load state if networkidle times out
            await this.page.waitForLoadState('load', { timeout: 5000 });
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Verifies the logout was successful
     * @returns {Promise<boolean>}
     */
    async isLogoutSuccessful() {
        try {
            await this.waitForElement(this.logoutHeading, 'visible', 5000);
            const headingText = await this.getText(this.logoutHeading);
            return headingText.toLowerCase().includes('logout');
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the logout confirmation message
     * @returns {Promise<string>}
     */
    async getLogoutMessage() {
        try {
            await this.waitForElement(this.logoutMessage, 'visible', 5000);
            return await this.getText(this.logoutMessage);
        } catch (error) {
            return '';
        }
    }

    /**
     * Clicks continue button after logout
     * @returns {Promise<MyAccountPage>}
     */
    async clickContinueAfterLogout() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Checks if user is currently logged in by verifying account dropdown state
     * @returns {Promise<boolean>}
     */
    async isUserLoggedIn() {
        try {
            await this.myAccountDropdown.hover();
            await this.page.waitForTimeout(300);
            // If logout link is visible in dropdown, user is logged in
            const logoutVisible = await this.logoutLink.isVisible();
            return logoutVisible;
        } catch (error) {
            return false;
        }
    }

    /**
     * Navigates to registration page from account dropdown
     * @returns {Promise<MyAccountPage>}
     */
    async navigateToRegisterFromDropdown() {
        await this.myAccountDropdown.hover();
        await this.page.waitForTimeout(300);
        await this.registerLink.waitFor({ state: 'visible', timeout: 5000 });
        await this.registerLink.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }
}

module.exports = { MyAccountPage };

