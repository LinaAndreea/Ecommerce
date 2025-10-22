
class ShopByCategoryPage {
  constructor(page) {
    this.page = page;
    this.shopByCategoryButton = page.locator('text=Shop by Category');
  }

  async navigateToCategoryPage() {
    await this.shopByCategoryButton.click();
    await this.page.waitForSelector('#mz-component-1626147655', { state: 'visible' });
  }

  async getCurrentURL() {
    return this.page.url();
  }
}

module.exports = { ShopByCategoryPage };
