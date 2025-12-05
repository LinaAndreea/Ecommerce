const { BasePage } = require('./basePage');

/**
 * Home Page - Handles all home page interactions
 * Encapsulates page elements and provides methods for user interactions
 */
class HomePage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Navigation - Use more generic selectors that work on ecommerce-playground
        this.navHomeLink = page.locator('a[href*="route=common/home"], a:has-text("Home")').first();

        // Banner and special offers - More generic selectors
        this.bannerContainer = page.locator('[class*="banner"], [class*="featured"], .featured-banner').first();
        this.specialOffer = page.locator('a[class*="special"], [class*="offer"]').first();

        // Review section - Generic selectors for review form
        this.reviewContainer = page.locator('[class*="review"], form[id*="review"]').first();
        this.reviewForm = page.locator('form[id*="review"], [class*="review-form"]').first();
        this.reviewNameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
        this.reviewTextInput = page.locator('textarea, textarea[name*="review"], input[name*="review"]').first();
        this.ratingInputs = page.locator('input[name*="rating"], input[type="radio"]').filter({ hasText: /[1-5]/ });
        this.submitReviewButton = page.locator('button:has-text("submit"), button:has-text("post"), button[type="submit"]').filter({ hasText: /submit|post|send/i }).first();
        this.reviewWarning = page.locator('.alert.alert-danger, [class*="warning"], [class*="error"]').first();
        this.reviewSuccessMessage = page.locator('.alert.alert-success, [class*="success"]').first();

        // Featured carousel - More resilient carousel selectors
        this.featuredCarousel = page.locator('[id*="carousel"], [class*="carousel"], .featured-carousel').first();
        this.carouselSlides = page.locator('[class*="carousel-item"], [class*="slide"], [class*="carousel"] [class*="item"]').filter({ visible: true });

        // Wishlist button - Following selector priority
        this.wishlistButton = page.locator('a[href*="wishlist"], button:has-text("Wishlist"), a[title*="Wishlist" i], [id*="wishlist"]').first();
    }

    /**
     * Navigates to the home page
     * @returns {Promise<HomePage>}
     */
    async navigate() {
        await super.navigate('/');
        return this;
    }

    /**
     * Gets home navigation link text
     * @returns {Promise<string>}
     */
    async getHomeNavText() {
        try {
            const count = await this.navHomeLink.count();
            if (count === 0) {
                // If home link not found, try to find any navigation link with "home" text
                const altLink = this.page.locator('a, nav a, header a').filter({ hasText: /home/i }).first();
                return await this.getText(altLink);
            }
            return await this.getText(this.navHomeLink);
        } catch (error) {
            return '';
        }
    }

    /**
     * Checks if featured carousel is visible
     * @returns {Promise<boolean>}
     */
    async isFeaturedCarouselVisible() {
        try {
            const carouselCount = await this.featuredCarousel.count();
            if (carouselCount === 0) {
                // Try to find any carousel-like element
                const altCarousel = this.page.locator('[class*="carousel"], [class*="slider"], [class*="swiper"], .featured').first();
                return await altCarousel.isVisible();
            }
            await this.waitForElement(this.featuredCarousel, 'visible', 5000);
            return await this.isVisible(this.featuredCarousel);
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the count of carousel slides
     * @returns {Promise<number>}
     */
    async getFeaturedCarouselSlideCount() {
        try {
            const carouselCount = await this.featuredCarousel.count();
            if (carouselCount === 0) {
                // Try to find slides from any carousel-like element
                const altSlides = this.page.locator('[class*="carousel-item"], [class*="slide"], [class*="carousel"] > *').filter({ visible: true });
                return await this.getCount(altSlides);
            }
            await this.waitForElement(this.featuredCarousel, 'visible');
            return await this.getCount(this.carouselSlides);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Waits for carousel slides to be visible
     * @returns {Promise<HomePage>}
     */
    async waitForCarouselSlides() {
        await this.waitForElement(this.carouselSlides, 'visible');
        await this.page.waitForTimeout(1000);
        return this;
    }

    /**
     * Adds a review with provided details
     * @param {string} name - Reviewer name
     * @param {string} reviewText - Review content
     * @param {number} rating - Rating value (1-5)
     * @returns {Promise<string>} Confirmation message
     */
    async addReview(name = 'Joe', reviewText = 'I really enjoyed using this product. Highly recommend!', rating = 5) {
        const ratingLabel = this.page.locator(`label[for="rating-${rating}-216860"]`);

        // Ensure form is visible and scroll into view
        await this.waitForElement(this.reviewContainer, 'visible', 10000);
        await this.scrollIntoViewIfNeeded(this.reviewContainer);

        // Fill review details
        await this.reviewNameInput.fill(name);
        await this.reviewTextInput.fill(reviewText);

        // Select rating
        if (await this.getCount(ratingLabel) > 0) {
            await this.scrollIntoViewIfNeeded(ratingLabel);
            await ratingLabel.click();
        } else {
            // Fallback: set rating directly in page context
            await this.page.evaluate((val) => {
                const el = document.querySelector(`input[name="rating"][value="${val}"]`);
                if (el) el.checked = true;
            }, rating);
        }

        // Submit review
        await this.submitReviewButton.click();

        // Wait for success or warning message
        const successPromise = this.reviewSuccessMessage.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'success').catch(() => null);
        const warningPromise = this.reviewWarning.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'warning').catch(() => null);

        const result = await Promise.race([successPromise, warningPromise]);

        if (result === 'success') {
            return await this.getText(this.reviewSuccessMessage);
        } else if (result === 'warning') {
            throw new Error('Review not submitted: validation warning shown');
        } else {
            throw new Error('No confirmation appeared after submitting review');
        }
    }

    /**
     * Gets the review confirmation message
     * @returns {Promise<string>}
     */
    async getReviewConfirmationMessage() {
        return await this.getText(this.reviewSuccessMessage);
    }

    /**
     * Verifies review success message contains expected text
     * @param {string} expectedMessage - Expected message text
     * @returns {Promise<HomePage>}
     */
    async verifyReviewSuccessMessage(expectedMessage) {
        await this.page.locator('.alert.alert-success').waitFor({ state: 'visible' });
        const message = await this.getText(this.reviewSuccessMessage);
        if (!message.includes(expectedMessage)) {
            throw new Error(`Expected message to contain "${expectedMessage}" but got "${message}"`);
        }
        return this;
    }

    /**
     * Clicks the wishlist button
     * @returns {Promise<HomePage>}
     */
    async clickWishlistButton() {
        try {
            // Wait for button to be attached to DOM
            await this.waitForElement(this.wishlistButton, 'visible', 5000);
            
            // Scroll element into view using Playwright's built-in method
            await this.wishlistButton.scrollIntoViewIfNeeded();
            
            // Wait a moment for scroll to complete
            await this.page.waitForTimeout(500);
            
            // Try normal click
            await this.wishlistButton.click({ timeout: 5000 });
        } catch (error) {
            console.log('Normal click failed, using JavaScript click');
            // Fallback to JavaScript click which bypasses viewport checks
            await this.wishlistButton.evaluate(element => element.click());
        }
        
        // Wait for navigation to complete
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        return this;
    }
}

module.exports = { HomePage };