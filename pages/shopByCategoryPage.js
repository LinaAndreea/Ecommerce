const { BasePage } = require('./basePage');

/**
 * Shop By Category Page - Handles category page interactions
 * Encapsulates category-specific locators and interactions
 */
class ShopByCategoryPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);
        
        // Category page elements - More generic selectors
        // The "Shop by Category" button might be on home page, not category page
        this.shopByCategoryButton = page.locator(
            'a:has-text("Shop by Category"), ' +
            'a[class*="category"], ' +
            'button:has-text("Category"), ' +
            'button[class*="category"]'
        ).first();
        
        // Category section - look for any navigation with categories
        // This includes sidebars, menus, and navigation lists
        this.categorySection = page.locator(
            '[class*="category-section"], ' +
            '[class*="categories"], ' +
            'aside[class*="category"], ' +
            'aside[class*="menu"], ' +
            'nav[class*="category"], ' +
            '.sidebar, ' +
            '.sidebar-left, ' +
            'aside'
        ).first();
        
        // Category items - any links or list items that represent categories
        this.categoryItems = page.locator(
            '[class*="category-item"], ' +
            '[class*="category-box"], ' +
            'li[class*="category"], ' +
            '.category-link, ' +
            'aside a, ' +
            'aside li, ' +
            'nav a'
        );
        
        this.categoryNames = page.locator(
            '[class*="category-name"], ' +
            'li > a, ' +
            '.category-title, ' +
            'span[class*="name"], ' +
            'a[class*="category"]'
        );
        
        this.categoryList = page.locator('ul[class*="category"], [class*="category-list"], aside ul, .nav');
    }

    /**
     * Navigates to the category page
     * @returns {Promise<ShopByCategoryPage>}
     */
    async navigateToCategoryPage() {
        await this.navigate('/index.php?route=product/category&path=30');
        return this;
    }

    /**
     * Clicks the shop by category button
     * @returns {Promise<ShopByCategoryPage>}
     */
    async clickShopByCategoryButton() {
        try {
            // Check if button exists
            const buttonCount = await this.shopByCategoryButton.count();
            if (buttonCount > 0) {
                await this.shopByCategoryButton.click();
                await this.page.waitForTimeout(500);
            }
            
            // Wait for category section to become visible (if button was clicked or already visible)
            try {
                await this.waitForElement(this.categorySection, 'visible', 3000);
            } catch (error) {
                console.log('Category section not visible after button click, but continuing...');
            }
        } catch (error) {
            console.log('Error clicking shop by category button:', error.message);
        }
        return this;
    }

    /**
     * Checks if category section is visible
     * @returns {Promise<boolean>}
     */
    async isCategorySectionVisible() {
        try {
            // Check if the dedicated category section is visible
            const sectionCount = await this.categorySection.count();
            if (sectionCount > 0) {
                return await this.isVisible(this.categorySection);
            }
            
            // Fallback: check if there are any visible category items anywhere on page
            const itemCount = await this.categoryItems.count();
            if (itemCount > 0) {
                const firstItem = this.categoryItems.first();
                return await this.isVisible(firstItem);
            }
            
            // Final fallback: look for any navigation with category links
            const navCategories = this.page.locator('nav a, aside a, .sidebar a').filter({ hasText: /category|categories/i });
            const navCount = await navCategories.count();
            return navCount > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets the current URL
     * @returns {string}
     */
    async getCurrentURL() {
        return this.page.url();
    }

    /**
     * Gets all category components
     * @returns {Promise<Array>}
     */
    async getCategoryComponents() {
        try {
            // Wait for section to be visible
            const sectionCount = await this.categorySection.count();
            if (sectionCount > 0) {
                try {
                    await this.waitForElement(this.categorySection, 'visible', 2000);
                } catch (error) {
                    // Section might not need waiting
                }
            }
            
            // First try: look for items with category-related classes
            let categoryItems = await this.categoryItems.all();
            if (categoryItems.length > 0) {
                return categoryItems;
            }
            
            // Second try: get all links in the category section or sidebar
            const sectionLinks = sectionCount > 0 
                ? await this.categorySection.locator('a, li').all()
                : await this.page.locator('aside a, aside li, [class*="sidebar"] a, [class*="sidebar"] li').all();
            
            if (sectionLinks.length > 0) {
                // Filter for visible items with text
                const visibleItems = [];
                for (const item of sectionLinks) {
                    try {
                        if (await item.isVisible()) {
                            const text = await item.textContent();
                            if (text && text.trim().length > 0) {
                                visibleItems.push(item);
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
                return visibleItems;
            }
            
            // Third try: get all elements with text in the category section
            if (sectionCount > 0) {
                const allElements = await this.categorySection.locator('*').all();
                const visibleElements = [];
                for (const element of allElements) {
                    try {
                        if (await element.isVisible()) {
                            const text = await element.textContent();
                            if (text && text.trim().length > 2) {
                                visibleElements.push(element);
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                }
                return visibleElements;
            }
            
            return [];
        } catch (error) {
            console.log('Error getting category components:', error.message);
            return [];
        }
    }

    /**
     * Gets all category names
     * @returns {Promise<Array<string>>}
     */
    async getCategoryNames() {
        try {
            const components = await this.getCategoryComponents();
            const names = [];
            
            for (const component of components) {
                try {
                    // Try to find category name in specific elements first
                    const nameElement = component.locator('[data-testid="category-name"], .category-name, [class*="category-name"]').first();
                    const nameCount = await nameElement.count();
                    
                    if (nameCount > 0 && await nameElement.isVisible()) {
                        const name = await this.getText(nameElement);
                        if (name && name.trim().length > 0) {
                            names.push(name.trim());
                            continue;
                        }
                    }
                    
                    // Fallback: get text from the component itself
                    const componentText = await this.getText(component);
                    if (componentText && componentText.trim().length > 2) {
                        // Clean up text - remove extra whitespace and newlines
                        const cleanText = componentText.trim().split('\n')[0].trim();
                        if (cleanText.length > 2 && !names.includes(cleanText)) {
                            names.push(cleanText);
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return names;
        } catch (error) {
            console.log('Error getting category names:', error.message);
            return [];
        }
    }

    /**
     * Validates category components display
     * @returns {Promise<Object>} Validation result
     */
    async validateCategoryComponentsDisplay() {
        const components = await this.getCategoryComponents();
        const names = await this.getCategoryNames();
        
        return {
            componentCount: components.length,
            categoryNames: names,
            hasValidComponents: components.length > 0,
            hasValidNames: names.length > 0,
            componentsWithNames: names.filter(name => name.length > 2)
        };
    }
}

module.exports = { ShopByCategoryPage };
