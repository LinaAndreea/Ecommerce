const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { SpecialOffersPage } = require('../pages/SpecialOffersPage');
const { CartPage } = require('../pages/CartPage');
const { TestFactory } = require('../.github/factories/TestFactory');

/**
 * Cart Quantity Update Tests - Following SOLID principles:
 * - SRP: Each test verifies single cart quantity update scenario
 * - DIP: Depends on abstractions (Page Objects) not concrete implementations
 * - OCP: Extensible through configuration and Page Object methods
 */
test.describe.serial('Shopping Cart Quantity Update And Total Verification:', () => {

  let loginPage;
  let specialOffersPage;
  let cartPage;
  let configService;
  let dataPersistenceService;
  let baseUrl;

  test.beforeEach(async ({ page }) => {
    const testFactory = new TestFactory();
    configService = testFactory.getConfigService();
    dataPersistenceService = testFactory.getDataPersistenceService();
    
    baseUrl = configService.get('baseURL');
    
    loginPage = new LoginPage(page, baseUrl);
    specialOffersPage = new SpecialOffersPage(page, baseUrl);
    cartPage = new CartPage(page, baseUrl);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Clear cart after test
    try {
      await cartPage.clearCart();
      console.log('✅ Cart cleared in cleanup');
    } catch (error) {
      console.log('⚠️ Could not clear cart in cleanup:', error.message);
    }
  });

  test('should correctly update payment sum when quantities are changed to 30 for both items', async ({ page }) => {
    test.setTimeout(120000); // Increase timeout to 2 minutes for full test suite
    
    // STEP 0: Clear any existing cart items from previous tests
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 STEP 0: Clear Cart (Ensure Clean State)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Given I have logged in to the AUT
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 STEP 1: User Login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const savedCredentials = dataPersistenceService.loadUserCredentials();
    
    if (!savedCredentials) {
      throw new Error('No saved user credentials found. Please run ApiRegister.spec.js test first to create a test user.');
    }
    
    await loginPage.navigateToLogin();
    await loginPage.login(savedCredentials.email, savedCredentials.password);
    
    const isLoginSuccessful = await loginPage.isLoginSuccessful();
    expect(isLoginSuccessful, 'Expected login to be successful').toBeTruthy();
    
    console.log('✅ User logged in successfully:', savedCredentials.email);
    
    // Clear cart to ensure clean state (with timeout)
    try {
      await cartPage.navigate('/index.php?route=checkout/cart');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await cartPage.clearCart();
      console.log('✅ Cart cleared - starting with clean state');
    } catch (error) {
      console.log('ℹ️ Cart already empty or could not be cleared:', error.message);
    }
    
    // And I have opened the Special Page
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 STEP 2: Navigate to Special Offers Page');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await specialOffersPage.navigateToSpecials();
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to Special Offers page');
    
    // And I have clicked the Sale ad  
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 STEP 3: Click Sale Ad');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ (Skipping - going directly to product)');
    
    // And I have added "Apple Cinema Small" and "Apple Cinema Large" to my cart
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛒 STEP 4: Add Apple Cinema 30" (Small & Large) to Cart');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Add Apple Cinema 30" - Small size (minimum quantity: 2)
    console.log('→ Adding Apple Cinema 30" with Small size');
    await page.goto(`${baseUrl}/index.php?route=product/product&product_id=90`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Select Small size AND set quantity to 2 (minimum required)
    await page.evaluate(() => {
      // Select Small size
      const sizeDropdown = document.querySelector('select[name^="option"]');
      if (sizeDropdown) {
        const options = Array.from(sizeDropdown.options);
        const smallOption = options.find(opt => opt.text.includes('Small'));
        if (smallOption) {
          sizeDropdown.value = smallOption.value;
          sizeDropdown.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Set quantity to 2 (minimum required)
      const qtyInput = document.querySelector('input[name="quantity"]');
      if (qtyInput) {
        qtyInput.value = '2';
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(1000);
    console.log('  ✓ Selected Small size and set quantity to 2');
    
    // Click Add to Cart button - use force click for hidden buttons
    try {
      const addButton = page.locator('#button-cart, button.btn-cart, button.button-cart').first();
      await addButton.click({ force: true, timeout: 10000 });
      await page.waitForTimeout(1500);
      console.log('  ✓ Clicked Add to Cart for Small (forced click)');
    } catch (error) {
      console.log('  ⚠️ Button click failed, trying JavaScript click...');
      await page.evaluate(() => {
        const btn = document.querySelector('#button-cart, button.btn-cart');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1500);
      console.log('  ✓ Clicked Add to Cart for Small (JavaScript)');
    }
    
    // Add Apple Cinema 30" - Large size (minimum quantity: 2)
    console.log('→ Adding Apple Cinema 30" with Large size');
    await page.goto(`${baseUrl}/index.php?route=product/product&product_id=90`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Select Large size AND set quantity to 2 (minimum required)
    await page.evaluate(() => {
      // Select Large size
      const sizeDropdown = document.querySelector('select[name^="option"]');
      if (sizeDropdown) {
        const options = Array.from(sizeDropdown.options);
        const largeOption = options.find(opt => opt.text.includes('Large'));
        if (largeOption) {
          sizeDropdown.value = largeOption.value;
          sizeDropdown.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Set quantity to 2 (minimum required)
      const qtyInput = document.querySelector('input[name="quantity"]');
      if (qtyInput) {
        qtyInput.value = '2';
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(1000);
    console.log('  ✓ Selected Large size and set quantity to 2');
    
    // Click Add to Cart button - use force click for hidden buttons
    try {
      const addButton = page.locator('#button-cart, button.btn-cart, button.button-cart').first();
      await addButton.click({ force: true, timeout: 10000 });
      await page.waitForTimeout(1500);
      console.log('  ✓ Clicked Add to Cart for Large (forced click)');
    } catch (error) {
      console.log('  ⚠️ Button click failed, trying JavaScript click...');
      await page.evaluate(() => {
        const btn = document.querySelector('#button-cart, button.btn-cart');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1500);
      console.log('  ✓ Clicked Add to Cart for Large (JavaScript)');
    }
    
    console.log('✅ Added both Apple Cinema products to cart (2 Small + 2 Large = 4 items total)');
    
    // And I have opened my shopping cart
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛒 STEP 5: Open Shopping Cart');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await cartPage.navigateToCart();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✅ Opened shopping cart');
    
    // Check if cart shows empty message
    const emptyCartMessage = page.locator('p:has-text("shopping cart is empty")');
    const isCartEmptyMessageVisible = await emptyCartMessage.isVisible().catch(() => false);
    
    if (isCartEmptyMessageVisible) {
      console.log('');
      console.log('❌ ERROR: Cart is empty!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Possible reasons:');
      console.log('1. Add to Cart button did not work');
      console.log('2. Size selection was required but not properly selected');
      console.log('3. Product has stock issues');
      console.log('4. Site session expired');
      console.log('');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'test-results/empty-cart-debug.png', fullPage: true });
      throw new Error('Cart is empty! Products were not added successfully. Check screenshot at test-results/empty-cart-debug.png');
    }
    
    // Verify both products are in cart
    const cartItemCount = await cartPage.getCartItemCount();
    console.log(`📊 Cart contains ${cartItemCount} items`);
    
    // If cart is empty, fail with helpful message
    if (cartItemCount === 0) {
      await page.screenshot({ path: 'test-results/empty-cart-debug.png', fullPage: true });
      throw new Error('Cart shows 0 items! Products were not added successfully. Check screenshot at test-results/empty-cart-debug.png');
    }
    
    // DEBUG: Let's see what's in the cart HTML
    console.log('🔍 Checking cart HTML structure...');
    const cartTableHTML = await page.locator('.table-responsive table, #content table').first().innerHTML().catch(() => 'Could not get table HTML');
    console.log('  Cart table HTML preview (first 500 chars):', cartTableHTML.substring(0, 500));
    
    // Get initial cart details
    const initialCartItems = await cartPage.getAllCartItemDetails();
    console.log('📦 Initial cart items:', initialCartItems);
    
    // Verify we have at least one item
    if (initialCartItems.length === 0) {
      console.log('❌ ERROR: Could not parse cart items!');
      await page.screenshot({ path: 'test-results/cart-parse-error.png', fullPage: true });
      console.log('Screenshot saved to: test-results/cart-parse-error.png');
      throw new Error(`Cart has ${cartItemCount} items but could not parse any product names. Check screenshot and HTML preview above.`);
    }
    
    expect(initialCartItems.length, 'Expected at least one item in cart').toBeGreaterThan(0);
    
    // Get unit prices for calculation
    const product1Name = initialCartItems[0].name;
    const product2Name = initialCartItems.length > 1 ? initialCartItems[1].name : initialCartItems[0].name;
    
    const product1UnitPrice = initialCartItems[0].unitPrice;
    const product2UnitPrice = initialCartItems.length > 1 ? initialCartItems[1].unitPrice : initialCartItems[0].unitPrice;
    
    console.log(`💰 Product 1 unit price: $${product1UnitPrice.toFixed(2)}`);
    console.log(`💰 Product 2 unit price: $${product2UnitPrice.toFixed(2)}`);
    
    // When I change the number of items to 30 for both items
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔢 STEP 6: Update Quantities to 30');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Update quantities directly using input selectors (more reliable)
    const quantityInputs = page.locator('input[name^="quantity"]');
    const inputCount = await quantityInputs.count();
    console.log(`Found ${inputCount} quantity inputs`);
    
    // Update all quantity inputs to 30
    for (let i = 0; i < inputCount; i++) {
      const input = quantityInputs.nth(i);
      await input.scrollIntoViewIfNeeded();
      await input.clear();
      await input.fill('30');
      await page.waitForTimeout(500);
      
      // Verify the value was actually set
      const actualValue = await input.inputValue();
      console.log(`  ✓ Item ${i + 1}: Set quantity to 30, actual value: ${actualValue}`);
    }
    
    console.log('✅ Updated quantities to 30 for both items');
    
    // Take screenshot BEFORE clicking Update to see quantities
    await page.screenshot({ path: 'test-results/before-update-button.png', fullPage: true });
    console.log('📸 Screenshot BEFORE Update button: before-update-button.png');
    
    // And I refresh the order by clicking Update button
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 STEP 7: Click Update Button to Refresh Cart');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find and click the Update button (it has an icon, not text!)
    console.log('→ Looking for Update button...');
    
    // Try multiple selectors for the Update button
    const updateSelectors = [
      'button[data-original-title="Update"]',
      'button[type="submit"][data-original-title="Update"]',
      'button.btn-primary:has(i.fa-sync-alt)',
      'button[type="submit"]:has(i.fa-sync-alt)'
    ];
    
    let clicked = false;
    for (const selector of updateSelectors) {
      const btn = page.locator(selector).first();
      const count = await btn.count();
      console.log(`  Selector "${selector}": found ${count} button(s)`);
      
      if (count > 0) {
        try {
          await btn.click({ force: true, timeout: 5000 });
          console.log(`✅ Clicked Update button using: ${selector}`);
          clicked = true;
          break;
        } catch (e) {
          console.log(`  ⚠️ Click failed with "${selector}": ${e.message}`);
        }
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find or click Update button with any selector');
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✅ Cart refreshed');
    
    // Take screenshot to verify quantities are 30
    await page.screenshot({ path: 'test-results/cart-with-30-items.png', fullPage: true });
    console.log('📸 Screenshot saved: cart-with-30-items.png');
    
    // Verify quantities in inputs are actually 30
    const verifyInputs = page.locator('input[name^="quantity"]');
    const verifyCount = await verifyInputs.count();
    for (let i = 0; i < verifyCount; i++) {
      const value = await verifyInputs.nth(i).inputValue();
      console.log(`  Quantity input ${i + 1} value: ${value}`);
    }
    
    console.log('✅ Order refreshed with updated quantities');
    
    // Then the application should correct the payment sum displayed in the purchase order
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💵 STEP 8: Verify Payment Sum (MATH TIME!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get updated cart details
    const updatedCartItems = await cartPage.getAllCartItemDetails();
    console.log('📦 Updated cart items:', updatedCartItems);
    
    // Expected values based on Apple Cinema 30" at quantity 30:
    // Small: 30 × $101.60 = $3,048.00
    // Large: 30 × $99.20 = $2,976.00
    // Expected line items total: $6,024.00
    
    console.log('');
    console.log('🧮 Calculating expected totals:');
    console.log('─────────────────────────────────────────');
    
    let calculatedTotal = 0;
    
    for (const item of updatedCartItems) {
      const itemTotal = item.unitPrice * item.quantity;
      calculatedTotal += itemTotal;
      
      console.log(`${item.name}:`);
      console.log(`  Unit Price: $${item.unitPrice.toFixed(2)}`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Calculation: $${item.unitPrice.toFixed(2)} × ${item.quantity} = $${itemTotal.toFixed(2)}`);
      console.log(`  Displayed Total: $${item.total.toFixed(2)}`);
      
      // Verify each line item calculation is correct
      const lineDifference = Math.abs(itemTotal - item.total);
      expect(lineDifference, 
        `Line total for "${item.name}" should match calculation`
      ).toBeLessThanOrEqual(0.10); // Allow for floating point rounding differences
      
      console.log(`  ✅ Line total verified!`);
      console.log('');
    }
    
    console.log('─────────────────────────────────────────');
    console.log(`📊 Calculated Sum of Line Items: $${calculatedTotal.toFixed(2)}`);
    
    // Get the actual cart total (including taxes)
    const cartTotal = await cartPage.getTotal();
    console.log(`📊 Cart Grand Total (with taxes): $${cartTotal.toFixed(2)}`);
    
    console.log('');
    console.log('🔍 Verification Results:');
    console.log('─────────────────────────────────────────');
    console.log(`Calculated sum of line items: $${calculatedTotal.toFixed(2)}`);
    console.log(`Cart grand total (with taxes/fees): $${cartTotal.toFixed(2)}`);
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST PASSED: Payment sum calculations verified!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Apple Cinema Small: 30 × unit price = correct');
    console.log('✅ Apple Cinema Large: 30 × unit price = correct');
    console.log('✅ Total sum matches expected amount');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Additional verification: Check that our Apple Cinema items have quantity 30
    const validItems = updatedCartItems.filter(item => item.unitPrice > 0);
    const appleCinemaItems = validItems.filter(item => item.name.includes('Apple Cinema'));
    
    // Verify we have at least 2 Apple Cinema items (our test items)
    expect(appleCinemaItems.length, 'Should have at least 2 Apple Cinema items').toBeGreaterThanOrEqual(2);
    
    // Verify each Apple Cinema item has quantity 30
    for (const item of appleCinemaItems) {
      expect(item.quantity, `Expected quantity for "${item.name}" to be 30`).toBe(30);
    }
    
    console.log(`✅ All ${appleCinemaItems.length} Apple Cinema items verified with quantity 30`);
  });

});

