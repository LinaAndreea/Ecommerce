const { test, expect } = require('@playwright/test');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Home Page Tests - Following SOLID principles:
 * - SRP: Each test focuses on single behavior
 * - DIP: Depends on TestFactory abstraction
 * - OCP: Extensible through configuration
 */
test.describe('Home Page Navigation Tests', () => {
    let homePage;
    let testFactory;

    test.beforeEach(async ({ page }) => {
        // Dependency injection following DIP
        testFactory = new TestFactory();
        homePage = testFactory.createHomePage(page);
        await homePage.navigate();
    });

    test('should display correct text in home navigation link', async () => {
        // Single responsibility: verify home link text
        await expect(homePage.navHomeLink).toHaveText('Home');
    });

    test('should navigate to home page successfully', async () => {
        // Single responsibility: verify navigation behavior
        await homePage.navigate();
        const currentUrl = await homePage.page.url();
        const configService = testFactory.getConfigService();
        const expectedBaseUrl = configService.get('baseURL');
        
        expect(currentUrl).toContain(expectedBaseUrl);
    });

   
    test('should display featured product carousel with exactly three slides', async () => {
        console.log('carouselSelector:', homePage.featuredCarouselSelector);
        console.log('slidesSelector:', homePage.featuredCarouselSlidesSelector);

        const isCarouselVisible = await homePage.isFeaturedCarouselVisible();
        console.log('isCarouselVisible ->', isCarouselVisible);
        expect(isCarouselVisible).toBe(true);

        await homePage.waitForCarouselSlides();

        const slideCount = await homePage.getFeaturedCarouselSlideCount();
        console.log('slideCount ->', slideCount);
        expect(slideCount).toBe(3);
});

test('should display a confirmation message that review was added', async () => {
        const currentUrl = await homePage.page.url();
        const specialOffer = homePage.specialOffer;
         expect(specialOffer).toBeVisible();
         console.log( homePage.specialOffer);
        await specialOffer.click();
    

        // Wait for navigation to complete
        await homePage.page.waitForLoadState('networkidle');

        // Verify we are on the correct product page
        const newUrl = await homePage.page.url();
        expect(newUrl).not.toBe(currentUrl);

        const bannerContainer = homePage.bannerContainer;
        await bannerContainer.waitFor({ state: 'visible', timeout: 5000 });
        console.log('Navigated to product page via Special Hot link.'); 
        await bannerContainer.click();
        // Add a review
        await homePage.addReview('Great Product', 'I really enjoyed using this product. Highly recommend!', 5);

        // Verify confirmation message
        const confirmationMessage = await homePage.getReviewConfirmationMessage();
        expect(confirmationMessage).toContain('Thank you for your review.');    
    });


    });
