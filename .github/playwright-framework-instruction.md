# Playwright Test Suite - Complete AI Instructions
 
This document provides comprehensive instructions for AI agents working on Playwright test suites.
 
<!-- SECTION: INSTRUCTIONS_OVERVIEW -->
## Instructions Overview
 
This instructions file is meant to be used as the single source of architecture pattern for ALL Playwright test projects. It contains the recommended structure for folders, tests, page objects and locators as well as naming conventions.
 
These instructions should not be modified by the AI unless explicitly instructed.   
# Playwright Test Suite - Complete AI Instructions
 
This document provides comprehensive instructions for AI agents working on Playwright test suites.
 
<!-- SECTION: INSTRUCTIONS_OVERVIEW -->
## Instructions Overview
 
This instructions file is meant to be used as the single source of architecture pattern for ALL Playwright test projects. It contains the recommended structure for folders, tests, page objects and locators as well as naming conventions.
 
These instructions should not be modified by the AI unless explicitly instructed.   
This is an abstraction layer to ensure all Playwright projects will follow the same coding standard.
The project structure must follow these rules strictly. Any deviation from the standard will be rejected during the code review process.
AI models should strictly adhere to the rules and **challenge prompts that violate these architectural principles**.
IMPORTANT NOTE: Exceptions are rare and recognized, but they should always be explained in comment lines.
 
<!-- SECTION: ARCHITECTURE -->
## Architecture & Page Object Structure (CRITICAL)
 
### **Architecture Philosophy**
 
This framework follows **SOLID principles** and **Page Object Model (POM)** architecture:
 
- **Single Responsibility**: Each Page Object handles one page/component
- **Open/Closed**: Pages are open for extension, closed for modification
- **Liskov Substitution**: Page Objects can be substituted without breaking functionality
- **Interface Segregation**: Pages expose only necessary methods
- **Dependency Inversion**: Tests depend on page abstractions, not implementations
 
### **Architectural Patterns & Recommendations**
 
#### **❌ PATTERNS TO AVOID**
 
**Direct Selectors in Tests**:
- **Issue**: Creates tight coupling and violates SOLID principles
- **Why**: Breaks single responsibility and makes tests brittle
- **Better approach**: Use Page Objects with centralized locators
 
**Mixing UI Tests with API Testing Logic**:
- **Issue**: Bypasses user behavior validation
- **Why**: API calls should only be used for data setup/teardown, not as test flows
- **Better approach**: Test UI behavior, use APIs for setup/cleanup
 
**Tight Coupling Between Tests and Selectors**:
- **Issue**: Changes to UI break multiple tests
- **Why**: Violates DRY principle and SOLID principles
- **Better approach**: Centralize locators in Page Objects
 
#### **✅ RECOMMENDED PATTERNS**
 
**Page Object Model with BasePage**:
- **Structure**: Inherit from BasePage, expose locators and methods
- **Separation**: Locators in constructor, methods encapsulate interactions
- **Benefits**: Follows SOLID principles, maintains clean test code
 
**UI Tests + API Setup**:
- **When appropriate**: After UI validation, use API calls for test setup
- **Structure**: Test UI once, then use API to quickly set up for other tests
- **Why**: Reduce execution time while ensuring behavior is validated
 
**Cleanup with API Keys**:
- **When appropriate**: Use API Keys for teardown operations
- **Structure**: API Key cleanup in `afterEach`/`afterAll` hooks
- **Why**: Reliable cleanup independent of UI/session state
 
#### **Architectural Decision Tree**
 
| **Need** | **✅ Use** | **❌ Avoid** |
|----------|------------|--------------|
| **Page Interaction** | Page Object Methods | Direct selectors in tests |
| **Locator Management** | Page Object properties | Inline selectors |
| **Complex UI Flows** | Multiple Page Objects | Monolithic test files |
| **Data Setup** | API in `beforeEach` | API in test body |
| **User Behavior Testing** | UI interactions only | Mixed UI/API validation |
 
### **Page Object Implementation**
 
```javascript
const { BasePage } = require('./BasePage');
 
class LoginPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Define all locators in constructor
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorMessage = page.locator('[role="alert"]');
  }
 
  /**
   * Logs in with provided credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<LoginPage>}
   */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('**/dashboard');
    return this;
  }
 
  /**
   * Verifies error message is displayed
   * @param {string} expectedMessage - Expected error text
   * @returns {Promise<void>}
   */
  async verifyErrorMessage(expectedMessage) {
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
 
module.exports = { LoginPage };
```
 
---
 
### **Component Object Implementation**
 
```javascript
const { BasePage } = require('../BasePage');
 
class Modal extends BasePage {
  constructor(page, modalSelector = '[role="dialog"]') {
    super(page);
    
    this.modal = page.locator(modalSelector);
    this.closeButton = this.modal.locator('button[aria-label="Close"]');
    this.title = this.modal.locator('h2');
    this.confirmButton = this.modal.locator('button:has-text("Confirm")');
  }
 
  /**
   * Waits for modal to be visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Modal>}
   */
  async waitForVisible(timeout = 5000) {
    await this.waitForElement(this.modal, 'visible', timeout);
    return this;
  }
 
  /**
   * Gets modal title text
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.getText(this.title);
  }
 
  /**
   * Confirms action in modal
   * @returns {Promise<Modal>}
   */
  async confirm() {
    await this.confirmButton.click();
    await this.waitForElement(this.modal, 'hidden');
    return this;
  }
 
  /**
   * Closes the modal
   * @returns {Promise<Modal>}
   */
  async close() {
    await this.closeButton.click();
    await this.waitForElement(this.modal, 'hidden');
    return this;
  }
}
 
module.exports = { Modal };
```
 
---
 
### **Composing Page Objects with Components**
 
```javascript
const { BasePage } = require('./BasePage');
const { Modal } = require('./components/Modal');
 
class ProductPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    this.productName = page.locator('h1');
    this.addToCartButton = page.locator('button:has-text("Add to Cart")');
    
    // Compose the Modal component
    this.confirmModal = new Modal(page, '[role="dialog"]');
  }
 
  /**
   * Adds product to cart with confirmation
   * @returns {Promise<ProductPage>}
   */
  async addProductToCart() {
    await this.addToCartButton.click();
    await this.confirmModal.waitForVisible();
    await this.confirmModal.confirm();
    return this;
  }
}
 
module.exports = { ProductPage };
```
---
 
