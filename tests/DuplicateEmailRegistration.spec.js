const { test, expect } = require('@playwright/test');
const { TestFactory } = require('../.github/factories/TestFactory');
const { UserDataGenerator } = require('../services/UserDataGenerator');

/**
 * Duplicate Email Registration Tests
 * 
 * Validates that the application prevents duplicate email registration
 * and displays appropriate error messages.
 * 
 * Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (Page Objects and Services)
 * - OCP: Extensible through configuration
 */
test.describe('Duplicate Email Registration:', () => {
    let testFactory;
    let apiService;
    let loginPage;
    let myAccountPage;
    let registrationPage;
    let testUserData;

    test.beforeEach(async ({ page, request }) => {
        // Initialize factory and services following DIP
        testFactory = new TestFactory();
        apiService = testFactory.createApiService(request);

        // Initialize Page Objects
        loginPage = testFactory.createLoginPage(page);
        myAccountPage = testFactory.createMyAccountPage(page);
        registrationPage = testFactory.createRegistrationPage(page);

        // Generate unique user data for this test run
        testUserData = UserDataGenerator.generateUniqueUser();

        // Pre-condition: Register test user via API (setup data)
        const registrationResult = await apiService.registerUser(testUserData);
        expect(registrationResult.success).toBeTruthy();
        console.log('✅ Pre-condition: Test user registered via API:', testUserData.email);
    });

    test('should display error message when registering with existing email after login and logout', async ({ page }) => {
        // Step 1: Navigate to AUT and login with test account
        await loginPage.navigateToLogin();
        await loginPage.login(testUserData.email, testUserData.password);
        
        // Verify login was successful
        const isLoggedIn = await loginPage.isLoginSuccessful();
        expect(isLoggedIn).toBeTruthy();
        console.log('✅ Step 1: Successfully logged in with test account');

        // Step 2: Logout from the application
        await myAccountPage.logout();
        
        // Verify logout was successful
        const isLoggedOut = await myAccountPage.isLogoutSuccessful();
        expect(isLoggedOut).toBeTruthy();
        console.log('✅ Step 2: Successfully logged out');

        // Step 3: Navigate to Create Account page
        await registrationPage.navigateToRegistration();
        
        // Verify we're on registration page
        const pageHeading = await registrationPage.getPageHeading();
        expect(pageHeading.toLowerCase()).toContain('register');
        console.log('✅ Step 3: Navigated to registration page');

        // Step 4: Fill registration form with the SAME email used for login
        const duplicateUserData = UserDataGenerator.generateUserWithData({
            firstname: 'Duplicate',
            lastname: 'User',
            email: testUserData.email // Same email as the logged-in user
        });

        await registrationPage.fillRegistrationForm(duplicateUserData);
        await registrationPage.selectNewsletter(false);
        await registrationPage.acceptPrivacyPolicy();
        console.log('✅ Step 4: Filled registration form with duplicate email:', duplicateUserData.email);

        // Step 5: Submit registration
        await registrationPage.submitRegistration();
        console.log('✅ Step 5: Submitted registration form');

        // Step 6: Verify account is NOT created
        const isRegistrationSuccessful = await registrationPage.isRegistrationSuccessful();
        expect(isRegistrationSuccessful).toBeFalsy();
        console.log('✅ Step 6: Account was NOT created (as expected)');

        // Step 7: Verify error message is displayed
        const isErrorDisplayed = await registrationPage.isErrorDisplayed();
        expect(isErrorDisplayed).toBeTruthy();
        
        const errorMessage = await registrationPage.getErrorMessage();
        expect(errorMessage.length).toBeGreaterThan(0);
        
        // Verify the error message relates to email already existing
        const hasEmailError = errorMessage.toLowerCase().includes('already') || 
                             errorMessage.toLowerCase().includes('registered') ||
                             errorMessage.toLowerCase().includes('exists') ||
                             errorMessage.toLowerCase().includes('e-mail');
        expect(hasEmailError).toBeTruthy();
        
        console.log('✅ Step 7: Error message displayed:', errorMessage.trim());
        console.log('✅ Test passed: Duplicate email registration prevented successfully');
    });

    test('should prevent duplicate email registration via direct navigation to registration', async ({ page }) => {
        // This test variant directly navigates to registration without login/logout flow
        // Useful for regression testing the email uniqueness validation in isolation
        
        // Step 1: Navigate directly to registration page
        await registrationPage.navigateToRegistration();
        console.log('✅ Step 1: Navigated to registration page');

        // Step 2: Attempt registration with existing email
        const duplicateUserData = UserDataGenerator.generateUserWithData({
            firstname: 'Another',
            lastname: 'Duplicate',
            email: testUserData.email // Same email registered in beforeEach
        });

        await registrationPage.register(duplicateUserData);
        console.log('✅ Step 2: Attempted registration with duplicate email:', duplicateUserData.email);

        // Step 3: Verify registration fails with appropriate error
        const isRegistrationSuccessful = await registrationPage.isRegistrationSuccessful();
        expect(isRegistrationSuccessful).toBeFalsy();
        
        const isErrorDisplayed = await registrationPage.isErrorDisplayed();
        expect(isErrorDisplayed).toBeTruthy();
        
        const errorMessage = await registrationPage.getErrorMessage();
        expect(errorMessage).toBeTruthy();
        console.log('✅ Step 3: Registration failed with error:', errorMessage.trim());
        
        // Verify we're still on registration page (not redirected to success)
        const currentUrl = page.url();
        expect(currentUrl).toContain('register');
        console.log('✅ Test passed: User remains on registration page after duplicate email attempt');
    });
});

