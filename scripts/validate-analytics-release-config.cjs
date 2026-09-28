#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const failures = [];

const fail = (message) => failures.push(message);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const nativeDefaults = JSON.parse(read('firebase.json'))['react-native'] || {};
const requiredFalseDefaults = [
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

for (const key of requiredFalseDefaults) {
  if (nativeDefaults[key] !== false) fail(`firebase.json must set ${key} to false`);
}

const androidManifest = read('packages/mobile/android/app/src/main/AndroidManifest.xml');
const removedAdvertisingPermissions = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
  'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
];
for (const permission of removedAdvertisingPermissions) {
  const declaration = new RegExp(`<uses-permission[^>]+android:name="${permission.replaceAll('.', '\\.')}"[^>]+tools:node="remove"`);
  if (!declaration.test(androidManifest)) fail(`AndroidManifest.xml must remove ${permission}`);
}

const mergedReleaseManifest = path.join(
  root,
  'packages/mobile/android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml',
);
if (fs.existsSync(mergedReleaseManifest)) {
  const mergedManifest = fs.readFileSync(mergedReleaseManifest, 'utf8');
  for (const permission of removedAdvertisingPermissions) {
    if (mergedManifest.includes(permission)) fail(`merged Android release manifest still contains ${permission}`);
  }
}

const webKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];
const configuredWebKeys = webKeys.filter((key) => process.env[key]?.trim());

if (configuredWebKeys.length > 0 && configuredWebKeys.length < webKeys.length) {
  fail(`web Firebase configuration is partial; missing ${webKeys.filter((key) => !process.env[key]?.trim()).join(', ')}`);
}
if (args.has('--require-web-analytics') && configuredWebKeys.length !== webKeys.length) {
  fail('all web Firebase variables are required for this release check');
}
if (process.env.VITE_ANALYTICS_DEBUG === 'true') fail('VITE_ANALYTICS_DEBUG must be false for release');
if (configuredWebKeys.length === webKeys.length) {
  if (!process.env.VITE_APP_VERSION?.trim() || !process.env.VITE_BUILD_NUMBER?.trim()) {
    fail('VITE_APP_VERSION and VITE_BUILD_NUMBER are required when web analytics is enabled');
  }
  if (!/^G-[A-Z0-9]+$/.test(process.env.VITE_FIREBASE_MEASUREMENT_ID)) {
    fail('VITE_FIREBASE_MEASUREMENT_ID must use the GA4 G-XXXXXXXX format');
  }
}

if (args.has('--require-native-config')) {
  const androidConfig = path.join(root, 'packages/mobile/android/app/google-services.json');
  const iosConfig = path.join(root, 'packages/mobile/ios/GoogleService-Info.plist');
  if (!fs.existsSync(androidConfig)) fail('Android google-services.json is missing');
  if (!fs.existsSync(iosConfig)) fail('iOS GoogleService-Info.plist is missing');

  if (fs.existsSync(androidConfig)) {
    const config = JSON.parse(fs.readFileSync(androidConfig, 'utf8'));
    const packageNames = (config.client || []).map((client) => client?.client_info?.android_client_info?.package_name);
    if (!packageNames.includes('com.handyapp')) fail('Android Firebase config does not contain com.handyapp');
  }
  if (fs.existsSync(iosConfig)) {
    const plist = fs.readFileSync(iosConfig, 'utf8');
    if (!/<key>BUNDLE_ID<\/key>\s*<string>com\.hermosear\.handy<\/string>/.test(plist)) {
      fail('iOS Firebase config does not contain com.hermosear.handy');
    }
  }
}

if (failures.length) {
  console.error('Analytics release configuration is invalid:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Analytics release configuration is valid (web analytics: ${configuredWebKeys.length === webKeys.length ? 'enabled' : 'disabled'}).`);
