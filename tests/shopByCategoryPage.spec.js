
const { test, expect } = require('@playwright/test');
const { ShopByCategoryPage } = require('./shopByCategoryPage');

test('Verify that clicking "Shop by Category" scrolls to the category section', async ({ page }) => {
  await page.goto('https://ecommerce-playground.lambdatest.io/index.php?route=product/category&path=30');

  const shopByCategoryPage = new ShopByCategoryPage(page);
  await shopByCategoryPage.navigateToCategoryPage();

  // Assert section is visible after scrolling
  await expect(page.locator('#mz-component-1626147655')).toBeVisible();
});