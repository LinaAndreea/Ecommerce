const { test, expect } = require('@playwright/test');
const { ProductFilterPage } = require('../pages/ProductFilterPage');
const { LoginPage } = require('../pages/LoginPage');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Product Filter Tests - Following SOLID principles:
 * - SRP: Each test verifies single filter combination
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through configuration and Page Object methods
 */
test.describe('Product Filter For Authenticated Users:', () => {

  let productFilterPage;
  let loginPage;
  let configService;
  let dataPersistenceService;

  test.beforeEach(async ({ page }) => {
    // Dependency injection following DIP
    const testFactory = new TestFactory();
    configService = testFactory.getConfigService();
    dataPersistenceService = testFactory.getDataPersistenceService();
    
    const baseUrl = configService.get('baseURL');
    
    productFilterPage = new ProductFilterPage(page, baseUrl);
    loginPage = new LoginPage(page, baseUrl);
    
    // Given I have logged in to the AUT
    const savedCredentials = dataPersistenceService.loadUserCredentials();
    
    // Ensure credentials exist (fail fast if registration hasn't been run)
    if (!savedCredentials) {
      throw new Error('No saved user credentials found. Please run ApiRegister.spec.js test first to create a test user.');
    }
    
    // Perform login
    await loginPage.navigateToLogin();
    await loginPage.login(savedCredentials.email, savedCredentials.password);
    
    // Verify login was successful
    const isLoginSuccessful = await loginPage.isLoginSuccessful();
    expect(isLoginSuccessful).toBeTruthy();
    
    console.log('✅ User logged in successfully:', savedCredentials.email);
    
    // Navigate to product filter/search page
    await productFilterPage.navigate();
  });

  test('should display products matching category and price range filters', async ({ page }) => {
    // When I perform a search using valid filter combination 1: Category + Price Range
    const filterCombination = {
      category: 'Components',
      minPrice: '100',
      maxPrice: '500'
    };
    
    console.log('Applying filter combination 1:', filterCombination);
    
    await productFilterPage.applyFilters(filterCombination);
    
    // Wait for AJAX filters to complete
    await page.waitForTimeout(2000);
    
    // Then the application should display the products that match the selected filters
    const hasProducts = await productFilterPage.hasProducts();
    expect(hasProducts, 'Expected products to be displayed after applying filters').toBeTruthy();
    
    const productCount = await productFilterPage.getProductCount();
    console.log(`✅ Found ${productCount} products matching filters`);
    
    expect(productCount).toBeGreaterThan(0);
    
    // Verify products are displayed in the grid
    await expect(productFilterPage.productGrid).toBeVisible();
  });

  test('should display products matching category and brand filters', async ({ page }) => {
    // When I perform a search using valid filter combination 2: Category + Brand
    const filterCombination = {
      category: 'Cameras',
      brands: ['Canon']
    };
    
    console.log('Applying filter combination 2:', filterCombination);
    
    await productFilterPage.applyFilters(filterCombination);
    
    // Wait for AJAX filters to complete
    await page.waitForTimeout(2000);
    
    // Then the application should display the products that match the selected filters
    const hasProducts = await productFilterPage.hasProducts();
    expect(hasProducts, 'Expected products to be displayed for selected category and brand').toBeTruthy();
    
    const productCount = await productFilterPage.getProductCount();
    const productNames = await productFilterPage.getProductNames();
    
    console.log(`✅ Found ${productCount} products matching filters`);
    
    // Only log product names if we have a reasonable count
    if (productCount > 0 && productCount <= 20) {
      console.log('Products:', productNames.slice(0, 5));
    } else if (productCount > 20) {
      console.log('Products (first 5):', productNames.slice(0, 5), `... and ${productCount - 5} more`);
    }
    
    expect(productCount).toBeGreaterThan(0);
    
    // Verify products grid is visible
    await expect(productFilterPage.productGrid).toBeVisible();
  });

  test('should display products matching search term and category', async ({ page }) => {
    // When I perform a search using valid filter combination 3: Search Term + Category
    const filterCombination = {
      search: 'canon',
      category: 'Cameras',
      searchInDescription: true
    };
    
    console.log('Applying filter combination 3:', filterCombination);
    
    await productFilterPage.applyFilters(filterCombination);
    await page.waitForTimeout(2000);
    
    // Then the application should display the products that match the selected filters
    const hasProducts = await productFilterPage.hasProducts();
    expect(hasProducts, 'Expected products to be displayed matching search term and category').toBeTruthy();
    
    const productCount = await productFilterPage.getProductCount();
    const productNames = await productFilterPage.getProductNames();
    
    console.log(`✅ Found ${productCount} products matching filters`);
    
    // Only log product names if we have results
    if (productCount > 0 && productCount <= 20) {
      console.log('Products:', productNames.slice(0, 5));
    } else if (productCount > 20) {
      console.log('Products (first 5):', productNames.slice(0, 5), `... and ${productCount - 5} more`);
    }
    
    expect(productCount).toBeGreaterThan(0);
    await expect(productFilterPage.productGrid).toBeVisible();
  });

});