### **Page Object Locator Template**
 
```javascript
class EntityPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Form elements (Priority: ID → Input type → CSS class → Attribute)
    this.searchInput = page.locator('input[placeholder="Search"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('#CancelButton');
    
    // Navigation
    this.entityLink = page.locator('a.entity-link');
    this.breadcrumb = page.locator('.breadcrumb-item');
    
    // Data display
    this.resultsGrid = page.locator('table');
    this.errorMessage = page.locator('div[role="alert"]');
  }
 
  /**
   * Searches for entity
   * @param {string} searchTerm - Entity name to search
   * @returns {Promise<EntityPage>}
   */
  async search(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.submitButton.click();
    return this;
  }
 
  /**
   * Verifies results are displayed
   * @param {Array<string>} expectedResults - Expected entity names
   * @returns {Promise<EntityPage>}
   */
  async verifyResults(expectedResults) {
    for (const result of expectedResults) {
      await expect(this.resultsGrid).toContainText(result);
    }
    return this;
  }
 
  /**
   * Gets locator for dynamic product row by ID
   * @param {number} productId - Product ID
   * @returns {Locator}
   */
  getProductRow(productId) {
    return this.page.locator(`tr[data-product-id="${productId}"]`);
  }
}
```
## **Selector Priority Order**
 
1. **PREFERRED**: Static IDs → `page.locator('#submitButton')`
2. **OPTION 1**: Input types → `page.locator('input[type="email"]')`
3. **OPTION 2**: CSS classes → `page.locator('.primary-button')`
4. **OPTION 3**: Button/Link text → `page.locator('button:has-text("Submit")')`
5. **OPTION 4**: Aria/Role attributes → `page.locator('[role="alert"]')`
6. **OPTION 5**: Type + attribute → `page.locator('input[placeholder="Name"]')`
7. **AVOID**: Dynamic IDs, XPaths, complex selectors, `data-cy`
### **Page Object Structure**
 
There are three layers for page interactions:
 
**BASE PAGE**:
- Foundation class providing common methods
- Handles navigation, waiting, visibility checks
- Located in BasePage.js
- Examples: `navigate()`, `waitForElement()`, `getText()`
 
**PAGE OBJECTS**:
- Project-specific page classes inheriting from BasePage
- Encapsulate page elements and interactions
- Define locators and methods for page-specific actions
- Located in pages folder
- Examples: `HomePage.js`, `LoginPage.js`, `ProductPage.js`
 
**COMPONENT OBJECTS**:
- Reusable UI components used across multiple pages
- Located in `pages/components/` folder
- Composed into Page Objects
- Examples: `Header.js`, `Modal.js`, `Sidebar.js`
 
**HELPER FUNCTIONS**:
- Pure JavaScript functions for calculations/data manipulation
- Do not interact with Playwright commands or DOM elements
- Can be used within page objects or test files
- Examples: `calculateAge()`, `formatDate()`, `validateEmail()`
 
 
### **API Authentication Strategy**
 
| **Scenario** | **Use** | **Example** |
|--------------|--------|-----------|
| **Cleanup Operations** | API Key | Delete test data after test |
| **Data Setup (Pre-login)** | API Key | Create users, products before login |
| **Active Session Requests** | Session Token | Logged-in user operations |
| **User Action Simulation** | UI Only | Login, form submission, navigation |
 
```javascript
// ✅ Using API for setup with API Key
test.beforeEach(async ({ request }) => {
  const response = await request.post(`${API_URL}/entities`, {
    headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
    data: { name: 'Test Entity' }
  });
  testEntityId = (await response.json()).id;
});
 
// ✅ Using API for cleanup
test.afterEach(async ({ request }) => {
  await request.delete(`${API_URL}/entities/${testEntityId}`, {
    headers: { 'Authorization': `Bearer ${process.env.API_KEY}` }
  });
});
```
 
---
 
<!-- SECTION: PLAYWRIGHT_SPECIFIC_REQUIREMENTS -->
## Playwright-Specific Requirements (CRITICAL)
 
### **Async/Await is Mandatory**
 
All Playwright locator actions MUST be awaited. Failing to await will cause tests to fail silently:
 
```javascript
// ✅ CORRECT - All locator actions are awaited
await page.locator('#id').click();
await page.locator('input[type="email"]').fill('test@example.com');
const text = await page.locator('.message').textContent();
const isVisible = await page.locator('#element').isVisible();
 
// ❌ INCORRECT - Missing await
page.locator('#id').click();
const text = page.locator('.message').textContent();
```
 
### **Timeout and Error Handling**
 
Use `.waitFor()` with proper timeout management:
 
```javascript
// ✅ Wait for visibility with explicit timeout
await element.waitFor({ state: 'visible', timeout: 5000 });
await element.click();
 
// ✅ Error handling with try/catch
try {
  await element.waitFor({ state: 'visible', timeout: 5000 });
} catch (error) {
  console.log('Element not visible within timeout');
  throw new Error('Critical element not found');
}
 
// ✅ Handle multiple conditions
const result = await Promise.race([
  element1.waitFor({ state: 'visible', timeout: 3000 }).then(() => 'found'),
  element2.waitFor({ state: 'visible', timeout: 3000 }).then(() => 'alternative').catch(() => null)
]);
 
if (!result) {
  throw new Error('Neither element appeared');
}
```
 
### **Method Chaining Pattern**
 
Return `this` from Page Object methods to enable fluent API:
 
```javascript
// ✅ Method chaining enabled
async login(email, password) {
  await this.emailInput.fill(email);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
  return this; // ✅ Return this
}
 
// Usage with chaining
await loginPage
  .login('user@example.com', 'password')
  .verifySuccessMessage('Welcome');
 
// ❌ Without return this - cannot chain
async login(email, password) {
  await this.emailInput.fill(email);
  // Missing: return this;
}
```
 
