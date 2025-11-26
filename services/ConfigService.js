/**
 * Configuration Service - Single Responsibility: Manage test configuration
 * Follows SRP by having only one reason to change (configuration updates)
 */
class ConfigService {
    constructor() {
        this.config = {
            baseURL: process.env.BASE_URL || 'https://ecommerce-playground.lambdatest.io',
            testDataPath: process.env.TEST_DATA_PATH || __dirname + '/../tests/test-user.json',
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
                },
                search: {
                    input: 'input[name="search"][data-autocomplete]',
                    button: 'button:has-text("Search"), button[aria-label="Search"]',
                    resultsContainer: '#content .row, .product-grid, .search-results',
                    resultItems: '.product-thumb, .product-layout, .product-item',
                    productTitles: '.product-thumb h4 a, .caption h4 a, .product-title',
                    noResultsMessage: 'p:has-text("no product"), p:has-text("No products"), .no-results'
                }
            },
            api: {
                endpoints: {
                    register: '/index.php?route=account/register',
                    login: '/index.php?route=account/login'
                }
            },
             carousel: {
                container: '.swiper-container, .carousel, .slider, [class*="carousel"]',
               // Added .carousel-item to match the markup on the site
                slides: '.swiper-slide, .carousel-slide, .carousel-item, .slide, [class*="slide"]',
                featuredProducts: '[data-id="218380"], .featured-products .carousel, .product-carousel'
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
