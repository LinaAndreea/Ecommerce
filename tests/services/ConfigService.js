/**
 * Configuration Service - Single Responsibility: Manage test configuration
 * Follows SRP by having only one reason to change (configuration updates)
 */
class ConfigService {
    constructor() {
        this.config = {
            baseURL: process.env.BASE_URL || 'https://ecommerce-playground.lambdatest.io',
            testDataPath: process.env.TEST_DATA_PATH || __dirname + '/../test-user.json',
            selectors: {
                navbar: {
                    home: '#widget-navbar-217834 > ul > li:nth-child(1) > a > div > span'
                },
                category: {
                    shopButton: 'text=Shop by Category',
                    categorySection: '#mz-component-1626147655',
                    categoryItems: '.category-item, .product-category, [class*="category"]',
                    categoryNames: '.category-name, .category-title, h3, h4, .name',
                    categoryList: '.categories, .category-list, .product-categories'
                }
            },
            api: {
                endpoints: {
                    register: '/index.php?route=account/register',
                    login: '/index.php?route=account/login'
                }
            }
        };
    }

    get(key) {
        return this._getNestedProperty(this.config, key);
    }

    _getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}

module.exports = { ConfigService };
