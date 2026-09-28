const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'packages', 'shared', 'src', 'analytics.ts');
const repoRoot = path.join(__dirname, '..');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, moduleUnderTest, moduleUnderTest.exports);

const {
  ANALYTICS_EVENTS,
  AnalyticsEventDeduper,
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
} = moduleUnderTest.exports;

test('accepts only registered event names', () => {
  assert.equal(isAnalyticsEventName(ANALYTICS_EVENTS.PURCHASE_COMPLETED), true);
  assert.equal(isAnalyticsEventName(ANALYTICS_EVENTS.CART_VIEWED), true);
  assert.equal(isAnalyticsEventName(ANALYTICS_EVENTS.DESIGN_TOOL_ENTERED), true);
  assert.equal(isAnalyticsEventName('email_captured'), false);
  assert.equal(isAnalyticsEventName(undefined), false);
});

test('drops personal, free-form and nested properties', () => {
  const sanitized = sanitizeAnalyticsProperties({
    feature: 'checkout',
    currency: 'KRW',
    value: 39000,
    email: 'buyer@example.com',
    phone: '010-0000-0000',
    address: 'Seoul',
    nail_sizes: '1,2,3,4,5',
    memo: 'custom request text',
    image_url: 'https://example.com/private.jpg',
    payment_key: 'secret',
    raw_order: { id: 'private' },
  });

  assert.deepEqual(sanitized, { feature: 'checkout', currency: 'KRW', value: 39000 });
});

test('drops unsafe scalar values and normalizes allowed strings', () => {
  const sanitized = sanitizeAnalyticsProperties({
    feature: '  catalog  ',
    entry_source: '',
    item_count: Number.POSITIVE_INFINITY,
    order_status: 'x'.repeat(101),
    debug_mode: true,
  });

  assert.deepEqual(sanitized, { feature: 'catalog', debug_mode: true });
});

test('suppresses duplicate page events without suppressing repeated actions', () => {
  let now = 1_000;
  const deduper = new AnalyticsEventDeduper(5_000, () => now);
  const properties = { feature: 'catalog', entry_source: 'direct' };

  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.PRODUCT_VIEWED, properties), true);
  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.PRODUCT_VIEWED, properties), false);
  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.CART_ITEM_ADDED, properties), true);
  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.CART_ITEM_ADDED, properties), true);

  now += 5_001;
  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.PRODUCT_VIEWED, properties), true);
  deduper.reset();
  assert.equal(deduper.shouldTrack(ANALYTICS_EVENTS.PRODUCT_VIEWED, properties), true);
});

test('covers the core buyer, seller and design-tool funnel call sites', () => {
  const expectedEventsByFile = {
    'packages/web/src/components/product/Detail.tsx': [
      'PRODUCT_VIEWED',
      'CART_ITEM_ADDED',
    ],
    'packages/web/src/components/cart/CartContent.tsx': ['CART_VIEWED'],
    'packages/web/src/components/pages/CheckoutPage.tsx': [
      'CHECKOUT_VIEWED',
      'PURCHASE_STARTED',
    ],
    'packages/web/src/components/pages/PaymentSuccess.tsx': ['PURCHASE_COMPLETED'],
    'packages/web/src/components/pages/SellerApplicationForm.tsx': [
      'SELLER_SIGNUP_STARTED',
      'SELLER_PROFILE_COMPLETED',
    ],
    'packages/web/src/components/pages/HandyStudioPage.tsx': ['DESIGN_TOOL_ENTERED'],
  };

  for (const [relativePath, eventNames] of Object.entries(expectedEventsByFile)) {
    const fileSource = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    for (const eventName of eventNames) {
      assert.match(fileSource, new RegExp(`ANALYTICS_EVENTS\\.${eventName}`), `${eventName} missing from ${relativePath}`);
    }
  }
});

test('keeps web and native dispatch behind explicit consent checks', () => {
  const webSource = fs.readFileSync(path.join(repoRoot, 'packages/web/src/services/analytics.ts'), 'utf8');
  const nativeSource = fs.readFileSync(path.join(repoRoot, 'packages/mobile/src/services/analyticsService.ts'), 'utf8');

  assert.match(webSource, /if \(!isAnalyticsEventName\(event\) \|\| !hasAnalyticsConsent\(\)\) return;/);
  assert.match(nativeSource, /if \(!this\.enabled \|\| !isAnalyticsEventName\(event\)\) return;/);
  assert.match(webSource, /if \(!enabled\) await target\?\.reset\(\);/);
  assert.match(nativeSource, /if \(!enabled\) await analytics\(\)\.setUserId\(null\);/);
});

test('keeps release analytics disabled by default and removes advertising IDs', () => {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8'))['react-native'];
  const falseByDefault = [
    'analytics_auto_collection_enabled',
    'analytics_idfv_collection_enabled',
    'google_analytics_adid_collection_enabled',
    'google_analytics_ssaid_collection_enabled',
    'google_analytics_automatic_screen_reporting_enabled',
    'google_analytics_registration_with_ad_network_enabled',
    'analytics_default_allow_analytics_storage',
    'analytics_default_allow_ad_storage',
    'analytics_default_allow_ad_user_data',
    'analytics_default_allow_ad_personalization_signals',
  ];

  for (const key of falseByDefault) assert.equal(firebaseConfig[key], false, `${key} must default to false`);

  const androidManifest = fs.readFileSync(
    path.join(repoRoot, 'packages/mobile/android/app/src/main/AndroidManifest.xml'),
    'utf8',
  );
  const viteConfig = fs.readFileSync(path.join(repoRoot, 'packages/web/vite.config.ts'), 'utf8');
  for (const permission of [
    'com.google.android.gms.permission.AD_ID',
    'android.permission.ACCESS_ADSERVICES_AD_ID',
    'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
  ]) {
    assert.match(androidManifest, new RegExp(`${permission.replaceAll('.', '\\.')}[^>]+tools:node="remove"`));
  }
  assert.match(viteConfig, /Incomplete Firebase Analytics configuration/);
  assert.match(viteConfig, /VITE_ANALYTICS_DEBUG must be false in production builds/);
});