### **Locator Visibility States**
 
Always ensure elements are in correct state before interacting:
 
```javascript
// ✅ Check visibility before interaction
if (await element.isVisible()) {
  await element.click();
}
 
// ✅ Wait for specific state
await element.waitFor({ state: 'visible', timeout: 5000 });
await element.click();
 
// ✅ Scroll into view if needed
await element.scrollIntoViewIfNeeded();
await element.click();
 
// ❌ Assume element is visible
await element.click(); // May fail if hidden
```
 
---
 
<!-- SECTION: LOCATORS_STRATEGY -->
## Locators & Selectors Strategy (CRITICAL)
 
### **Locator Management Rules**
 
**FUNDAMENTAL RULE**: NO locators in test files. All locators defined in Page Objects.
 
1. **CENTRALIZED STORAGE**: All locators as Page Object properties
2. **SINGLE SOURCE OF TRUTH**: Each locator exists only once
3. **NO TEST FILE LOCATORS**: Zero selector definitions in tests
 
### **Selector Priority Order**
2. **OPTION 1**: Static IDs → `page.locator('#submitButton')`
3. **OPTION 2**: CSS classes → `page.locator('.primary-button')`
4. **OPTION 3**: Type + attribute → `page.locator('input[placeholder="Name"]')`
5. **OPTION 4**: Role selectors → `page.getByRole('button', { name: 'Submit' })`
6. **AVOID**: Dynamic IDs, XPaths, complex selectors
 
### **Page Object Locator Template**
 
```javascript
class EntityPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Form elements (Priority: ID → Input type → CSS class → Attribute)
    this.searchInput = page.locator('input[placeholder="Search"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('#CancelButton');
    
    // Navigation
    this.entityLink = page.locator('a.entity-link');
    this.breadcrumb = page.locator('.breadcrumb-item');
    
    // Data display
    this.resultsGrid = page.locator('table');
    this.errorMessage = page.locator('div[role="alert"]');
  }
 
  /**
   * Searches for entity
   * @param {string} searchTerm - Entity name to search
   * @returns {Promise<EntityPage>}
   */
  async search(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.submitButton.click();
    return this;
  }
 
  /**
   * Verifies results are displayed
   * @param {Array<string>} expectedResults - Expected entity names
   * @returns {Promise<EntityPage>}
   */
  async verifyResults(expectedResults) {
    for (const result of expectedResults) {
      await expect(this.resultsGrid).toContainText(result);
    }
    return this;
  }
 
  /**
   * Gets locator for dynamic product row by ID
   * @param {number} productId - Product ID
   * @returns {Locator}
   */
  getProductRow(productId) {
    return this.page.locator(`tr[data-product-id="${productId}"]`);
  }
}
```
 
---
 
<!-- SECTION: FILE_STRUCTURE -->
## File Structure
 
```
project-root/
├── tests/
│   ├── features/
│   │   ├── Authentication.spec.js
│   │   ├── ProductListing.spec.js
│   │   └── Shopping.spec.js
│   └── fixtures/
│       └── testData.js
├── pages/
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── HomePage.js
│   ├── ProductPage.js
│   └── components/
│       ├── Header.js
│       ├── Modal.js
│       └── Sidebar.js
├── support/
│   ├── helpers.js
│   └── constants.js
├── playwright.config.js
├── package.json
├── .env
├── .env.example
└── README.md
```
 
---
 
<!-- SECTION: MANDATORY_FILE_STRUCTURE -->
## Mandatory Test File Structure
 
ALL test files must follow this exact structure:
 
```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { HomePage } = require('../../pages/HomePage');
 
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;
 
test.describe('Authentication:', () => {
 
  let loginPage;
  let homePage;
  let testUserId;
 
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    loginPage = new LoginPage(page, process.env.BASE_URL);
    homePage = new HomePage(page, process.env.BASE_URL);
    await loginPage.navigate('/login');
  });
 
  test.afterEach(async ({ request }) => {
    // Cleanup after each test (e.g., delete test data via API)
    if (testUserId) {
      await request.delete(`${API_BASE_URL}/users/${testUserId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
    }
  });
 
  test('should login successfully with valid credentials', async ({ page }) => {
    // Test using Page Objects - UI ONLY
    await loginPage.login('user@example.com', 'password123');
    
    // Verify successful login
    await expect(homePage.userGreeting).toBeVisible();
    await expect(homePage.userGreeting).toContainText('Welcome');
  });
 
  test('should display error for invalid credentials', async ({ page }) => {
    // Single primary assertion per test
    await loginPage.login('user@example.com', 'wrongpassword');
    await loginPage.verifyErrorMessage('Invalid credentials');
  });
 
  test('should remember user when checkbox is checked', async ({ page }) => {
    // Test with method chaining
    await loginPage
      .loginWithRememberMe('user@example.com', 'password123')
      .verifySuccessMessage('Welcome back');
  });
});
 
/**
* Helper function - Pure JavaScript
* @param {string} email - Email to validate
* @returns {boolean} True if valid
*/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```
 
---
 
<!-- SECTION: NAMING_CONVENTIONS -->
## Naming Conventions
 
### **File Naming**
- **Test files**: PascalCase with `.spec.js` suffix
  - ✅ `Authentication.spec.js`, `ProductListing.spec.js`
  - ❌ `authentication.spec.js`, `test-login.js`
 
- **Page Object files**: PascalCase with `.js` suffix
  - ✅ `LoginPage.js`, `HomePage.js`, `ProductPage.js`
  - ❌ `login.js`, `home-page.js`
 
- **Component files**: PascalCase with `.js` suffix
  - ✅ `Header.js`, `Modal.js`, `Sidebar.js`
  - ❌ `header-component.js`
 
- **Helper files**: camelCase with `.js` suffix
  - ✅ `helpers.js`, `constants.js`, `testData.js`
  - ❌ `Helpers.js`, `test-constants.js`
 
### **Variables and Functions**
- **camelCase**: variables, functions, methods, locator properties
  - ✅ `entityId`, `login()`, `verifyErrorMessage()`, `submitButton`
  - ❌ `EntityId`, `Login()`, `VerifyErrorMessage()`
 
- **PascalCase**: Classes, test descriptions
  - ✅ `class LoginPage`, `test.describe('Authentication:')`
  - ❌ `class loginPage`
 
- **UPPER_CASE**: Constants (root level)
  - ✅ `const BASE_URL = '...'`, `const API_TIMEOUT = 5000`
  - ❌ `const baseUrl`
 
### **Environment Variables**
- Format: Uppercase with underscores
- Examples: `BASE_URL`, `API_KEY`, `API_BASE_URL`, `ADMIN_USERNAME`
 
### **Test Case Naming**
- Use descriptive names starting with "should"
- Be specific about the scenario
 
```javascript
// ✅ GOOD
test('should login successfully with valid credentials');
test('should display error for invalid email format');
test('should remember user when checkbox is checked');
 
