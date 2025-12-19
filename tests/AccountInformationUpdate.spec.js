const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { MyAccountPage } = require('../pages/MyAccountPage');
const { EditAccountPage } = require('../pages/EditAccountPage');
const { EditAddressPage } = require('../pages/EditAddressPage');
const { TestFactory } = require('../.github/factories/TestFactory');
const { UserDataGenerator } = require('../services/UserDataGenerator');

/**
 * Account Information Update Tests - Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through Page Objects
 * 
 * Test Scenario:
 * As a confused user who has had an identity crisis,
 * I want to update my account information and address,
 * So that my account reflects my new identity as a free bird.
 */
test.describe('Account Information Update Feature:', () => {
    let loginPage;
    let myAccountPage;
    let editAccountPage;
    let editAddressPage;
    let testFactory;
    let baseUrl;
    let testUser;
    let updatedAccountData;
    let updatedAddressData;
    let addressToVerify;

    test.beforeEach(async ({ page }) => {
        // Initialize factory and services
        testFactory = new TestFactory();
        const configService = testFactory.getConfigService();
        const dataPersistenceService = testFactory.getDataPersistenceService();
        baseUrl = configService.get('baseURL');

        // Load existing test user from file
        try {
            testUser = dataPersistenceService.loadUserCredentials();
            if (!testUser) {
                throw new Error('test-user.json not found. Please run registration tests first.');
            }
            console.log('✅ Loaded test user from file:', testUser.email);
        } catch (error) {
            console.log('⚠️ Could not load test user:', error.message);
            test.skip();
            return;
        }

        // Initialize Page Objects
        loginPage = new LoginPage(page, baseUrl);
        myAccountPage = new MyAccountPage(page, baseUrl);
        editAccountPage = new EditAccountPage(page, baseUrl);
        editAddressPage = new EditAddressPage(page, baseUrl);

        // Generate test data for updates
        updatedAccountData = {
            firstname: 'Mister',
            lastname: 'Bombastik',
            email: testUser.email, // Keep same email
            telephone: '9876543210'
        };

        updatedAddressData = UserDataGenerator.generateRandomAddress();
        console.log('✅ Generated random address for free bird:', updatedAddressData.address1);
    });

    test('should update account information and persist changes after re-login', async ({ page }) => {
        // Skip test if no test user available
        if (!testUser) {
            test.skip();
            return;
        }

        console.log('\n=== Starting Identity Crisis Test ===');

        // Given I have navigated to the AUT
        console.log('📍 Given: Navigating to the AUT...');
        await loginPage.navigateToLogin();
        console.log('✅ Successfully navigated to the application');

        // And I have had an identity crisis (preparing to change identity)
        console.log('🎭 And: Having an identity crisis...');
        console.log('💭 Deciding to become "Mister Bombastik" - a free bird with no legal address');

        // Login first
        console.log('🔐 Logging in with existing credentials...');
        await loginPage.login(testUser.email, testUser.password);
        const isLoggedIn = await loginPage.isLoginSuccessful();
        expect(isLoggedIn).toBeTruthy();
        console.log('✅ Successfully logged in');

        // And I have navigated to the My Account page
        // Note: Login automatically redirects to My Account page, so we're already there
        console.log('\n📍 And: Already on My Account page after login...');
        await page.waitForLoadState('networkidle');
        console.log('✅ My Account page loaded');

        // When I change my name to "Mister Bombastik"
        console.log('\n✏️ When: Changing name to "Mister Bombastik"...');
        await editAccountPage.navigateToEditAccount();
        console.log('✅ Opened Edit Account page');

        await editAccountPage.updateAccountInformation(updatedAccountData);
        console.log('✅ Updated account information');

        // Verify immediate update success
        const isAccountUpdateSuccessful = await editAccountPage.isUpdateSuccessful();
        expect(isAccountUpdateSuccessful).toBeTruthy();
        console.log('✅ Account update confirmed with success message');

        // And I update my address to a Random Address because I am a free bird with no legal address
        console.log('\n🏠 And: Updating address to random address (free bird lifestyle)...');
        await editAddressPage.navigateToAddressBook();
        console.log('✅ Opened Address Book');

        await editAddressPage.openAddressForm();

        await editAddressPage.updateAddress(updatedAddressData);
        await editAddressPage.selectFirstAvailableRegion();
        await editAddressPage.submitForm();
        console.log('✅ Updated address to:', updatedAddressData.address1);

        // Verify address update success
        const isAddressUpdateSuccessful = await editAddressPage.isUpdateSuccessful();
        expect(isAddressUpdateSuccessful).toBeTruthy();
        console.log('✅ Address update confirmed with success message');

        // Then the account information should be updated
        console.log('\n✔️ Then: Verifying account information is updated...');
        await editAccountPage.navigateToEditAccount();
        
        const isAccountVerified = await editAccountPage.verifyAccountInformation(updatedAccountData);
        expect(isAccountVerified).toBeTruthy();
        console.log('✅ Account information verified successfully');

        const currentFullName = await editAccountPage.getCurrentFullName();
        expect(currentFullName).toBe('Mister Bombastik');
        console.log('✅ Name confirmed as "Mister Bombastik"');

        // Verify address information
        console.log('\n✔️ Verifying address information is updated...');
        await editAddressPage.navigateToAddressBook();
        await editAddressPage.openAddressForm();
        
        // Verify only the text fields (not dropdowns like country/region)
        addressToVerify = {
            firstname: updatedAddressData.firstname,
            lastname: updatedAddressData.lastname,
            company: updatedAddressData.company,
            address1: updatedAddressData.address1,
            address2: updatedAddressData.address2,
            city: updatedAddressData.city,
            postcode: updatedAddressData.postcode
        };
        const isAddressVerified = await editAddressPage.verifyAddressInformation(addressToVerify);
        expect(isAddressVerified).toBeTruthy();
        console.log('✅ Address information verified successfully');
        console.log('✅ Free bird address confirmed:', updatedAddressData.address1);

        // When I relog (logout and login again)
        console.log('\n🔄 When: Logging out and logging back in...');
        await myAccountPage.logout();
        
        const isLogoutSuccessful = await myAccountPage.isLogoutSuccessful();
        expect(isLogoutSuccessful).toBeTruthy();
        console.log('✅ Logged out successfully');

        // Login again
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, testUser.password);
        const isReloginSuccessful = await loginPage.isLoginSuccessful();
        expect(isReloginSuccessful).toBeTruthy();
        console.log('✅ Logged back in successfully');

        // Then the account information should be updated with the latest changes
        console.log('\n✔️ Then: Verifying changes persisted after re-login...');
        await editAccountPage.navigateToEditAccount();
        
        const isAccountPersistedAfterRelogin = await editAccountPage.verifyAccountInformation(updatedAccountData);
        expect(isAccountPersistedAfterRelogin).toBeTruthy();
        console.log('✅ Account information persisted after re-login');

        const currentFullNameAfterRelogin = await editAccountPage.getCurrentFullName();
        expect(currentFullNameAfterRelogin).toBe('Mister Bombastik');
        console.log('✅ Name still shows "Mister Bombastik" after re-login');

        // Verify address persisted after re-login
        console.log('\n✔️ Verifying address persisted after re-login...');
        await editAddressPage.navigateToAddressBook();
        await editAddressPage.openAddressForm();
        
        const isAddressPersistedAfterRelogin = await editAddressPage.verifyAddressInformation(addressToVerify);
        expect(isAddressPersistedAfterRelogin).toBeTruthy();
        console.log('✅ Address information persisted after re-login');
        console.log('✅ Free bird address still valid:', updatedAddressData.address1);

        console.log('\n=== Test Summary ===');
        console.log('Identity Crisis Resolution: ✅');
        console.log('Navigation to AUT: ✅');
        console.log('My Account Access: ✅');
        console.log('Name Change to "Mister Bombastik": ✅');
        console.log('Random Address Update (Free Bird): ✅');
        console.log('Initial Account Verification: ✅');
        console.log('Initial Address Verification: ✅');
        console.log('Logout: ✅');
        console.log('Re-login: ✅');
        console.log('Account Persistence Verification: ✅');
        console.log('Address Persistence Verification: ✅');
        console.log('\n🎭 Identity crisis successfully resolved!');
        console.log('🕊️ Free bird lifestyle with no legal address confirmed!');
    });
});

