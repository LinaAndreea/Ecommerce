const { BasePage } = require('./BasePage');

/**
 * Edit Address Page - Handles user address updates
 * Follows Single Responsibility Principle: Only manages address editing functionality
 * @extends BasePage
 */
class EditAddressPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Form input locators
        this.firstNameInput = page.locator('input[name="firstname"]');
        this.lastNameInput = page.locator('input[name="lastname"]');
        this.companyInput = page.locator('input[name="company"]');
        this.address1Input = page.locator('input[name="address_1"]');
        this.address2Input = page.locator('input[name="address_2"]');
        this.cityInput = page.locator('input[name="city"]');
        this.postcodeInput = page.locator('input[name="postcode"]');
        this.countrySelect = page.locator('select[name="country_id"]');
        this.regionSelect = page.locator('select[name="zone_id"]');

        // Default address radio buttons
        this.defaultAddressRadio = page.locator('input[name="default"][value="1"]');

        // Action button locators
        this.continueButton = page.locator('input[type="submit"][value="Continue"]');
        this.backButton = page.locator('a:has-text("Back")');

        // Alert and message locators
        this.successMessage = page.locator('.alert-success');
        this.errorMessage = page.locator('.alert-danger');

        // Page heading locator
        this.pageHeading = page.locator('h2:has-text("Address Book")');
    }

    /**
     * Navigates to the Address Book page
     * @returns {Promise<EditAddressPage>}
     */
    async navigateToAddressBook() {
        await this.navigate('/index.php?route=account/address');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Navigates to edit the default address
     * @returns {Promise<EditAddressPage>}
     */
    async navigateToEditDefaultAddress() {
        await this.navigate('/index.php?route=account/address/edit');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Clicks on Edit Address link from My Account page
     * @returns {Promise<EditAddressPage>}
     */
    async clickEditAddressLink() {
        const editLink = this.page.locator('a:has-text("Modify your address book entries")');
        await editLink.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Checks if any address exists in the address book
     * @returns {Promise<boolean>}
     */
    async hasExistingAddress() {
        try {
            const editButton = this.page.locator('table.table a:has-text("Edit")').first();
            await editButton.waitFor({ state: 'visible', timeout: 3000 });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clicks New Address button to add a new address
     * @returns {Promise<EditAddressPage>}
     */
    async clickNewAddress() {
        const newAddressButton = this.page.locator('a:has-text("New Address")');
        await newAddressButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Clicks the Edit button for the default address
     * @returns {Promise<EditAddressPage>}
     */
    async clickEditDefaultAddress() {
        // Look for Edit button within the address table
        const editButton = this.page.locator('table.table a:has-text("Edit")').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });
        await editButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Opens address form - either edit existing or create new
     * @returns {Promise<EditAddressPage>}
     */
    async openAddressForm() {
        const hasAddress = await this.hasExistingAddress();
        if (hasAddress) {
            console.log('✅ Editing existing address');
            await this.clickEditDefaultAddress();
        } else {
            console.log('✅ Creating new address (no existing address found)');
            await this.clickNewAddress();
        }
        return this;
    }

    /**
     * Updates address with provided data
     * @param {Object} addressData - Address data to update
     * @param {string} [addressData.firstname] - First name
     * @param {string} [addressData.lastname] - Last name
     * @param {string} [addressData.company] - Company name
     * @param {string} [addressData.address1] - Address line 1
     * @param {string} [addressData.address2] - Address line 2
     * @param {string} [addressData.city] - City
     * @param {string} [addressData.postcode] - Postal code
     * @param {string} [addressData.country] - Country ID
     * @param {string} [addressData.region] - Region/Zone ID
     * @returns {Promise<EditAddressPage>}
     */
    async updateAddress(addressData) {
        if (addressData.firstname) {
            await this.firstNameInput.clear();
            await this.firstNameInput.fill(addressData.firstname);
        }
        if (addressData.lastname) {
            await this.lastNameInput.clear();
            await this.lastNameInput.fill(addressData.lastname);
        }
        if (addressData.company) {
            await this.companyInput.clear();
            await this.companyInput.fill(addressData.company);
        }
        if (addressData.address1) {
            await this.address1Input.clear();
            await this.address1Input.fill(addressData.address1);
        }
        if (addressData.address2) {
            await this.address2Input.clear();
            await this.address2Input.fill(addressData.address2);
        }
        if (addressData.city) {
            await this.cityInput.clear();
            await this.cityInput.fill(addressData.city);
        }
        if (addressData.postcode) {
            await this.postcodeInput.clear();
            await this.postcodeInput.fill(addressData.postcode);
        }
        if (addressData.country) {
            await this.countrySelect.selectOption(addressData.country);
            // Wait for region dropdown to update with dynamic options
            await this.page.waitForTimeout(1500);
        }
        if (addressData.region) {
            try {
                // Wait for regions to be populated
                await this.page.waitForTimeout(500);
                // Select the first available region if specified region doesn't exist
                const regionOptions = await this.regionSelect.locator('option').count();
                if (regionOptions > 1) {
                    // Try to select specified region, fallback to first non-empty option
                    try {
                        await this.regionSelect.selectOption(addressData.region);
                    } catch (error) {
                        // If specified region doesn't exist, select first available region
                        const firstValidOption = await this.regionSelect.locator('option').nth(1).getAttribute('value');
                        if (firstValidOption) {
                            await this.regionSelect.selectOption(firstValidOption);
                            console.log(`ℹ️ Specified region not found, selected first available region`);
                        }
                    }
                }
            } catch (error) {
                console.log('⚠️ Could not select region:', error.message);
            }
        }
        return this;
    }

    /**
     * Auto-selects the first available region from dropdown
     * @returns {Promise<EditAddressPage>}
     */
    async selectFirstAvailableRegion() {
        try {
            await this.page.waitForTimeout(1000);
            const regionOptions = await this.regionSelect.locator('option').count();
            if (regionOptions > 1) {
                const firstValidOption = await this.regionSelect.locator('option').nth(1).getAttribute('value');
                if (firstValidOption) {
                    await this.regionSelect.selectOption(firstValidOption);
                    console.log('✅ Auto-selected first available region');
                }
            }
        } catch (error) {
            console.log('ℹ️ No region selection needed or available');
        }
        return this;
    }

    /**
     * Submits the address form
     * @returns {Promise<EditAddressPage>}
     */
    async submitForm() {
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle');
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
     * Gets current address values from form
     * @returns {Promise<Object>} Current address data
     */
    async getCurrentAddress() {
        return {
            firstname: await this.firstNameInput.inputValue(),
            lastname: await this.lastNameInput.inputValue(),
            company: await this.companyInput.inputValue(),
            address1: await this.address1Input.inputValue(),
            address2: await this.address2Input.inputValue(),
            city: await this.cityInput.inputValue(),
            postcode: await this.postcodeInput.inputValue()
        };
    }

    /**
     * Verifies address information matches expected values
     * @param {Object} expectedData - Expected address data
     * @returns {Promise<boolean>}
     */
    async verifyAddressInformation(expectedData) {
        const currentAddress = await this.getCurrentAddress();
        let isMatch = true;

        for (const [key, value] of Object.entries(expectedData)) {
            if (value && currentAddress[key] !== value) {
                console.log(`${key} mismatch: expected "${value}", got "${currentAddress[key]}"`);
                isMatch = false;
            }
        }

        return isMatch;
    }
}

module.exports = { EditAddressPage };

