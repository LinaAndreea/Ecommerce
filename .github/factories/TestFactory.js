const { ConfigService } = require('../../services/ConfigService');
const { ApiService } = require('../../services/ApiService');
const { DataPersistenceService } = require('../../services/DataPersistenceService');
const { HomePage } = require('../../pages/homepage');
const { ShopByCategoryPage } = require('../../pages/shopByCategoryPage');

/**
 * Test Factory - Single Responsibility: Create test dependencies
 * Follows DIP by providing dependency injection
 * Follows OCP by being extensible for new page types
 */
class TestFactory {
    constructor() {
        this.configService = new ConfigService();
        this.dataPersistenceService = new DataPersistenceService(this.configService);
    }

    createApiService(requestContext) {
        return new ApiService(requestContext, this.configService);
    }

    createHomePage(page) {
        return new HomePage(page, this.configService);
    }

    createShopByCategoryPage(page) {
        return new ShopByCategoryPage(page, this.configService);
    }

    getConfigService() {
        return this.configService;
    }

    getDataPersistenceService() {
        return this.dataPersistenceService;
    }
}

module.exports = { TestFactory };
