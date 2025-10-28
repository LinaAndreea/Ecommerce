/**
 * API Service - Single Responsibility: Handle API operations
 * Follows DIP by depending on abstraction (request context)
 */
class ApiService {
    constructor(requestContext, configService) {
        this.request = requestContext;
        this.config = configService;
    }

    async registerUser(userData) {
        const endpoint = this.config.get('api.endpoints.register');
        const baseURL = this.config.get('baseURL');
        
        // Construct full URL since request fixture doesn't auto-prepend baseURL
        const fullUrl = `${baseURL}${endpoint}`;
        
        const response = await this.request.post(fullUrl, {
            form: {
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                telephone: userData.telephone,
                password: userData.password,
                confirm: userData.password,
                agree: '1'
            }
        });

        return {
            success: response.ok(),
            body: await response.text(),
            status: response.status()
        };
    }

    async loginUser(credentials) {
        const endpoint = this.config.get('api.endpoints.login');
        const baseURL = this.config.get('baseURL');
        
        // Construct full URL since request fixture doesn't auto-prepend baseURL
        const fullUrl = `${baseURL}${endpoint}`;
        
        const response = await this.request.post(fullUrl, {
            form: {
                email: credentials.email,
                password: credentials.password
            }
        });

        return {
            success: response.ok(),
            body: await response.text(),
            status: response.status()
        };
    }
}

module.exports = { ApiService };
