const { HomePage } = require('../../pages/HomePage');
const { ShopByCategoryPage } = require('../../pages/ShopByCategoryPage');
const { SearchResultsPage } = require('../../pages/SearchResultsPage');
const { LoginPage } = require('../../pages/LoginPage');
const { MyAccountPage } = require('../../pages/MyAccountPage');
const { RegistrationPage } = require('../../pages/RegistrationPage');
const { ConfigService } = require('../../services/ConfigService');
const { ApiService } = require('../../services/ApiService');
const { DataPersistenceService } = require('../../services/DataPersistenceService');


/**
 * Test Factory - Creates test page objects and services with proper initialization
 * Follows Dependency Injection pattern for both UI tests and API tests
 */
class TestFactory {
    constructor() {
        this.configService = new ConfigService();
        // Use ConfigService baseURL for consistency across API and UI tests
        this.baseUrl = this.configService.get('baseURL');
    }

    /**
     * Creates a HomePage instance
     * @param {Page} page - Playwright page object
     * @returns {HomePage}
     */
    createHomePage(page) {
        return new HomePage(page, this.baseUrl);
    }

    /**
     * Creates a ShopByCategoryPage instance
     * @param {Page} page - Playwright page object
     * @returns {ShopByCategoryPage}
     */
    createShopByCategoryPage(page) {
        return new ShopByCategoryPage(page, this.baseUrl);
    }

    /**
     * Creates a SearchResultsPage instance
     * @param {Page} page - Playwright page object
     * @returns {SearchResultsPage}
     */
    createSearchResultsPage(page) {
        return new SearchResultsPage(page, this.baseUrl);
    }

    /**
     * Creates a LoginPage instance
     * @param {Page} page - Playwright page object
     * @returns {LoginPage}
     */
    createLoginPage(page) {
        return new LoginPage(page, this.baseUrl);
    }

    /**
     * Creates a MyAccountPage instance
     * @param {Page} page - Playwright page object
     * @returns {MyAccountPage}
     */
    createMyAccountPage(page) {
        return new MyAccountPage(page, this.baseUrl);
    }

    /**
     * Creates a RegistrationPage instance
     * @param {Page} page - Playwright page object
     * @returns {RegistrationPage}
     */
    createRegistrationPage(page) {
        return new RegistrationPage(page, this.baseUrl);
    }

    /**
     * Gets the ConfigService instance
     * @returns {ConfigService}
     */
    getConfigService() {
        return this.configService;
    }

    /**
     * Creates an ApiService instance
     * @param {APIRequestContext} requestContext - Playwright request context
     * @returns {ApiService}
     */
    createApiService(requestContext) {
        return new ApiService(requestContext, this.configService);
    }

    /**
     * Gets the DataPersistenceService instance
     * @returns {DataPersistenceService}
     */
    getDataPersistenceService() {
        return new DataPersistenceService(this.configService);
    }

    /**
     * Gets the base URL
     * @returns {string}
     */
    getBaseUrl() {
        return this.baseUrl;
    }
}

module.exports = { TestFactory };
