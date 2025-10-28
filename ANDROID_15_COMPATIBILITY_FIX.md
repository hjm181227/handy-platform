# Android 15 Kotlin Compatibility Fix

## Problem
The app was crashing on Android 14 and below due to Kotlin function conflicts with Android 15's new Java functions `removeFirst()` and `removeLast()`. The issue occurred in `react-native-screens` library's `ScreenStack` class.

## Solution Applied
**File Modified:** `packages/mobile/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStack.kt`

**Line 315 - Changed:**
```kotlin
// Before (problematic):
if (drawingOpPool.isEmpty()) DrawingOp() else drawingOpPool.removeLast()

// After (fixed):
if (drawingOpPool.isEmpty()) DrawingOp() else drawingOpPool.removeAt(drawingOpPool.lastIndex)
```

## How to Apply This Fix
1. Navigate to the file: `packages/mobile/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStack.kt`
2. Find line 315 with `drawingOpPool.removeLast()`
3. Replace with `drawingOpPool.removeAt(drawingOpPool.lastIndex)`

## Result
- ✅ App builds successfully with Hermes enabled
- ✅ No more Kotlin function conflicts
- ✅ Compatible with both Android 14 and Android 15
- ✅ APK/AAB generation works correctly

## Build Verification
- **APK Generated:** `packages/mobile/android/app/build/outputs/apk/release/app-release.apk` (26.1 MB)
- **Build Status:** SUCCESS
- **Date Applied:** October 23, 2024

## Note
This is a temporary manual fix. When updating `react-native-screens` in the future, this fix will need to be reapplied unless the library officially resolves the issue.