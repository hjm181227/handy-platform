package com.handyapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Native Module that exposes BuildConfig values to React Native
 * This allows JavaScript code to access build-time configuration like APP_ENV
 */
class BuildConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BuildConfig"
    }

    /**
     * Get all BuildConfig constants as a map
     * Automatically called when accessing NativeModules.BuildConfig
     */
    override fun getConstants(): MutableMap<String, Any> {
        val constants = HashMap<String, Any>()

        // Expose APP_ENV from BuildConfig
        constants["APP_ENV"] = BuildConfig.APP_ENV

        // You can add more BuildConfig fields here if needed
        constants["DEBUG"] = BuildConfig.DEBUG
        constants["VERSION_NAME"] = BuildConfig.VERSION_NAME
        constants["VERSION_CODE"] = BuildConfig.VERSION_CODE

        return constants
    }

    /**
     * Method to get APP_ENV value (alternative access method)
     */
    @ReactMethod
    fun getAppEnv(promise: Promise) {
        try {
            promise.resolve(BuildConfig.APP_ENV)
        } catch (e: Exception) {
            promise.reject("BUILD_CONFIG_ERROR", "Failed to read APP_ENV", e)
        }
    }
}
