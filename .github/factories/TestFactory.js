const { HomePage } = require('../../pages/homepage');
const { ShopByCategoryPage } = require('../../pages/shopByCategoryPage');
const { SearchResultsPage } = require('../../pages/searchResultsPage');
const { ConfigService } = require('../../services/ConfigService');
const { ApiService } = require('../../services/ApiService');
const { DataPersistenceService } = require('../../services/DataPersistenceService');


/**
 * Test Factory - Creates test page objects and services with proper initialization
 * Follows Dependency Injection pattern for both UI tests and API tests
 */
class TestFactory {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost';
        this.configService = new ConfigService();
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