// ❌ POOR
test('login test');
test('validation');
test('remember me');
```
 
---
 
<!-- SECTION: DEVELOPMENT_WORKFLOW -->
## Development Workflow
 
### **Before Writing Code**
1. Check existing Page Objects in pages folder
2. Check helper methods in `support/helpers.js`
3. Follow the mandatory file structure
4. Use proper selector strategy (Static IDs → Input types → CSS classes → Button text → Role attributes)
5. Ensure tests focus on UI behavior, not API functionality
 
### **When Creating a New Page Object**
1. Create file in pages with PascalCase + `.js`
2. Extend from `BasePage`
3. Initialize all locators in constructor
4. Define public methods for user interactions
5. Return `this` for method chaining
6. Add JSDoc documentation to all public methods
 
### **Code Review Checklist**
- [ ] Follows mandatory file structure sections
- [ ] Uses correct naming conventions
- [ ] Implements proper selector strategy (Static IDs → Input types → CSS classes → Button text → Role attributes)
- [ ] Tests UI behavior, not API responses
- [ ] Includes proper cleanup in `afterEach()` hooks
- [ ] Locators are in Page Objects, not tests
- [ ] Includes JSDoc documentation for public methods
- [ ] Follows SOLID principles
- [ ] All Playwright operations are awaited
- [ ] Proper error handling with `.waitFor()` and timeouts
- [ ] Methods return `this` for chaining where appropriate
- [ ] No direct selectors in test files
 
---
 
<!-- SECTION: TEST_DATA_STRATEGY -->
## Test Data Strategy
 
### **Where to Store Test Data**
 
| **Type** | **Location** | **Use Case** |
|----------|-------------|------------|
| **Static Test Data** | `tests/fixtures/testData.js` | User credentials, product IDs |
| **API-Generated Data** | Created in `beforeEach` via API | Test-specific entities |
| **Environment Config** | `.env` file | URLs, API keys, admin credentials |
| **Dynamic Selectors** | Page Object methods | Element IDs that change per session |
 
### **Test Data Example**
 
```javascript
// tests/fixtures/testData.js
const testUsers = {
  validUser: {
    email: 'user@example.com',
    password: 'SecurePassword123!'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPassword123!'
  }
};
 
const testProducts = {
  laptop: { id: 1, name: 'Test Laptop', price: 999.99 },
  phone: { id: 2, name: 'Test Phone', price: 599.99 }
};
 
module.exports = { testUsers, testProducts };
```
 
### **Using Test Data in Tests**
 
```javascript
const { testUsers, testProducts } = require('../../tests/fixtures/testData');
 
test('should add product to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productPage = new ProductPage(page);
  
  // Use static test data
  await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
  await productPage.navigate(`/products/${testProducts.laptop.id}`);
  await productPage.addToCart();
});
```
 
---
 
<!-- SECTION: CONTEXT_GUIDELINES -->
## AI Context Guidelines
 
### **When Answering Prompts**
1. **Answer the question directly** without unrelated information
2. **Show only modified code** with minimal context (3-5 lines before/after)
3. **Explain why changes are needed** - Provide reasoning
4. **Strictly adhere** to project architecture and coding standards
5. **Challenge prompts** that violate architectural principles
 
### **Code Block Format**
- Use 4 backticks (`````) to start and end code blocks
- Add language identifier: ````javascript
- Add filepath for modified files: `// filepath: /path/to/file`
- Use `// ...existing code...` for unchanged sections
- Show only changed portions with minimal context
 
### **When Responding to Architecture-Breaking Requests**
 
**RESPOND WITH**:
- "This approach violates our SOLID architecture principles because..."
- "Direct selectors in tests break the Page Object pattern. Consider moving selectors to..."
- "API testing should be separate from UI testing. Consider..."
- "This creates tight coupling. A better approach would be using Page Objects..."
 
### **When Helping With**
- **Test structure**: Reference MANDATORY_FILE_STRUCTURE section
- **Selectors**: Reference LOCATORS_STRATEGY section  
- **Page Objects**: Reference ARCHITECTURE section
- **File organization**: Reference FILE_STRUCTURE section
- **Naming**: Reference NAMING_CONVENTIONS section
- **Playwright specifics**: Reference PLAYWRIGHT_SPECIFIC_REQUIREMENTS section
- **Test data**: Reference TEST_DATA_STRATEGY section
 
### **Always Verify**
1. File structure follows mandatory sections
2. Naming conventions are correct
3. Selector priority is followed (Static IDs → Input types → CSS classes → Button text → Role attributes)
4. Tests focus on UI behavior, not API functionality
5. SOLID principles are maintained
6. Page Objects are properly used
7. All Playwright operations are awaited
8. Proper imports and cleanup are implemented
9. Locators are centralized in Page Objects
10. Methods include proper JSDoc documentation
11. All Playwright operations have proper error handling
12. Methods return `this` for chaining where logical
 
### **Push Back Guidelines**
 
When prompts suggest:
 
