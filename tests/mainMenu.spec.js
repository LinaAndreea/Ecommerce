const { test, expect } = require('@playwright/test');
const { MainMenuPage } = require('../pages/mainMenuPage');

test.describe('Main Menu - Hover Behavior', () => {
  let mainMenuInstance;

  test.beforeEach(async ({ page }) => {
    const baseUrl = 'https://ecommerce-playground.lambdatest.io';
    mainMenuInstance = new MainMenuPage(page, baseUrl);
    await mainMenuInstance.navigate('/'); // Use BasePage method
  });

  test('should display all categories when hovering over Main Menu', async () => {
    await mainMenuInstance.hoverMainMenu();
    await mainMenuInstance.verifyAllCategoriesVisible();
    // Assertions stay in test
    await expect(mainMenuInstance.mobilesCategory).toBeVisible();
    await expect(mainMenuInstance.accessoriesCategory).toBeVisible();
  });
});
