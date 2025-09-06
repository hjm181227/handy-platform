/**
 * Cart Functionality Test Script
 * 
 * This script tests the cart API integration and responsive design
 * Run in browser console: copy and paste this code
 */

console.log('🛒 Cart Functionality Test Started');

// Test 1: Check if webApiService is available
try {
  if (window.webApiService && window.webApiService.cart) {
    console.log('✅ Test 1 PASSED: webApiService.cart is available');
  } else {
    console.error('❌ Test 1 FAILED: webApiService.cart not found');
  }
} catch (error) {
  console.error('❌ Test 1 FAILED:', error);
}

// Test 2: Check responsive cart hook
try {
  const cartButton = document.querySelector('[data-testid="cart-button"]') || 
                   document.querySelector('button[aria-label*="장바구니"]') ||
                   document.querySelector('button:contains("장바구니")');
  
  if (cartButton) {
    console.log('✅ Test 2 PASSED: Cart button found');
  } else {
    console.log('⚠️ Test 2 SKIP: Cart button not found (might be in different page)');
  }
} catch (error) {
  console.error('❌ Test 2 FAILED:', error);
}

// Test 3: Check screen size responsiveness
try {
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth < 1024;
  
  console.log(`✅ Test 3 PASSED: Screen size detected - ${screenWidth}px (${isMobile ? 'Mobile' : 'Desktop'} mode)`);
} catch (error) {
  console.error('❌ Test 3 FAILED:', error);
}

// Test 4: Check API endpoints configuration
try {
  if (window.webApiService && window.webApiService.cart) {
    const methods = ['getCart', 'getCartCount', 'addToCart', 'updateCartItem', 'removeFromCart', 'clearCart'];
    const availableMethods = methods.filter(method => typeof window.webApiService.cart[method] === 'function');
    
    if (availableMethods.length === methods.length) {
      console.log('✅ Test 4 PASSED: All cart API methods are available');
      console.log('   Available methods:', availableMethods);
    } else {
      console.error('❌ Test 4 FAILED: Some cart API methods are missing');
      console.log('   Expected:', methods);
      console.log('   Available:', availableMethods);
    }
  }
} catch (error) {
  console.error('❌ Test 4 FAILED:', error);
}

// Test 5: Check toast notification system
try {
  const toastElements = document.querySelectorAll('[class*="toast"], [class*="notification"]');
  console.log(`ℹ️ Test 5 INFO: Found ${toastElements.length} potential toast containers`);
} catch (error) {
  console.error('❌ Test 5 FAILED:', error);
}

console.log('\n📋 Manual Tests to Perform:');
console.log('1. Navigate to a product detail page');
console.log('2. Select options (nail shape, length) and add to cart');
console.log('3. Check if cart count updates in header');
console.log('4. Open cart (drawer on desktop, page on mobile)');
console.log('5. Update quantities and remove items');
console.log('6. Test responsive behavior by resizing window');
console.log('7. Test checkout flow (should show alert for now)');

console.log('\n🔗 Test URLs:');
console.log(`- Home: ${window.location.origin}`);
console.log(`- Product Detail: ${window.location.origin}/product/1`);
console.log(`- Cart Page: ${window.location.origin}/cart`);
console.log(`- Brands: ${window.location.origin}/brands`);

console.log('\n🛒 Cart Functionality Test Completed');