const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/loginPage');
const { TestFactory } = require('../.github/factories/TestFactory');

test.describe('Returns Management', () => {
  let loginPage;
  let configService;

  test.beforeEach(async ({ page }) => {
    const testFactory = new TestFactory();
    configService = testFactory.getConfigService();
    const baseUrl = configService.get('baseURL');
    loginPage = new LoginPage(page, baseUrl);
  });

  test('User can return an item and view it on Returns page', async ({ page }) => {
    // Given: User logs in to the AUT
    await loginPage.navigateToLogin();
    await loginPage.login('user@example.com', 'password123');
    
    // Navigate to Software category and filter by "in stock"
    await page.goto('/categories/software');
    await page.click('[data-testid="filter-in-stock"]');
    await page.waitForSelector('[data-testid="add-to-cart"]');
    
    // And: Create order with 2 different products
    const productButtons = page.locator('[data-testid="add-to-cart"]');
    await productButtons.nth(0).click();
    await page.waitForTimeout(500);
    await productButtons.nth(1).click();
    
    // Proceed to checkout and place order
    await page.click('[data-testid="checkout"]');
    await page.waitForURL('**/checkout');
    await page.click('[data-testid="place-order"]');
    await page.waitForURL('**/orders/*');
    
    // And: View order to ensure it is correct
    const orderItems = page.locator('[data-testid="order-item"]');
    await expect(orderItems).toHaveCount(2);
    
    // When: Return one of the items in the order
    await page.click('[data-testid="return-item"]');
    await page.click('[data-testid="confirm-return-button"]');
    await page.waitForURL('**/returns/*');
    
    // And: Navigate to the "Returns" page
    await page.goto('/returns');
    await page.waitForSelector('[data-testid="returned-item"]');
    
    // Then: Page should display the item returned
    const returnedItem = page.locator('[data-testid="returned-item"]');
    await expect(returnedItem).toBeVisible();
    await expect(returnedItem).toContainText('Pending');
  });
});
