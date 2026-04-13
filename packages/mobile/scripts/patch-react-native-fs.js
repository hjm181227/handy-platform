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

// Patch 4: iOS codegen - Add ResultT type alias for RN 0.85 compatibility
const specHeader = path.join(pkgDir, 'ios', 'generated', 'RNReactNativeFsSpec', 'RNReactNativeFsSpec.h');
if (fs.existsSync(specHeader)) {
  let content = fs.readFileSync(specHeader, 'utf8');
  if (!content.includes('using ResultT = Constants;')) {
    content = content.replace(
      '      struct Builder {',
      '      struct Builder {\n        using ResultT = Constants;'
    );
    fs.writeFileSync(specHeader, content);
    console.log('[patch] Fixed RNReactNativeFsSpec.h (added ResultT for RN 0.85)');
  }
}

// Patch 5: @bam.tech/react-native-image-resizer - Remove ALAssetsLibrary (iOS 26)
const imageResizerPaths = [
  path.join(__dirname, '..', 'node_modules', '@bam.tech', 'react-native-image-resizer'),
  path.join(__dirname, '..', '..', 'node_modules', '@bam.tech', 'react-native-image-resizer'),
  path.join(__dirname, '..', '..', '..', 'node_modules', '@bam.tech', 'react-native-image-resizer'),
];
let imageResizerDir = null;
for (const p of imageResizerPaths) {
  if (fs.existsSync(p)) { imageResizerDir = p; break; }
}
if (imageResizerDir) {
  // Patch podspec
  const podspec = path.join(imageResizerDir, 'react-native-image-resizer.podspec');
  if (fs.existsSync(podspec)) {
    let content = fs.readFileSync(podspec, 'utf8');
    if (content.includes("'AssetsLibrary'")) {
      content = content.replace("'AssetsLibrary', 'MobileCoreServices'", "'MobileCoreServices'");
    }
    if (content.includes('RCT-Folly')) {
      content = content.replace(/if ENV\['RCT_NEW_ARCH_ENABLED'\][\s\S]*?end/m, 'install_modules_dependencies(s)');
    }
    fs.writeFileSync(podspec, content);
    console.log('[patch] Fixed react-native-image-resizer.podspec');
  }
  // Patch ImageResizer.mm - remove ALAssetsLibrary
  const mmFile = path.join(imageResizerDir, 'ios', 'ImageResizer.mm');
  if (fs.existsSync(mmFile)) {
    let content = fs.readFileSync(mmFile, 'utf8');
    if (content.includes('#import <AssetsLibrary/AssetsLibrary.h>')) {
      content = content.replace('#import <AssetsLibrary/AssetsLibrary.h>', '// ALAssetsLibrary removed in iOS 26');
      // Remove assets-library code block
      content = content.replace(
        /if\(\[path hasPrefix:@"assets-library"\]\) \{[\s\S]*?return res;\s*\} else \{/m,
        '{'
      );
      fs.writeFileSync(mmFile, content);
      console.log('[patch] Fixed ImageResizer.mm (removed ALAssetsLibrary)');
    }
  }
  // Patch Android build.gradle - compileSdk for AGP 8.12+
  const androidGradle = path.join(imageResizerDir, 'android', 'build.gradle');
  if (fs.existsSync(androidGradle)) {
    let content = fs.readFileSync(androidGradle, 'utf8');
    if (content.includes('compileSdkVersion getExtOrIntegerDefault')) {
      content = content.replace(
        'compileSdkVersion getExtOrIntegerDefault("compileSdkVersion")',
        'compileSdk rootProject.ext.has("compileSdkVersion") ? rootProject.ext.get("compileSdkVersion") : 35'
      );
      fs.writeFileSync(androidGradle, content);
      console.log('[patch] Fixed react-native-image-resizer android/build.gradle (compileSdk)');
    }
  }
}

// Patch 6: react-native-screens - Fix RN 0.85 deprecated APIs
const screensPaths = [
  path.join(__dirname, '..', 'node_modules', 'react-native-screens'),
  path.join(__dirname, '..', '..', 'node_modules', 'react-native-screens'),
  path.join(__dirname, '..', '..', '..', 'node_modules', 'react-native-screens'),
];
let screensDir = null;
for (const p of screensPaths) {
  if (fs.existsSync(p)) { screensDir = p; break; }
}
if (screensDir) {
  // Fix parentShadowView -> parentTag
  const stackMm = path.join(screensDir, 'ios', 'RNSScreenStack.mm');
  if (fs.existsSync(stackMm)) {
    let content = fs.readFileSync(stackMm, 'utf8');
    if (content.includes('mutation.parentShadowView.tag')) {
      content = content.replace('mutation.parentShadowView.tag', 'mutation.parentTag');
      fs.writeFileSync(stackMm, content);
      console.log('[patch] Fixed RNSScreenStack.mm (parentShadowView -> parentTag)');
    }
  }
  // Fix parentShadowView in RNSScreenRemovalListener.cpp
  const listenerCpp = path.join(screensDir, 'cpp', 'RNSScreenRemovalListener.cpp');
  if (fs.existsSync(listenerCpp)) {
    let content = fs.readFileSync(listenerCpp, 'utf8');
    if (content.includes('mutation.parentShadowView.componentName')) {
      content = content.replace(
        /strcmp\(mutation\.parentShadowView\.componentName, "RNSScreenStack"\)/,
        'strcmp(mutation.oldChildShadowView.componentName, "RNSScreen")'
      );
      fs.writeFileSync(listenerCpp, content);
      console.log('[patch] Fixed RNSScreenRemovalListener.cpp');
    }
  }
  // Fix ShadowNode::Shared -> std::shared_ptr<const ShadowNode>
  const shadowFiles = [
    path.join(screensDir, 'common', 'cpp', 'react', 'renderer', 'components', 'rnscreens', 'RNSScreenShadowNode.h'),
    path.join(screensDir, 'common', 'cpp', 'react', 'renderer', 'components', 'rnscreens', 'RNSScreenShadowNode.cpp'),
  ];
  for (const f of shadowFiles) {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      if (content.includes('ShadowNode::Shared')) {
        content = content.replace(/ShadowNode::Shared/g, 'std::shared_ptr<const ShadowNode>');
        fs.writeFileSync(f, content);
        console.log(`[patch] Fixed ${path.basename(f)} (ShadowNode::Shared)`);
      }
    }
  }
}

console.log('[patch] Done');
