/**
 * Blog Page - Handles all blog page interactions
 * Encapsulates page elements and provides methods for user interactions
 */

const { BasePage } = require('./BasePage');

class BlogPage extends BasePage {
    constructor(page, baseUrl) {
        super(page, baseUrl);

        // Page heading - more flexible selectors
        this.pageHeading = page.locator('h1, h2, .page-title, [class*="heading"]').first();
        
        // Blog post elements - comprehensive selectors
        this.blogPosts = page.locator('.post, .blog-post, article, [class*="blog"], [class*="post-item"]');
        this.postTitles = page.locator('h3 a, h4 a, .post-title a, [class*="post-title"]');
        this.postAuthors = page.locator('.post-author, .author, [class*="author"], .posted-by');
        
        // Author filter/links
        this.authorLinks = page.locator('a').filter({ hasText: /mark jecno/i });
        this.authorFilter = page.locator('[class*="author"], [data-author]').filter({ hasText: /mark jecno/i });
        
        // Categories/filters
        this.categoryLinks = page.locator('.category, [class*="category"] a');
    }

    /**
     * Navigates to the blog page
     * @returns {Promise<BlogPage>}
     */
    async navigateToBlog() {
        await this.navigate('/index.php?route=extension/maza/blog/home');
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Gets the count of blog posts displayed
     * @returns {Promise<number>}
     */
    async getBlogPostCount() {
        return await this.getCount(this.blogPosts);
    }

    /**
     * Filters blog posts by the author's name
     * @param {string} authorName - Name of the author to filter by
     * @returns {Promise<BlogPage>}
     */
    async filterByAuthor(authorName) {
        const authorLink = this.page.locator(`a, [class*="author"]`).filter({ hasText: new RegExp(authorName, 'i') }).first();
        await this.waitForElement(authorLink, 'visible', 10000);
        await authorLink.click();
        await this.page.waitForLoadState('networkidle');
        console.log(`✅ Filtered by author: ${authorName}`);
        return this;
    }

    /**
     * Gets all post authors from visible posts
     * @returns {Promise<Array<string>>}
     */
    async getPostAuthors() {
        const authors = [];
        
        try {
            const count = await this.postAuthors.count();
            
            for (let i = 0; i < count; i++) {
                const authorText = await this.postAuthors.nth(i).textContent();
                if (authorText && authorText.trim()) {
                    // Clean up author text (remove "by", "posted by", etc.)
                    const cleanAuthor = authorText.replace(/by|posted by|author:/gi, '').trim();
                    authors.push(cleanAuthor);
                }
            }
        } catch (error) {
            console.log('Could not get post authors:', error.message);
        }
        
        return authors;
    }

    /**
     * Gets all post titles from visible posts
     * @returns {Promise<Array<string>>}
     */
    async getPostTitles() {
        const titles = [];
        
        try {
            const count = await this.postTitles.count();
            
            for (let i = 0; i < count; i++) {
                const title = await this.postTitles.nth(i).textContent();
                if (title && title.trim()) {
                    titles.push(title.trim());
                }
            }
        } catch (error) {
            console.log('Could not get post titles:', error.message);
        }
        
        return titles;
    }

    /**
     * Verifies all displayed posts are from the specified author
     * @param {string} expectedAuthor - Expected author's name
     * @returns {Promise<{ allFromAuthor: boolean, authors: string[], incorrectAuthors: string[] }>}
     */
    async verifyAllPostsFromAuthor(expectedAuthor) {
        const authors = await this.getPostAuthors();
        const incorrectAuthors = [];
        const normalizedExpected = expectedAuthor.toLowerCase().trim();
        
        for (const author of authors) {
            const normalizedAuthor = author.toLowerCase().trim();
            if (!normalizedAuthor.includes(normalizedExpected) && !normalizedExpected.includes(normalizedAuthor)) {
                incorrectAuthors.push(author);
            }
        }
        
        return {
            allFromAuthor: incorrectAuthors.length === 0,
            authors,
            incorrectAuthors
        };
    }

    /**
     * Checks if blog page is displayed
     * @returns {Promise<boolean>}
     */
    async isBlogPageDisplayed() {
        try {
            // Wait for page to load
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // Check multiple indicators that we're on blog page
            const currentUrl = this.page.url();
            const isBlogUrl = currentUrl.includes('blog') || currentUrl.includes('maza');
            
            if (isBlogUrl) {
                console.log('✅ Blog URL detected:', currentUrl);
                return true;
            }
            
            // Try to find blog-related content
            const hasBlogContent = await this.blogPosts.count() > 0;
            if (hasBlogContent) {
                console.log('✅ Blog posts detected');
                return true;
            }
            
            // Check for heading
            const hasHeading = await this.pageHeading.isVisible();
            console.log('Heading visible:', hasHeading);
            
            return hasHeading;
        } catch (error) {
            console.log('❌ Blog page check failed:', error.message);
            console.log('Current URL:', this.page.url());
            return false;
        }
    }
}

module.exports = { BlogPage };