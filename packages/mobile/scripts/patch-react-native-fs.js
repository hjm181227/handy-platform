#!/usr/bin/env node

/**
 * Manual patch script for @dr.pogodin/react-native-fs@2.28.0
 * Required because patch-package can't find hoisted packages in monorepo
 *
 * Fixes:
 * 1. AGP version mismatch (7.2.1 -> 8.7.2)
 * 2. Kotlin 2.0 removeLast() deprecation
 * 3. Promise.reject(null, ...) incompatible with RN 0.76
 */

const fs = require('fs');
const path = require('path');

// Find the package in possible locations
const possiblePaths = [
  path.join(__dirname, '..', 'node_modules', '@dr.pogodin', 'react-native-fs'),
  path.join(__dirname, '..', '..', 'node_modules', '@dr.pogodin', 'react-native-fs'),
  path.join(__dirname, '..', '..', '..', 'node_modules', '@dr.pogodin', 'react-native-fs'),
];

let pkgDir = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    pkgDir = p;
    break;
  }
}

if (!pkgDir) {
  console.warn('[patch] @dr.pogodin/react-native-fs not found, skipping patch');
  process.exit(0);
}

console.log(`[patch] Patching @dr.pogodin/react-native-fs at ${pkgDir}`);

// Patch 1: build.gradle - AGP version
const buildGradle = path.join(pkgDir, 'android', 'build.gradle');
if (fs.existsSync(buildGradle)) {
  let content = fs.readFileSync(buildGradle, 'utf8');
  content = content.replace(
    'classpath "com.android.tools.build:gradle:7.2.1"',
    'classpath "com.android.tools.build:gradle:8.7.2"'
  );
  fs.writeFileSync(buildGradle, content);
  console.log('[patch] Fixed build.gradle AGP version');
}

// Patch 2 & 3: ReactNativeFsModule.kt
const moduleKt = path.join(pkgDir, 'android', 'src', 'main', 'java', 'com', 'drpogodin', 'reactnativefs', 'ReactNativeFsModule.kt');
if (fs.existsSync(moduleKt)) {
  let content = fs.readFileSync(moduleKt, 'utf8');
  content = content.replace(
    'val next = queue.removeLast()',
    'val next = queue.removeAt(queue.lastIndex)'
  );
  content = content.replace(
    'promise.reject(null, ex!!.message)',
    'promise.reject("EUNSPECIFIED", ex!!.message)'
  );
  fs.writeFileSync(moduleKt, content);
  console.log('[patch] Fixed ReactNativeFsModule.kt (removeLast + reject)');
}

console.log('[patch] Done');
