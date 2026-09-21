const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'packages', 'shared', 'src', 'analytics.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, moduleUnderTest, moduleUnderTest.exports);

const { ANALYTICS_EVENTS, isAnalyticsEventName, sanitizeAnalyticsProperties } = moduleUnderTest.exports;

test('accepts only registered event names', () => {
  assert.equal(isAnalyticsEventName(ANALYTICS_EVENTS.PURCHASE_COMPLETED), true);
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
