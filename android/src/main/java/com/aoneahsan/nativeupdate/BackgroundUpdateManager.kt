package com.aoneahsan.nativeupdate

/**
 * Singleton manager to maintain references to plugin instances
 * This allows background workers to access plugin functionality
 */
object BackgroundUpdateManager {
    @Volatile
    private var backgroundUpdatePlugin: BackgroundUpdatePlugin? = null
    
    @Volatile
    private var liveUpdatePlugin: LiveUpdatePlugin? = null
    
    @Volatile
    private var appUpdatePlugin: AppUpdatePlugin? = null
    
    fun registerBackgroundUpdatePlugin(plugin: BackgroundUpdatePlugin) {
        backgroundUpdatePlugin = plugin
    }
    
    fun registerLiveUpdatePlugin(plugin: LiveUpdatePlugin) {
        liveUpdatePlugin = plugin
    }
    
    fun registerAppUpdatePlugin(plugin: AppUpdatePlugin) {
        appUpdatePlugin = plugin
    }
    
    fun getBackgroundUpdatePlugin(): BackgroundUpdatePlugin? {
        return backgroundUpdatePlugin
    }
    
    fun getLiveUpdatePlugin(): LiveUpdatePlugin? {
        return liveUpdatePlugin
    }
    
    fun getAppUpdatePlugin(): AppUpdatePlugin? {
        return appUpdatePlugin
    }
    
    fun clear() {
        backgroundUpdatePlugin = null
        liveUpdatePlugin = null
        appUpdatePlugin = null
    }
}