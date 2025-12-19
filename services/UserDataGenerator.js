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

    /**
     * Generates a random address for testing
     * @returns {Object} Random address data
     */
    static generateRandomAddress() {
        const streetNames = ['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Birch', 'Willow', 'Spruce'];
        const streetTypes = ['Street', 'Avenue', 'Road', 'Lane', 'Boulevard', 'Drive', 'Way'];
        const cities = ['Springfield', 'Riverside', 'Fairview', 'Georgetown', 'Madison', 'Bristol'];
        const companies = ['Wanderer Inc', 'Free Spirit LLC', 'Nomad Solutions', 'Liberty Tech', 'Freedom Corp'];
        
        const randomStreetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        const randomStreetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const randomCompany = companies[Math.floor(Math.random() * companies.length)];
        const randomStreetNumber = Math.floor(Math.random() * 9999) + 1;
        const randomPostcode = Math.floor(Math.random() * 90000) + 10000;

        return {
            firstname: 'Free',
            lastname: 'Bird',
            company: randomCompany,
            address1: `${randomStreetNumber} ${randomStreetName} ${randomStreetType}`,
            address2: `Apt ${Math.floor(Math.random() * 99) + 1}`,
            city: randomCity,
            postcode: randomPostcode.toString(),
            country: '223' // United Kingdom
            // Note: Region is dynamically loaded and will be selected automatically
        };
    }
}

module.exports = { UserDataGenerator };
