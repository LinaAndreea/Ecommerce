const { test, expect, request } = require('@playwright/test');
const { TestFactory } = require('./factories/TestFactory');
const { UserDataGenerator } = require('../services/UserDataGenerator');

/**
 * API Registration Tests - Following SOLID principles:
 * - SRP: Each test has single responsibility
 * - DIP: Depends on abstractions (services) not concrete implementations
 * - OCP: Extensible through configuration and services
 */
test.describe('User Registration API Tests', () => {
    let testFactory;
    let apiService;
    let dataPersistenceService;

    test.beforeEach(async ({ request }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        const configService = testFactory.getConfigService();
        
        // Use the request fixture directly - it's already a context
        apiService = testFactory.createApiService(request);
        dataPersistenceService = testFactory.getDataPersistenceService();
    });

    test('should register new user via API successfully', async () => {
        // Arrange - Single responsibility: data generation
        const userData = UserDataGenerator.generateUniqueUser();
        
        // Act - Single responsibility: API operation
        const registrationResult = await apiService.registerUser(userData);
        
        // Assert - Single responsibility: verification
        expect(registrationResult.success).toBeTruthy();
        expect(registrationResult.body.toLowerCase()).toContain('your account has been created');
        
        // Single responsibility: data persistence
        const savedData = dataPersistenceService.saveUserCredentials(userData);
        expect(savedData.email).toBe(userData.email);
        
        console.log('✅ Registered user and saved credentials:', userData.email);
    });

    test('should handle registration with custom user data', async () => {
        // Arrange - Extensible through strategy pattern
        const customUserData = UserDataGenerator.generateUserWithData({
            firstname: 'Custom',
            lastname: 'User'
        });
        
        // Act
        const registrationResult = await apiService.registerUser(customUserData);
        
        // Assert
        expect(registrationResult.success).toBeTruthy();
        expect(registrationResult.body.toLowerCase()).toContain('your account has been created');
    });
});