| **Anti-Pattern** | **Response** |
|------------------|-------------|
| **Direct selectors in tests** | "Move this selector to the `{PageName}` Page Object class." |
| **API testing in UI flows** | "Use API calls for setup/teardown only. Test behavior through UI." |
| **Monolithic test files** | "Split into multiple tests with single responsibility." |
| **Tight coupling** | "Use Page Objects to decouple and improve reusability." |
| **Missing await on Playwright** | "All Playwright operations must be awaited." |
| **No error handling** | "Use `.waitFor()` with timeout and try/catch for reliability." |
| **Violating SOLID principles** | "This violates SOLID. Consider..." |
 
---This is an abstraction layer to ensure all Playwright projects will follow the same coding standard.
The project structure must follow these rules strictly. Any deviation from the standard will be rejected during the code review process.
AI models should strictly adhere to the rules and **challenge prompts that violate these architectural principles**.
IMPORTANT NOTE: Exceptions are rare and recognized, but they should always be explained in comment lines.
 
<!-- SECTION: ARCHITECTURE -->
## Architecture & Page Object Structure (CRITICAL)
 
### **Architecture Philosophy**
 
This framework follows **SOLID principles** and **Page Object Model (POM)** architecture:
 
- **Single Responsibility**: Each Page Object handles one page/component
- **Open/Closed**: Pages are open for extension, closed for modification
- **Liskov Substitution**: Page Objects can be substituted without breaking functionality
- **Interface Segregation**: Pages expose only necessary methods
- **Dependency Inversion**: Tests depend on page abstractions, not implementations
 
### **Architectural Patterns & Recommendations**
 
#### **❌ PATTERNS TO AVOID**
 
**Direct Selectors in Tests**:
- **Issue**: Creates tight coupling and violates SOLID principles
- **Why**: Breaks single responsibility and makes tests brittle
- **Better approach**: Use Page Objects with centralized locators
 
**Mixing UI Tests with API Testing Logic**:
- **Issue**: Bypasses user behavior validation
- **Why**: API calls should only be used for data setup/teardown, not as test flows
- **Better approach**: Test UI behavior, use APIs for setup/cleanup
 
**Tight Coupling Between Tests and Selectors**:
- **Issue**: Changes to UI break multiple tests
- **Why**: Violates DRY principle and SOLID principles
- **Better approach**: Centralize locators in Page Objects
 
#### **✅ RECOMMENDED PATTERNS**
 
**Page Object Model with BasePage**:
- **Structure**: Inherit from BasePage, expose locators and methods
- **Separation**: Locators in constructor, methods encapsulate interactions
- **Benefits**: Follows SOLID principles, maintains clean test code
 
**UI Tests + API Setup**:
- **When appropriate**: After UI validation, use API calls for test setup
- **Structure**: Test UI once, then use API to quickly set up for other tests
- **Why**: Reduce execution time while ensuring behavior is validated
 
**Cleanup with API Keys**:
- **When appropriate**: Use API Keys for teardown operations
- **Structure**: API Key cleanup in `afterEach`/`afterAll` hooks
- **Why**: Reliable cleanup independent of UI/session state
 
#### **Architectural Decision Tree**
 
| **Need** | **✅ Use** | **❌ Avoid** |
|----------|------------|--------------|
| **Page Interaction** | Page Object Methods | Direct selectors in tests |
| **Locator Management** | Page Object properties | Inline selectors |
| **Complex UI Flows** | Multiple Page Objects | Monolithic test files |
| **Data Setup** | API in `beforeEach` | API in test body |
| **User Behavior Testing** | UI interactions only | Mixed UI/API validation |
 
### **Page Object Implementation**
 
```javascript
const { BasePage } = require('./BasePage');
 
class LoginPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Define all locators in constructor
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorMessage = page.locator('[role="alert"]');
  }
 
  /**
   * Logs in with provided credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<LoginPage>}
   */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('**/dashboard');
    return this;
  }
 
  /**
   * Verifies error message is displayed
   * @param {string} expectedMessage - Expected error text
   * @returns {Promise<void>}
   */
  async verifyErrorMessage(expectedMessage) {
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
 
module.exports = { LoginPage };
```
 
---
 
### **Component Object Implementation**
 
```javascript
const { BasePage } = require('../BasePage');
 
class Modal extends BasePage {
  constructor(page, modalSelector = '[role="dialog"]') {
    super(page);
    
    this.modal = page.locator(modalSelector);
    this.closeButton = this.modal.locator('button[aria-label="Close"]');
    this.title = this.modal.locator('h2');
    this.confirmButton = this.modal.locator('button:has-text("Confirm")');
  }
 
  /**
   * Waits for modal to be visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Modal>}
   */
  async waitForVisible(timeout = 5000) {
    await this.waitForElement(this.modal, 'visible', timeout);
    return this;
  }
 
  /**
   * Gets modal title text
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.getText(this.title);
  }
 
  /**
   * Confirms action in modal
   * @returns {Promise<Modal>}
   */
  async confirm() {
    await this.confirmButton.click();
    await this.waitForElement(this.modal, 'hidden');
    return this;
  }
 
  /**
   * Closes the modal
   * @returns {Promise<Modal>}
   */
  async close() {
    await this.closeButton.click();
    await this.waitForElement(this.modal, 'hidden');
    return this;
  }
}
 
module.exports = { Modal };
```
 
---
 
### **Composing Page Objects with Components**
 
```javascript
const { BasePage } = require('./BasePage');
const { Modal } = require('./components/Modal');
 
class ProductPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    this.productName = page.locator('h1');
    this.addToCartButton = page.locator('button:has-text("Add to Cart")');
    
    // Compose the Modal component
    this.confirmModal = new Modal(page, '[role="dialog"]');
  }
 
  /**
   * Adds product to cart with confirmation
   * @returns {Promise<ProductPage>}
   */
  async addProductToCart() {
    await this.addToCartButton.click();
    await this.confirmModal.waitForVisible();
    await this.confirmModal.confirm();
    return this;
  }
}
 
module.exports = { ProductPage };
```
---
 
### **Page Object Locator Template**
 
