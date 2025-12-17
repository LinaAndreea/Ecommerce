const { test, expect } = require('@playwright/test');
const { TestFactory } = require('../.github/factories/TestFactory');
const { UserDataGenerator } = require('../services/UserDataGenerator');

test.describe('Password Change Feature:', () => {
    let testFactory;
    let loginPage;
    let myAccountPage;
    let changePasswordPage;
    let testUser;
    const newPassword = 'NewSecurePassword456!';

    test.beforeEach(async ({ page, request }) => {
        testFactory = new TestFactory();
        loginPage = testFactory.createLoginPage(page);
        myAccountPage = testFactory.createMyAccountPage(page);
        changePasswordPage = testFactory.createChangePasswordPage(page);

        // Register new user via API
        const apiService = testFactory.createApiService(request);
        testUser = UserDataGenerator.generateUniqueUser();
        const result = await apiService.registerUser(testUser);
        expect(result.success).toBeTruthy();
    });

    test('should deny access with old password and grant access with new password after password change', async () => {
        const originalPassword = testUser.password;

        // Given I have logged in to the AUT
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, originalPassword);
        expect(await loginPage.isLoginSuccessful()).toBeTruthy();

        // And I have navigated to the User Management screen
        await myAccountPage.navigateToMyAccount();

        // And I have changed the account password
        await changePasswordPage.navigateToChangePasswordFromSidebar();
        await changePasswordPage.changePassword(newPassword);
        expect(await changePasswordPage.isPasswordChangeSuccessful()).toBeTruthy();

        // When I logout
        await myAccountPage.logout();
        expect(await myAccountPage.isLogoutSuccessful()).toBeTruthy();

        // And attempt to relog with the old password
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, originalPassword);

        // Then the application should not grant the user access
        expect(await loginPage.isLoginSuccessful()).toBeFalsy();

        // When I attempt to relog with the new password
        await loginPage.navigateToLogin();
        await loginPage.login(testUser.email, newPassword);

        // Then the application should grant the user access
        expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    });
});
