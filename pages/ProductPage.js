const { BasePage } = require('./BasePage');

/**
 * Product Page - Handles individual product page interactions
 * Follows Single Responsibility Principle: Only manages product page actions
 * @extends BasePage
 */
class ProductPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Product information locators
        this.productTitle = page.locator('h1').first();
        this.productPrice = page.locator('.price-new').first();
        
        // Image gallery locators - Based on actual HTML structure
        this.imageGallery = page.locator('#image-gallery-216811, #image-gallery-216812').first();
        this.mainImageLink = page.locator('.image-thumb a.mfp-image').first();
        this.thumbnailImages = page.locator('.image-additional .swiper-slide a.mfp-image img');
        
        // Magnific Popup lightbox - The actual modal that opens
        this.magnificPopup = page.locator('.mfp-wrap, .mfp-container');
        this.magnificPopupImage = page.locator('.mfp-img, .mfp-figure img');
        
        // Add to cart section
        this.quantityInput = page.locator('input[name="quantity"]').first();
        this.addToCartButton = page.locator('#button-cart, .button-cart').first();
        
        // Success notification
        this.successAlert = page.locator('.alert-success').first();
    }

    /**
     * Navigates to a specific product page
     * @param {string} productPath - Product URL path or ID
     * @returns {Promise<ProductPage>}
     */
    async navigateToProduct(productPath) {
        await this.navigate(productPath);
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets the product name
     * @returns {Promise<string>}
     */
    async getProductName() {
        await this.waitForElement(this.productTitle, 'visible', 5000);
        return await this.getText(this.productTitle);
    }

    /**
     * Gets all thumbnail image sources
     * @returns {Promise<Array<string>>}
     */
    async getThumbnailImageSources() {
        const sources = [];
        
        try {
            const count = await this.thumbnailImages.count();
            console.log(`Found ${count} thumbnail images`);
            
            for (let i = 0; i < count; i++) {
                const src = await this.thumbnailImages.nth(i).getAttribute('src');
                if (src) {
                    const normalizedSrc = this.normalizeImageUrl(src);
                    sources.push(normalizedSrc);
                }
            }
        } catch (error) {
            console.log('Could not get thumbnail sources:', error.message);
        }
        
        return sources;
    }

    /**
     * Clicks View Image button to open gallery
     * @returns {Promise<ProductPage>}
     */
    async clickViewImage() {
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await this.page.waitForTimeout(1000);
            
            // Click the main image link with mfp-image class
            const imageLink = this.mainImageLink;
            const hasLink = await imageLink.count();
            
            if (hasLink > 0) {
                await imageLink.scrollIntoViewIfNeeded({ timeout: 5000 });
                await this.page.waitForTimeout(500);
                await imageLink.click();
                console.log('✅ Clicked main image link');
                
                // Wait for Magnific Popup to open
                await this.page.waitForSelector('.mfp-wrap', { state: 'visible', timeout: 5000 });
                await this.page.waitForTimeout(1000);
            } else {
                throw new Error('Main image link not found');
            }
        } catch (error) {
            console.log('❌ Error opening image gallery:', error.message);
            throw error;
        }
        
        return this;
    }

    /**
     * Shuffles through images in modal gallery
     * @param {number} count - Number of times to navigate
     * @returns {Promise<Array<string>>}
     */
    async shuffleThroughImages(count = 5) {
        const galleryImages = [];
        
        try {
            // Wait for magnific popup to be visible
            await this.page.waitForSelector('.mfp-wrap', { state: 'visible', timeout: 5000 });
            
            for (let i = 0; i < count; i++) {
                // Get current image in magnific popup
                const imgElement = await this.page.locator('.mfp-img').first();
                const src = await imgElement.getAttribute('src');
                
                if (src) {
                    const normalizedSrc = this.normalizeImageUrl(src);
                    if (!galleryImages.includes(normalizedSrc)) {
                        galleryImages.push(normalizedSrc);
                        console.log(`Captured image ${i + 1}: ${normalizedSrc}`);
                    }
                }
                
                // Try to click next - look for various next button selectors
                try {
                    const nextButton = this.page.locator('.mfp-arrow-right, button.mfp-arrow-right, .mfp-next').first();
                    const nextExists = await nextButton.count();
                    
                    if (nextExists > 0 && await nextButton.isVisible()) {
                        await nextButton.click({ timeout: 2000 });
                        await this.page.waitForTimeout(800);
                    } else {
                        console.log('No next button or reached end of gallery');
                        break;
                    }
                } catch (error) {
                    console.log('No more images');
                    break;
                }
            }
        } catch (error) {
            console.log('Error shuffling through images:', error.message);
        }
        
        return galleryImages;
    }

    /**
     * Normalizes image URL by removing size parameters
     * @param {string} url - Image URL
     * @returns {string} Normalized URL
     */
    normalizeImageUrl(url) {
        // Remove cache/size parameters (e.g., -500x500, -228x228)
        return url.replace(/-\d+x\d+/, '').split('?')[0];
    }

    /**
     * Verifies gallery images match thumbnail images
     * @param {Array<string>} thumbnailImages - Thumbnail image sources
     * @param {Array<string>} galleryImages - Gallery image sources
     * @returns {Promise<{allMatch: boolean, matched: Array<string>, missing: Array<string>}>}
     */
    async verifyImagesMatch(thumbnailImages, galleryImages) {
        const matched = [];
        const missing = [];
        
        for (const thumbSrc of thumbnailImages) {
            const found = galleryImages.some(gallerySrc => 
                gallerySrc.includes(thumbSrc) || thumbSrc.includes(gallerySrc)
            );
            
            if (found) {
                matched.push(thumbSrc);
            } else {
                missing.push(thumbSrc);
            }
        }
        
        return {
            allMatch: missing.length === 0,
            matched,
            missing
        };
    }

    /**
     * Closes image modal/lightbox
     * @returns {Promise<ProductPage>}
     */
    async closeImageModal() {
        try {
            // Close Magnific Popup
            const closeButton = this.page.locator('button.mz-modal-close, .mfp-close').first();
            await closeButton.click({ timeout: 3000 });
        } catch (error) {
            // Fallback: press Escape key
            await this.page.keyboard.press('Escape');
        }
        
        await this.page.waitForTimeout(500);
        return this;
    }

    /**
     * Checks if image modal is visible
     * @returns {Promise<boolean>}
     */
    async isImageModalVisible() {
        try {
            const modal = this.page.locator('.mfp-wrap, .mfp-container').first();
            return await modal.isVisible();
        } catch (error) {
            return false;
        }
    }

    /**
     * Adds product to cart
     * @returns {Promise<ProductPage>}
     */
    async addToCart() {
        await this.waitForElement(this.addToCartButton, 'visible', 5000);
        await this.addToCartButton.click();
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Verifies success message is displayed after adding to cart
     * @returns {Promise<boolean>}
     */
    async isAddedToCartSuccessfully() {
        try {
            await this.waitForElement(this.successAlert, 'visible', 5000);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { ProductPage };