```javascript
class EntityPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Form elements (Priority: ID → Input type → CSS class → Attribute)
    this.searchInput = page.locator('input[placeholder="Search"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('#CancelButton');
    
    // Navigation
    this.entityLink = page.locator('a.entity-link');
    this.breadcrumb = page.locator('.breadcrumb-item');
    
    // Data display
    this.resultsGrid = page.locator('table');
    this.errorMessage = page.locator('div[role="alert"]');
  }
 
  /**
   * Searches for entity
   * @param {string} searchTerm - Entity name to search
   * @returns {Promise<EntityPage>}
   */
  async search(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.submitButton.click();
    return this;
  }
 
  /**
   * Verifies results are displayed
   * @param {Array<string>} expectedResults - Expected entity names
   * @returns {Promise<EntityPage>}
   */
  async verifyResults(expectedResults) {
    for (const result of expectedResults) {
      await expect(this.resultsGrid).toContainText(result);
    }
    return this;
  }
 
  /**
   * Gets locator for dynamic product row by ID
   * @param {number} productId - Product ID
   * @returns {Locator}
   */
  getProductRow(productId) {
    return this.page.locator(`tr[data-product-id="${productId}"]`);
  }
}
```
## **Selector Priority Order**
 
1. **PREFERRED**: Static IDs → `page.locator('#submitButton')`
2. **OPTION 1**: Input types → `page.locator('input[type="email"]')`
3. **OPTION 2**: CSS classes → `page.locator('.primary-button')`
4. **OPTION 3**: Button/Link text → `page.locator('button:has-text("Submit")')`
5. **OPTION 4**: Aria/Role attributes → `page.locator('[role="alert"]')`
6. **OPTION 5**: Type + attribute → `page.locator('input[placeholder="Name"]')`
7. **AVOID**: Dynamic IDs, XPaths, complex selectors, `data-cy`
### **Page Object Structure**
 
There are three layers for page interactions:
 
**BASE PAGE**:
- Foundation class providing common methods
- Handles navigation, waiting, visibility checks
- Located in BasePage.js
- Examples: `navigate()`, `waitForElement()`, `getText()`
 
**PAGE OBJECTS**:
- Project-specific page classes inheriting from BasePage
- Encapsulate page elements and interactions
- Define locators and methods for page-specific actions
- Located in pages folder
- Examples: `HomePage.js`, `LoginPage.js`, `ProductPage.js`
 
**COMPONENT OBJECTS**:
- Reusable UI components used across multiple pages
- Located in `pages/components/` folder
- Composed into Page Objects
- Examples: `Header.js`, `Modal.js`, `Sidebar.js`
 
**HELPER FUNCTIONS**:
- Pure JavaScript functions for calculations/data manipulation
- Do not interact with Playwright commands or DOM elements
- Can be used within page objects or test files
- Examples: `calculateAge()`, `formatDate()`, `validateEmail()`
 
 
### **API Authentication Strategy**
 
| **Scenario** | **Use** | **Example** |
|--------------|--------|-----------|
| **Cleanup Operations** | API Key | Delete test data after test |
| **Data Setup (Pre-login)** | API Key | Create users, products before login |
| **Active Session Requests** | Session Token | Logged-in user operations |
| **User Action Simulation** | UI Only | Login, form submission, navigation |
 
```javascript
// ✅ Using API for setup with API Key
test.beforeEach(async ({ request }) => {
  const response = await request.post(`${API_URL}/entities`, {
    headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
    data: { name: 'Test Entity' }
  });
  testEntityId = (await response.json()).id;
});
 
// ✅ Using API for cleanup
test.afterEach(async ({ request }) => {
  await request.delete(`${API_URL}/entities/${testEntityId}`, {
    headers: { 'Authorization': `Bearer ${process.env.API_KEY}` }
  });
});
```
 
---
 
<!-- SECTION: PLAYWRIGHT_SPECIFIC_REQUIREMENTS -->
## Playwright-Specific Requirements (CRITICAL)
 
### **Async/Await is Mandatory**
 
All Playwright locator actions MUST be awaited. Failing to await will cause tests to fail silently:
 
```javascript
// ✅ CORRECT - All locator actions are awaited
await page.locator('#id').click();
await page.locator('input[type="email"]').fill('test@example.com');
const text = await page.locator('.message').textContent();
const isVisible = await page.locator('#element').isVisible();
 
// ❌ INCORRECT - Missing await
page.locator('#id').click();
const text = page.locator('.message').textContent();
```
 
### **Timeout and Error Handling**
 
Use `.waitFor()` with proper timeout management:
 
```javascript
// ✅ Wait for visibility with explicit timeout
await element.waitFor({ state: 'visible', timeout: 5000 });
await element.click();
 
// ✅ Error handling with try/catch
try {
  await element.waitFor({ state: 'visible', timeout: 5000 });
} catch (error) {
  console.log('Element not visible within timeout');
  throw new Error('Critical element not found');
}
 
// ✅ Handle multiple conditions
const result = await Promise.race([
  element1.waitFor({ state: 'visible', timeout: 3000 }).then(() => 'found'),
  element2.waitFor({ state: 'visible', timeout: 3000 }).then(() => 'alternative').catch(() => null)
]);
 
if (!result) {
  throw new Error('Neither element appeared');
}
```
 
### **Method Chaining Pattern**
 
Return `this` from Page Object methods to enable fluent API:
 
```javascript
// ✅ Method chaining enabled
async login(email, password) {
  await this.emailInput.fill(email);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
  return this; // ✅ Return this
}
 
// Usage with chaining
await loginPage
  .login('user@example.com', 'password')
  .verifySuccessMessage('Welcome');
 
// ❌ Without return this - cannot chain
async login(email, password) {
  await this.emailInput.fill(email);
  // Missing: return this;
}
```
 
### **Locator Visibility States**
 
Always ensure elements are in correct state before interacting:
 
```javascript
// ✅ Check visibility before interaction
if (await element.isVisible()) {
  await element.click();
}
 
// ✅ Wait for specific state
await element.waitFor({ state: 'visible', timeout: 5000 });
await element.click();
 
// ✅ Scroll into view if needed
await element.scrollIntoViewIfNeeded();
await element.click();
 
// ❌ Assume element is visible
await element.click(); // May fail if hidden
```
 
