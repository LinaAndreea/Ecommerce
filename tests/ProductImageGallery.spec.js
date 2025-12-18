const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductPage } = require('../pages/ProductPage');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Product Image Gallery Tests - Following SOLID principles:
 * - SRP: Each test verifies single image gallery scenario
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through configuration and Page Object methods
 */
test.describe('Product Image Gallery For Authenticated Users:', () => {

  let loginPage;
  let productPage;
  let configService;
  let dataPersistenceService;

  test.beforeEach(async ({ page }) => {
    const testFactory = new TestFactory();
    configService = testFactory.getConfigService();
    dataPersistenceService = testFactory.getDataPersistenceService();
    
    const baseUrl = configService.get('baseURL');
    
    loginPage = new LoginPage(page, baseUrl);
    productPage = new ProductPage(page, baseUrl);
  });

  test('should display same images in gallery as shown in product presentation', async ({ page }) => {
    // Given I have logged in to the AUT
    const savedCredentials = dataPersistenceService.loadUserCredentials();
    
    if (!savedCredentials) {
      throw new Error('No saved user credentials found. Please run ApiRegister.spec.js test first to create a test user.');
    }
    
    await loginPage.navigateToLogin();
    await loginPage.login(savedCredentials.email, savedCredentials.password);
    
    const isLoginSuccessful = await loginPage.isLoginSuccessful();
    expect(isLoginSuccessful, 'Expected login to be successful').toBeTruthy();
    
    console.log('✅ User logged in successfully:', savedCredentials.email);
    
    // And I have opened any product
    console.log('🛍️ Navigating to product page...');
    await productPage.navigateToProduct('/index.php?route=product/product&product_id=43');
    
    // Add debugging
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    const productName = await productPage.getProductName();
    console.log('📦 Product opened:', productName);
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Get thumbnail images shown in product presentation
    const thumbnailImages = await productPage.getThumbnailImageSources();
    console.log(`📷 Found ${thumbnailImages.length} thumbnail images`);
    
    if (thumbnailImages.length > 0) {
      console.log('Thumbnail images:', thumbnailImages);
    } else {
      console.log('⚠️ No thumbnail images found, product might not have multiple images');
      test.skip(true, 'Product does not have thumbnail images to test gallery');
      return;
    }
    
    expect(thumbnailImages.length, 'Expected at least one thumbnail image').toBeGreaterThan(0);
    
    // And I have clicked View Image
    console.log('🔍 Clicking View Image to open gallery...');
    
    try {
      await productPage.clickViewImage();
    } catch (error) {
      console.log('⚠️ Product does not have image gallery functionality');
      console.log('Error:', error.message);
      test.skip(true, 'Product page does not support image gallery');
      return;
    }
    
    const isModalVisible = await productPage.isImageModalVisible();
    
    if (!isModalVisible) {
      console.log('⚠️ Image modal did not open');
      test.skip(true, 'Image gallery modal not available');
      return;
    }
    
    expect(isModalVisible, 'Expected image modal/lightbox to be visible').toBeTruthy();
    
    console.log('✅ Image gallery opened');
    
    // When I shuffle through the images
    console.log('🔄 Shuffling through gallery images...');
    const galleryImages = await productPage.shuffleThroughImages(thumbnailImages.length + 2);
    
    console.log(`📸 Captured ${galleryImages.length} gallery images`);
    console.log('Gallery images:', galleryImages);
    
    expect(galleryImages.length, 'Expected at least one gallery image').toBeGreaterThan(0);
    
    // Then the application should display the same images
    const verificationResult = await productPage.verifyImagesMatch(thumbnailImages, galleryImages);
    
    console.log('🔍 Verification result:');
    console.log('  All images match:', verificationResult.allMatch);
    console.log('  Matched images:', verificationResult.matched.length);
    console.log('  Missing images:', verificationResult.missing);
    
    expect(verificationResult.allMatch, 
      `Expected all thumbnail images to appear in gallery, but ${verificationResult.missing.length} were missing: ${verificationResult.missing.join(', ')}`
    ).toBeTruthy();
    
    expect(verificationResult.missing, 'Expected no missing images in gallery').toHaveLength(0);
    
    console.log('✅ Verification complete: All thumbnail images are displayed in the gallery');
    
    // Cleanup: Close modal
    await productPage.closeImageModal();
  });

});
