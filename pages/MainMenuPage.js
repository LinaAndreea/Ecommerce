const { BasePage } = require('./BasePage');

class MainMenuPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Main menu trigger - the "Mega Menu" dropdown button
    this.mainMenuButton = page.locator('a.dropdown-toggle').filter({ hasText: 'Mega Menu' });
    
    // Category locators - using h3.design-title with exact text match
    this.mobilesCategory = page.locator('h3.design-title', { hasText: 'Mobiles' });
    this.accessoriesCategory = page.locator('h3.design-title', { hasText: 'Accessories' });
    this.computersCategory = page.locator('h3.design-title', { hasText: 'Computers' });
    this.laptopsCategory = page.locator('h3.design-title', { hasText: 'Laptops' });
    this.smartWearablesCategory = page.locator('h3.design-title', { hasText: 'Smart Wearable' });
    this.soundSystemCategory = page.locator('h3.design-title', { hasText: 'Sound System' });
  }

  async hoverMainMenu() {
    await this.mainMenuButton.hover();
    await this.page.waitForTimeout(500); // Wait for dropdown animation
    return this;
  }

  async verifyAllCategoriesVisible() {
    const categories = [
      this.mobilesCategory,
      this.accessoriesCategory,
      this.computersCategory,
      this.laptopsCategory,
      this.smartWearablesCategory,
      this.soundSystemCategory
    ];

    for (const category of categories) {
      await category.waitFor({ state: 'visible', timeout: 5000 });
    }
    return this;
  }
}

module.exports = { MainMenuPage };
