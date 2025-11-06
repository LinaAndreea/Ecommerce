/**
 * User Data Generator - Single Responsibility: Generate test user data
 * Follows OCP by being extensible for different user data strategies
 */
class UserDataGenerator {
    static generateUniqueUser() {
        const timestamp = Date.now();
        return {
            firstname: 'Auto',
            lastname: 'Tester',
            email: `test+${timestamp}@mail.com`,
            telephone: '1234567890',
            password: 'Password123!'
        };
    }

    static generateUserWithData(overrides = {}) {
        const defaultUser = this.generateUniqueUser();
        return { ...defaultUser, ...overrides };
    }
}

module.exports = { UserDataGenerator };
