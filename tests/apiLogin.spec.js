const { test, expect } = require('@playwright/test');
const { TestFactory } = require('./factories/TestFactory');
const { UserDataGenerator } = require('../services/UserDataGenerator');

/**
 * API Login Tests - Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (services) not concrete implementations
 * - OCP: Extensible through configuration and services
 */
test.describe('User Login API Tests', () => {
    let testFactory;
    let apiService;
    let dataPersistenceService;
    let configService;

    test.beforeEach(async ({ request }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        configService = testFactory.getConfigService();
        
        // Use the request fixture directly - it's already a context
        apiService = testFactory.createApiService(request);
        dataPersistenceService = testFactory.getDataPersistenceService();
    });

    test('should login successfully with registered user credentials', async () => {
        // Arrange - Single responsibility: load persisted credentials
        const savedCredentials = dataPersistenceService.loadUserCredentials();
        
        // Skip test if no saved credentials exist
        test.skip(!savedCredentials, 'No saved user credentials found. Run registration test first.');
        
        // Act - Single responsibility: API login operation
        const loginResult = await apiService.loginUser(savedCredentials);
        
        // Assert - Single responsibility: verification
        expect(loginResult.success).toBeTruthy();
        expect(loginResult.status).toBe(200);
        
        // Verify login success indicators in response body
        const responseBody = loginResult.body.toLowerCase();
        // Common success indicators for login (adjust based on actual response)
        const hasSuccessIndicator = responseBody.includes('my account') || 
                                  responseBody.includes('dashboard') || 
                                  responseBody.includes('welcome') ||
                                  !responseBody.includes('login failed') &&
                                  !responseBody.includes('invalid credentials');
        
        expect(hasSuccessIndicator).toBeTruthy();
        
        console.log('✅ Successfully logged in with saved credentials:', savedCredentials.email);
    });

    test('should handle invalid credentials without authentication', async () => {
        // Arrange - Single responsibility: generate invalid credentials
        const invalidCredentials = {
            email: 'nonexistent' + Date.now() + '@invalid.com',
            password: 'definitelywrongpassword123'
        };
        
        // Act - Single responsibility: API login operation with invalid data
        const loginResult = await apiService.loginUser(invalidCredentials);
        
        // Assert - Single responsibility: verification
        expect(loginResult.status).toBeGreaterThanOrEqual(200);
        expect(loginResult.body).toBeDefined();
        
        // For invalid credentials, the response should either:
        // 1. Show the login form again (not redirect to authenticated area)
        // 2. Show error messages
        // 3. Not show authenticated user-specific content
        
        const responseBody = loginResult.body.toLowerCase();
        
        // Check that we're either still on login page or got an error
        const staysOnLoginOrError = responseBody.includes('login') || 
                                   responseBody.includes('sign in') ||
                                   responseBody.includes('password') ||
                                   responseBody.includes('email') ||
                                   responseBody.includes('error') ||
                                   responseBody.includes('invalid') ||
                                   responseBody.includes('incorrect');
        
        expect(staysOnLoginOrError).toBeTruthy();
        
        console.log('✅ Invalid credentials handled appropriately - login form or error shown');
    });

    test('should login with newly created user credentials', async () => {
        // Arrange - Single responsibility: create and register new user
        const userData = UserDataGenerator.generateUniqueUser();
        
        // First register a new user
        const registrationResult = await apiService.registerUser(userData);
        expect(registrationResult.success).toBeTruthy();
        
        // Act - Single responsibility: login with newly created credentials
        const loginResult = await apiService.loginUser({
            email: userData.email,
            password: userData.password
        });
        
        // Assert - Single responsibility: verification
        expect(loginResult.success).toBeTruthy();
        expect(loginResult.status).toBe(200);
        
        const responseBody = loginResult.body.toLowerCase();
        const hasSuccessIndicator = responseBody.includes('my account') || 
                                  responseBody.includes('dashboard') || 
                                  responseBody.includes('welcome') ||
                                  !responseBody.includes('login failed') &&
                                  !responseBody.includes('invalid credentials');
        
        expect(hasSuccessIndicator).toBeTruthy();
        
        console.log('✅ Successfully logged in with newly created user:', userData.email);
    });

    test('should handle empty credentials gracefully', async () => {
        // Arrange - Single responsibility: prepare empty credentials
        const emptyCredentials = {
            email: '',
            password: ''
        };
        
        // Act - Single responsibility: API login operation with empty data
        const loginResult = await apiService.loginUser(emptyCredentials);
        
        // Assert - Single responsibility: verification of proper error handling
        const responseBody = loginResult.body.toLowerCase();
        const hasValidationError = responseBody.includes('required') ||
                                  responseBody.includes('empty') ||
                                  responseBody.includes('missing') ||
                                  responseBody.includes('error') ||
                                  loginResult.status >= 400;
        
        expect(hasValidationError).toBeTruthy();
        
        console.log('✅ Empty credentials properly handled with validation error');
    });
});
