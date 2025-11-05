
const { BasePage } = require('./BasePage');

/**
 * Shop By Category Page - Single Responsibility: Handle category page interactions
 * Follows LSP by properly extending BasePage
 */
class ShopByCategoryPage extends BasePage {
    constructor(page, configService) {
        super(page, configService);
        this.shopByCategoryButton = this.getLocator('category.shopButton');
        this.categorySection = this.getLocator('category.categorySection');
        this.categoryItems = this.page.locator(this.config.get('selectors.category.categoryItems'));
        this.categoryNames = this.page.locator(this.config.get('selectors.category.categoryNames'));
        this.categoryList = this.page.locator(this.config.get('selectors.category.categoryList'));
    }

    async navigateToCategoryPage() {
        await this.navigate('/index.php?route=product/category&path=30');
    }

    async clickShopByCategoryButton() {
        await this.shopByCategoryButton.click();
        await this.waitForSelector(this.config.get('selectors.category.categorySection'));
    }

    async isCategorySectionVisible() {
        return await this.categorySection.isVisible();
    }

    async getCurrentURL() {
        return this.page.url();
    }

    async getCategoryComponents() {
        // Single responsibility: retrieve all category components
        await this.waitForSelector(this.config.get('selectors.category.categorySection'));
        
        // Try multiple selectors to find category components
        const categoryItems = await this.categoryItems.all();
        if (categoryItems.length > 0) {
            return categoryItems;
        }
        
        // Fallback: look for any visible elements within the category section
        const sectionElements = await this.categorySection.locator('*').filter({ hasText: /./ }).all();
        return sectionElements.filter(async (element) => await element.isVisible());
    }

    async getCategoryNames() {
        // Single responsibility: extract category names from components
        const components = await this.getCategoryComponents();
        const names = [];
        
        for (const component of components) {
            try {
                // Try to get text from category name selectors
                const nameElement = component.locator(this.config.get('selectors.category.categoryNames')).first();
                if (await nameElement.isVisible()) {
                    const name = await nameElement.textContent();
                    if (name && name.trim()) {
                        names.push(name.trim());
                    }
                } else {
                    // Fallback: get text directly from the component
                    const componentText = await component.textContent();
                    if (componentText && componentText.trim()) {
                        names.push(componentText.trim());
                    }
                }
            } catch (error) {
                // Skip components that can't be read
                continue;
            }
        }
        
        return names;
    }

    async validateCategoryComponentsDisplay() {
        // Single responsibility: validate that category components are properly displayed
        const components = await this.getCategoryComponents();
        const names = await this.getCategoryNames();
        
        return {
            componentCount: components.length,
            categoryNames: names,
            hasValidComponents: components.length > 0,
            hasValidNames: names.length > 0,
            componentsWithNames: names.filter(name => name.length > 2) // Filter out very short names
        };
    }
}

module.exports = { ShopByCategoryPage };
