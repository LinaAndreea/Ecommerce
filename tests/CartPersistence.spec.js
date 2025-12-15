const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { MyAccountPage } = require('../pages/MyAccountPage');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Cart Persistence Tests - Following SOLID principles:
 * - SRP: Each test verifies single cart persistence scenario
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through configuration and Page Object methods
 */
test.describe('Shopping Cart Persistence For Authenticated Users:', () => {

  let loginPage;
  let productPage;
  let cartPage;
  let myAccountPage;
  let configService;
  let dataPersistenceService;
  let addedProducts;

  test.beforeEach(async ({ page }) => {
    const testFactory = new TestFactory();
    configService = testFactory.getConfigService();
    dataPersistenceService = testFactory.getDataPersistenceService();
    
    const baseUrl = configService.get('baseURL');
    
    loginPage = new LoginPage(page, baseUrl);
    productPage = new ProductPage(page, baseUrl);
    cartPage = new CartPage(page, baseUrl);
    myAccountPage = new MyAccountPage(page, baseUrl);
    
    addedProducts = [];
  });

  test('should persist cart items after user re-login', async ({ page }) => {
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
    
    // And I have added at least 2 items in the shopping cart
    console.log('🛒 Adding products to cart...');
    
    // Add first product (example: laptop)
    await productPage.navigateToProduct('/index.php?route=product/product&product_id=43');
    const product1Name = await productPage.getProductName();
    await productPage.addToCart();
    addedProducts.push(product1Name);
    console.log('✅ Added product 1:', product1Name);
    
    // Add second product (example: MacBook)
    await productPage.navigateToProduct('/index.php?route=product/product&product_id=44');
    const product2Name = await productPage.getProductName();
    await productPage.addToCart();
    addedProducts.push(product2Name);
    console.log('✅ Added product 2:', product2Name);
    
    // Verify cart has 2 items before logout
    await cartPage.navigateToCart();
    const cartItemsBeforeLogout = await cartPage.getCartItemCount();
    console.log(`📊 Cart items before logout: ${cartItemsBeforeLogout}`);
    
    expect(cartItemsBeforeLogout, 'Expected at least 2 items in cart before logout').toBeGreaterThanOrEqual(2);
    
    // When I relog (logout and login again)
    console.log('🔄 Logging out...');
    await myAccountPage.navigateToMyAccount();
    await myAccountPage.logout();
    
    console.log('🔑 Logging back in...');
    await loginPage.navigateToLogin();
    await loginPage.login(savedCredentials.email, savedCredentials.password);
    
    const isReloginSuccessful = await loginPage.isLoginSuccessful();
    expect(isReloginSuccessful, 'Expected re-login to be successful').toBeTruthy();
    
    console.log('✅ User re-logged in successfully');
    
    // Then the shopping cart should still have the items added in the cart
    await cartPage.navigateToCart();
    
    const cartItemsAfterRelogin = await cartPage.getCartItemCount();
    console.log(`📊 Cart items after re-login: ${cartItemsAfterRelogin}`);
    
    expect(cartItemsAfterRelogin, 'Expected cart to still have at least 2 items after re-login').toBeGreaterThanOrEqual(2);
    
    // Verify the same products are still in cart
    const verificationResult = await cartPage.verifyProductsInCart(addedProducts);
    
    console.log('🔍 Verification result:');
    console.log('  Found products:', verificationResult.foundProducts);
    console.log('  Missing products:', verificationResult.missingProducts);
    
    expect(verificationResult.allFound, 'Expected all added products to persist in cart after re-login').toBeTruthy();
    expect(verificationResult.missingProducts, 'Expected no products to be missing from cart').toHaveLength(0);
    
    console.log('✅ Cart persistence verified: All products remained in cart after re-login');
  });

});
