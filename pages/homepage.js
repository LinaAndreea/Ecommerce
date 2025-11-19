const { BasePage } = require('./BasePage');

/**
 * Home Page - Single Responsibility: Handle home page specific interactions
 * Follows LSP by properly extending BasePage
 */
class HomePage extends BasePage {
    constructor(page, configService) {
        super(page, configService);
        // Use configuration-based selector
        this.navHomeLink = this.getLocator('navbar.home');
    
        // Read selectors from ConfigService (match keys in ConfigService.js)
        this.featuredCarouselSelector = this.config.get('carousel.featuredProducts');
        this.featuredCarouselSlidesSelector = this.config.get('carousel.slides');
        this.featuredCarousel = this.page.locator(this.featuredCarouselSelector);
          
    }
async isFeaturedCarouselVisible() {
    try {
        // use the same carousel selector the constructor reads
        await this.waitForSelector(this.featuredCarouselSelector, { timeout: 5000 });
        return await this.featuredCarousel.isVisible();
    } catch (error) {
        return false;
    }
}
  async getFeaturedCarouselSlideCount() {
        // Wait for carousel container
        await this.waitForSelector(this.featuredCarouselSelector);
        // Prefer the explicit inner-item selector which matches the page markup
        const slides = this.featuredCarousel.locator('.carousel-inner > .carousel-item');
        return await slides.count();
    }

    async waitForCarouselSlides() {
        const slidesSelector = `${this.featuredCarouselSelector} ${this.featuredCarouselSlidesSelector}`;
        await this.page.waitForSelector(slidesSelector, { state: 'visible' });
        await this.page.waitForTimeout(1000);
    }
    async navigate() {
        await super.navigate('/');
    }

    async getHomeNavText() {
        return await this.navHomeLink.textContent();
    }
}

module.exports = { HomePage };