---
 
<!-- SECTION: LOCATORS_STRATEGY -->
## Locators & Selectors Strategy (CRITICAL)
 
### **Locator Management Rules**
 
**FUNDAMENTAL RULE**: NO locators in test files. All locators defined in Page Objects.
 
1. **CENTRALIZED STORAGE**: All locators as Page Object properties
2. **SINGLE SOURCE OF TRUTH**: Each locator exists only once
3. **NO TEST FILE LOCATORS**: Zero selector definitions in tests
 
### **Selector Priority Order**
2. **OPTION 1**: Static IDs → `page.locator('#submitButton')`
3. **OPTION 2**: CSS classes → `page.locator('.primary-button')`
4. **OPTION 3**: Type + attribute → `page.locator('input[placeholder="Name"]')`
5. **OPTION 4**: Role selectors → `page.getByRole('button', { name: 'Submit' })`
6. **AVOID**: Dynamic IDs, XPaths, complex selectors
 
### **Page Object Locator Template**
 
```javascript
class EntityPage extends BasePage {
  constructor(page, baseUrl) {
    super(page, baseUrl);
    
    // Form elements (Priority: ID → Input type → CSS class → Attribute)
    this.searchInput = page.locator('input[placeholder="Search"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('#CancelButton');
    
    // Navigation
    this.entityLink = page.locator('a.entity-link');
    this.breadcrumb = page.locator('.breadcrumb-item');
    
    // Data display
    this.resultsGrid = page.locator('table');
    this.errorMessage = page.locator('div[role="alert"]');
  }
 
  /**
   * Searches for entity
   * @param {string} searchTerm - Entity name to search
   * @returns {Promise<EntityPage>}
   */
  async search(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.submitButton.click();
    return this;
  }
 
  /**
   * Verifies results are displayed
   * @param {Array<string>} expectedResults - Expected entity names
   * @returns {Promise<EntityPage>}
   */
  async verifyResults(expectedResults) {
    for (const result of expectedResults) {
      await expect(this.resultsGrid).toContainText(result);
    }
    return this;
  }
 
  /**
   * Gets locator for dynamic product row by ID
   * @param {number} productId - Product ID
   * @returns {Locator}
   */
  getProductRow(productId) {
    return this.page.locator(`tr[data-product-id="${productId}"]`);
  }
}
```
 
---
 
<!-- SECTION: FILE_STRUCTURE -->
## File Structure
 
```
project-root/
├── tests/
│   ├── features/
│   │   ├── Authentication.spec.js
│   │   ├── ProductListing.spec.js
│   │   └── Shopping.spec.js
│   └── fixtures/
│       └── testData.js
├── pages/
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── HomePage.js
│   ├── ProductPage.js
│   └── components/
│       ├── Header.js
│       ├── Modal.js
│       └── Sidebar.js
├── support/
│   ├── helpers.js
│   └── constants.js
├── playwright.config.js
├── package.json
├── .env
├── .env.example
└── README.md
```
 
---
 
<!-- SECTION: MANDATORY_FILE_STRUCTURE -->
## Mandatory Test File Structure
 
ALL test files must follow this exact structure:
 
```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { HomePage } = require('../../pages/HomePage');
 
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;
 
test.describe('Authentication:', () => {
 
  let loginPage;
  let homePage;
  let testUserId;
 
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    loginPage = new LoginPage(page, process.env.BASE_URL);
    homePage = new HomePage(page, process.env.BASE_URL);
    await loginPage.navigate('/login');
  });
 
  test.afterEach(async ({ request }) => {
    // Cleanup after each test (e.g., delete test data via API)
    if (testUserId) {
      await request.delete(`${API_BASE_URL}/users/${testUserId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
    }
  });
 
  test('should login successfully with valid credentials', async ({ page }) => {
    // Test using Page Objects - UI ONLY
    await loginPage.login('user@example.com', 'password123');
    
    // Verify successful login
    await expect(homePage.userGreeting).toBeVisible();
    await expect(homePage.userGreeting).toContainText('Welcome');
  });
 
  test('should display error for invalid credentials', async ({ page }) => {
    // Single primary assertion per test
    await loginPage.login('user@example.com', 'wrongpassword');
    await loginPage.verifyErrorMessage('Invalid credentials');
  });
 
  test('should remember user when checkbox is checked', async ({ page }) => {
    // Test with method chaining
    await loginPage
      .loginWithRememberMe('user@example.com', 'password123')
      .verifySuccessMessage('Welcome back');
  });
});
 
/**
* Helper function - Pure JavaScript
* @param {string} email - Email to validate
* @returns {boolean} True if valid
*/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```
 
---
 
<!-- SECTION: NAMING_CONVENTIONS -->
## Naming Conventions
 
### **File Naming**
- **Test files**: PascalCase with `.spec.js` suffix
  - ✅ `Authentication.spec.js`, `ProductListing.spec.js`
  - ❌ `authentication.spec.js`, `test-login.js`
 
- **Page Object files**: PascalCase with `.js` suffix
  - ✅ `LoginPage.js`, `HomePage.js`, `ProductPage.js`
  - ❌ `login.js`, `home-page.js`
 
- **Component files**: PascalCase with `.js` suffix
  - ✅ `Header.js`, `Modal.js`, `Sidebar.js`
  - ❌ `header-component.js`
 
- **Helper files**: camelCase with `.js` suffix
  - ✅ `helpers.js`, `constants.js`, `testData.js`
  - ❌ `Helpers.js`, `test-constants.js`
 
### **Variables and Functions**
- **camelCase**: variables, functions, methods, locator properties
  - ✅ `entityId`, `login()`, `verifyErrorMessage()`, `submitButton`
  - ❌ `EntityId`, `Login()`, `VerifyErrorMessage()`
 
- **PascalCase**: Classes, test descriptions
  - ✅ `class LoginPage`, `test.describe('Authentication:')`
  - ❌ `class loginPage`
 
- **UPPER_CASE**: Constants (root level)
  - ✅ `const BASE_URL = '...'`, `const API_TIMEOUT = 5000`
  - ❌ `const baseUrl`
 
### **Environment Variables**
- Format: Uppercase with underscores
- Examples: `BASE_URL`, `API_KEY`, `API_BASE_URL`, `ADMIN_USERNAME`
 
### **Test Case Naming**
- Use descriptive names starting with "should"
- Be specific about the scenario
 
```javascript
// ✅ GOOD
test('should login successfully with valid credentials');
test('should display error for invalid email format');
test('should remember user when checkbox is checked');
 
