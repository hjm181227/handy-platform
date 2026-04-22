#!/usr/bin/env node

/**
 * Manual patch script for RN 0.85 compatibility
 * Required because patch-package can't find hoisted packages in monorepo
 *
 * react-native-fs replaced with react-native-blob-util (AGP 8.12.0 incompatibility)
 *
 * Remaining:
 * 5. @bam.tech/react-native-image-resizer - ALAssetsLibrary removal (iOS 26) + AGP compat
 * 6. react-native-screens - RN 0.85 deprecated APIs
 */

const fs = require('fs');
const path = require('path');

// Patch A: @react-native-async-storage/async-storage - Remove configurations block (AGP 8.12 conflict)
const asyncStoragePaths = [
  path.join(__dirname, '..', 'node_modules', '@react-native-async-storage', 'async-storage'),
  path.join(__dirname, '..', '..', 'node_modules', '@react-native-async-storage', 'async-storage'),
  path.join(__dirname, '..', '..', '..', 'node_modules', '@react-native-async-storage', 'async-storage'),
];
let asyncStorageDir = null;
for (const p of asyncStoragePaths) {
  if (fs.existsSync(p)) { asyncStorageDir = p; break; }
}
if (asyncStorageDir) {
  const buildGradle = path.join(asyncStorageDir, 'android', 'build.gradle');
  if (fs.existsSync(buildGradle)) {
    let content = fs.readFileSync(buildGradle, 'utf8');
    content = content.replace(
      'configurations {\n    compileClasspath\n}\n\n',
      ''
    );
    fs.writeFileSync(buildGradle, content);
    console.log('[patch] Fixed async-storage build.gradle (removed configurations block)');
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
