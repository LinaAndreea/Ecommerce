const { BasePage } = require('./BasePage');

/**
 * Edit Account Page - Handles user account information updates
 * Follows Single Responsibility Principle: Only manages account editing functionality
 * @extends BasePage
 */
class EditAccountPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Form input locators
        this.firstNameInput = page.locator('input[name="firstname"]');
        this.lastNameInput = page.locator('input[name="lastname"]');
        this.emailInput = page.locator('input[name="email"]');
        this.telephoneInput = page.locator('input[name="telephone"]');

        // Action button locators
        this.continueButton = page.locator('input[type="submit"][value="Continue"]');
        this.backButton = page.locator('a:has-text("Back")');

        // Alert and message locators
        this.successMessage = page.locator('.alert-success');
        this.errorMessage = page.locator('.alert-danger');

        // Page heading locator
        this.pageHeading = page.locator('h1:has-text("My Account Information")');
    }

    /**
     * Navigates to the Edit Account page
     * @returns {Promise<EditAccountPage>}
     */
    async navigateToEditAccount() {
        await this.navigate('/index.php?route=account/edit');
        await this.waitForElement(this.pageHeading, 'visible', 10000);
        return this;
    }

    /**
     * Clicks on Edit Account link from My Account page
     * @returns {Promise<EditAccountPage>}
     */
    async clickEditAccountLink() {
        const editLink = this.page.locator('a:has-text("Edit your account information")');
        await editLink.click();
        await this.page.waitForLoadState('networkidle');
        await this.waitForElement(this.pageHeading, 'visible', 10000);
        return this;
    }

    /**
     * Updates the first name field
     * @param {string} firstName - New first name
     * @returns {Promise<EditAccountPage>}
     */
    async updateFirstName(firstName) {
        await this.firstNameInput.clear();
        await this.firstNameInput.fill(firstName);
        return this;
    }

    /**
     * Updates the last name field
     * @param {string} lastName - New last name
     * @returns {Promise<EditAccountPage>}
     */
    async updateLastName(lastName) {
        await this.lastNameInput.clear();
        await this.lastNameInput.fill(lastName);
        return this;
    }

    /**
     * Updates the full name (first and last name)
     * @param {string} fullName - Full name (will be split into first and last)
     * @returns {Promise<EditAccountPage>}
     */
    async updateFullName(fullName) {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Name';
        
        await this.updateFirstName(firstName);
        await this.updateLastName(lastName);
        return this;
    }

    /**
     * Updates the email field
     * @param {string} email - New email address
     * @returns {Promise<EditAccountPage>}
     */
    async updateEmail(email) {
        await this.emailInput.clear();
        await this.emailInput.fill(email);
        return this;
    }

    /**
     * Updates the telephone field
     * @param {string} telephone - New telephone number
     * @returns {Promise<EditAccountPage>}
     */
    async updateTelephone(telephone) {
        await this.telephoneInput.clear();
        await this.telephoneInput.fill(telephone);
        return this;
    }

    /**
     * Submits the account information form
     * @returns {Promise<EditAccountPage>}
     */
    async submitForm() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Updates account information with provided data
     * @param {Object} accountData - Account data to update
     * @param {string} [accountData.firstname] - First name
     * @param {string} [accountData.lastname] - Last name
     * @param {string} [accountData.email] - Email address
     * @param {string} [accountData.telephone] - Telephone number
     * @returns {Promise<EditAccountPage>}
     */
    async updateAccountInformation(accountData) {
        if (accountData.firstname) {
            await this.updateFirstName(accountData.firstname);
        }
        if (accountData.lastname) {
            await this.updateLastName(accountData.lastname);
        }
        if (accountData.email) {
            await this.updateEmail(accountData.email);
        }
        if (accountData.telephone) {
            await this.updateTelephone(accountData.telephone);
        }
        await this.submitForm();
        return this;
    }

    /**
     * Verifies success message is displayed after update
     * @returns {Promise<boolean>}
     */
    async isUpdateSuccessful() {
        try {
            await this.waitForElement(this.successMessage, 'visible', 5000);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the success message text
     * @returns {Promise<string>}
     */
    async getSuccessMessage() {
        try {
            await this.waitForElement(this.successMessage, 'visible', 5000);
            return await this.getText(this.successMessage);
        } catch (error) {
            return '';
        }
    }

    /**
     * Gets the error message text
     * @returns {Promise<string>}
     */
    async getErrorMessage() {
        try {
            await this.waitForElement(this.errorMessage, 'visible', 5000);
            return await this.getText(this.errorMessage);
        } catch (error) {
            return '';
        }
    }

    /**
     * Gets current first name value from form
     * @returns {Promise<string>}
     */
    async getCurrentFirstName() {
        return await this.firstNameInput.inputValue();
    }

    /**
     * Gets current last name value from form
     * @returns {Promise<string>}
     */
    async getCurrentLastName() {
        return await this.lastNameInput.inputValue();
    }

    /**
     * Gets current email value from form
     * @returns {Promise<string>}
     */
    async getCurrentEmail() {
        return await this.emailInput.inputValue();
    }

    /**
     * Gets current telephone value from form
     * @returns {Promise<string>}
     */
    async getCurrentTelephone() {
        return await this.telephoneInput.inputValue();
    }

    /**
     * Gets current full name from form
     * @returns {Promise<string>}
     */
    async getCurrentFullName() {
        const firstName = await this.getCurrentFirstName();
        const lastName = await this.getCurrentLastName();
        return `${firstName} ${lastName}`.trim();
    }

    /**
     * Verifies account information matches expected values
     * @param {Object} expectedData - Expected account data
     * @param {string} [expectedData.firstname] - Expected first name
     * @param {string} [expectedData.lastname] - Expected last name
     * @param {string} [expectedData.email] - Expected email
     * @param {string} [expectedData.telephone] - Expected telephone
     * @returns {Promise<boolean>}
     */
    async verifyAccountInformation(expectedData) {
        const currentFirstName = await this.getCurrentFirstName();
        const currentLastName = await this.getCurrentLastName();
        const currentEmail = await this.getCurrentEmail();
        const currentTelephone = await this.getCurrentTelephone();

        let isMatch = true;

        if (expectedData.firstname && currentFirstName !== expectedData.firstname) {
            console.log(`First name mismatch: expected "${expectedData.firstname}", got "${currentFirstName}"`);
            isMatch = false;
        }
        if (expectedData.lastname && currentLastName !== expectedData.lastname) {
            console.log(`Last name mismatch: expected "${expectedData.lastname}", got "${currentLastName}"`);
            isMatch = false;
        }
        if (expectedData.email && currentEmail !== expectedData.email) {
            console.log(`Email mismatch: expected "${expectedData.email}", got "${currentEmail}"`);
            isMatch = false;
        }
        if (expectedData.telephone && currentTelephone !== expectedData.telephone) {
            console.log(`Telephone mismatch: expected "${expectedData.telephone}", got "${currentTelephone}"`);
            isMatch = false;
        }

        return isMatch;
    }
}

module.exports = { EditAccountPage };