// ❌ POOR
test('login test');
test('validation');
test('remember me');
```
 
---
 
<!-- SECTION: DEVELOPMENT_WORKFLOW -->
## Development Workflow
 
### **Before Writing Code**
1. Check existing Page Objects in pages folder
2. Check helper methods in `support/helpers.js`
3. Follow the mandatory file structure
4. Use proper selector strategy (Static IDs → Input types → CSS classes → Button text → Role attributes)
5. Ensure tests focus on UI behavior, not API functionality
 
### **When Creating a New Page Object**
1. Create file in pages with PascalCase + `.js`
2. Extend from `BasePage`
3. Initialize all locators in constructor
4. Define public methods for user interactions
5. Return `this` for method chaining
6. Add JSDoc documentation to all public methods
 
### **Code Review Checklist**
- [ ] Follows mandatory file structure sections
- [ ] Uses correct naming conventions
- [ ] Implements proper selector strategy (Static IDs → Input types → CSS classes → Button text → Role attributes)
- [ ] Tests UI behavior, not API responses
- [ ] Includes proper cleanup in `afterEach()` hooks
- [ ] Locators are in Page Objects, not tests
- [ ] Includes JSDoc documentation for public methods
- [ ] Follows SOLID principles
- [ ] All Playwright operations are awaited
- [ ] Proper error handling with `.waitFor()` and timeouts
- [ ] Methods return `this` for chaining where appropriate
- [ ] No direct selectors in test files
 
---
 
<!-- SECTION: TEST_DATA_STRATEGY -->
## Test Data Strategy
 
### **Where to Store Test Data**
 
| **Type** | **Location** | **Use Case** |
|----------|-------------|------------|
| **Static Test Data** | `tests/fixtures/testData.js` | User credentials, product IDs |
| **API-Generated Data** | Created in `beforeEach` via API | Test-specific entities |
| **Environment Config** | `.env` file | URLs, API keys, admin credentials |
| **Dynamic Selectors** | Page Object methods | Element IDs that change per session |
 
### **Test Data Example**
 
```javascript
// tests/fixtures/testData.js
const testUsers = {
  validUser: {
    email: 'user@example.com',
    password: 'SecurePassword123!'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPassword123!'
  }
};
 
const testProducts = {
  laptop: { id: 1, name: 'Test Laptop', price: 999.99 },
  phone: { id: 2, name: 'Test Phone', price: 599.99 }
};
 
module.exports = { testUsers, testProducts };
```
 
### **Using Test Data in Tests**
 
```javascript
const { testUsers, testProducts } = require('../../tests/fixtures/testData');
 
test('should add product to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productPage = new ProductPage(page);
  
  // Use static test data
  await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
  await productPage.navigate(`/products/${testProducts.laptop.id}`);
  await productPage.addToCart();
});
```
 
---
 
<!-- SECTION: CONTEXT_GUIDELINES -->
## AI Context Guidelines
 
### **When Answering Prompts**
1. **Answer the question directly** without unrelated information
2. **Show only modified code** with minimal context (3-5 lines before/after)
3. **Explain why changes are needed** - Provide reasoning
4. **Strictly adhere** to project architecture and coding standards
5. **Challenge prompts** that violate architectural principles
 
### **Code Block Format**
- Use 4 backticks (`````) to start and end code blocks
- Add language identifier: ````javascript
- Add filepath for modified files: `// filepath: /path/to/file`
- Use `// ...existing code...` for unchanged sections
- Show only changed portions with minimal context
 
### **When Responding to Architecture-Breaking Requests**
 
**RESPOND WITH**:
- "This approach violates our SOLID architecture principles because..."
- "Direct selectors in tests break the Page Object pattern. Consider moving selectors to..."
- "API testing should be separate from UI testing. Consider..."
- "This creates tight coupling. A better approach would be using Page Objects..."
 
### **When Helping With**
- **Test structure**: Reference MANDATORY_FILE_STRUCTURE section
- **Selectors**: Reference LOCATORS_STRATEGY section  
- **Page Objects**: Reference ARCHITECTURE section
- **File organization**: Reference FILE_STRUCTURE section
- **Naming**: Reference NAMING_CONVENTIONS section
- **Playwright specifics**: Reference PLAYWRIGHT_SPECIFIC_REQUIREMENTS section
- **Test data**: Reference TEST_DATA_STRATEGY section
 
### **Always Verify**
1. File structure follows mandatory sections
2. Naming conventions are correct
3. Selector priority is followed (Static IDs → Input types → CSS classes → Button text → Role attributes)
4. Tests focus on UI behavior, not API functionality
5. SOLID principles are maintained
6. Page Objects are properly used
7. All Playwright operations are awaited
8. Proper imports and cleanup are implemented
9. Locators are centralized in Page Objects
10. Methods include proper JSDoc documentation
11. All Playwright operations have proper error handling
12. Methods return `this` for chaining where logical
 
### **Push Back Guidelines**
 
When prompts suggest:
 
| **Anti-Pattern** | **Response** |
|------------------|-------------|
| **Direct selectors in tests** | "Move this selector to the `{PageName}` Page Object class." |
| **API testing in UI flows** | "Use API calls for setup/teardown only. Test behavior through UI." |
| **Monolithic test files** | "Split into multiple tests with single responsibility." |
| **Tight coupling** | "Use Page Objects to decouple and improve reusability." |
| **Missing await on Playwright** | "All Playwright operations must be awaited." |
| **No error handling** | "Use `.waitFor()` with timeout and try/catch for reliability." |
| **Violating SOLID principles** | "This violates SOLID. Consider..." |
 
---
