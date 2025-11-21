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
         this.bannerContainer = this.page.locator('#entry_212480'); 
        this.specialOffer= page.getByRole('link', { name: 'Special Hot', exact: true });
        this.reviewContainer = this.page.locator('#entry_216860');              
        this.reviewForm = this.page.locator('#form-review');                    
        this.reviewNameInput = this.page.locator('#input-name');               
        this.reviewTextInput = this.page.locator('#input-review');            
        this.ratingInputs = this.page.locator('input[name="rating"]');                 
        this.ratingOption = (value) => this.page.locator(`input[name="rating"][value="${value}"]`); 
        this.ratingById = (id) => this.page.locator(`#${id}`);                 
        this.submitReviewButton = this.page.locator('#button-review');       
        this.reviewWarning = this.page.locator('.alert.alert-danger');         
        this.reviewSuccessMessage = this.page.locator('.alert.alert-success'); 

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
    async addReview() {
        const name = 'Joe';
        const reviewText = 'I really enjoyed using this product. Highly recommend!';
        const rating = 5;
        const ratingLabel = this.page.locator(`label[for="rating-${rating}-216860"]`);


        // Ensure form is visible and scroll into view
        await this.reviewContainer.waitFor({ state: 'visible', timeout: 10000 });
        await this.reviewContainer.scrollIntoViewIfNeeded();

        await this.reviewNameInput.fill(name);
        await this.reviewTextInput.fill(reviewText);

        // Make sure we actually check the rating radio

       // Prefer clicking the label (labels are visible even when the input is hidden)
        if (await ratingLabel.count()) {
           await ratingLabel.scrollIntoViewIfNeeded();
            await ratingLabel.click();
        } else {
            // Fallback: set the radio checked directly in page context (bypasses visibility)
            await this.page.evaluate((val) => {
                const el = document.querySelector(`input[name="rating"][value="${val}"]`);
               if (el) el.checked = true;
            }, rating);
        }
        await this.submitReviewButton.click();

        // Wait for either success or validation warning (whichever appears first)
        const successPromise = this.reviewSuccessMessage.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'success').catch(() => null);
        const warningPromise = this.reviewWarning.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'warning').catch(() => null);

        const result = await Promise.race([successPromise, warningPromise]);

        if (result === 'success') {
            return await this.reviewSuccessMessage.textContent();
        } else if (result === 'warning') {
            throw new Error('Review not submitted: validation warning shown (e.g. rating missing)');
        } else {
            // Debug helpers if nothing appeared
            await this.page.screenshot({ path: 'debug-review.png', fullPage: true });
            const html = await this.page.content();
            require('fs').writeFileSync('debug-review.html', html);
            throw new Error('No confirmation appeared after submitting review. See debug-review.png / debug-review.html');
        }
    }
    async getReviewConfirmationMessage() {
        return await this.reviewSuccessMessage.textContent();
    
    }
    
    async navigate() {
        await super.navigate('/');
    }

    async getHomeNavText() {
        return await this.navHomeLink.textContent();
    }
}

module.exports = { HomePage };