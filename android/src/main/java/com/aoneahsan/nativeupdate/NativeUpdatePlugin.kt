package com.aoneahsan.nativeupdate

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import android.Manifest

@CapacitorPlugin(
    name = "NativeUpdate",
    permissions = [
        Permission(
            strings = [Manifest.permission.WRITE_EXTERNAL_STORAGE],
            alias = "storage"
        )
    ]
)
class NativeUpdatePlugin : Plugin() {
    
    private lateinit var liveUpdatePlugin: LiveUpdatePlugin
    private lateinit var appUpdatePlugin: AppUpdatePlugin
    private lateinit var appReviewPlugin: AppReviewPlugin
    private lateinit var backgroundUpdatePlugin: BackgroundUpdatePlugin
    private lateinit var securityManager: SecurityManager
    private var isInitialized = false
    
    override fun load() {
        super.load()
        
        // Initialize sub-plugins
        liveUpdatePlugin = LiveUpdatePlugin(activity, context)
        appUpdatePlugin = AppUpdatePlugin(activity, context)
        appReviewPlugin = AppReviewPlugin(activity, context)
        backgroundUpdatePlugin = BackgroundUpdatePlugin()
        securityManager = SecurityManager(context)
        
        // Set up app update event listener
        appUpdatePlugin.setEventListener { eventName, data ->
            notifyListeners(eventName, data)
        }
        
        // Register plugins with manager for background access
        BackgroundUpdateManager.registerLiveUpdatePlugin(liveUpdatePlugin)
        BackgroundUpdateManager.registerAppUpdatePlugin(appUpdatePlugin)
        
        // Set up listeners
        liveUpdatePlugin.setProgressListener { progress ->
            notifyListeners("downloadProgress", progress)
        }
        
        liveUpdatePlugin.setStateChangeListener { state ->
            notifyListeners("updateStateChanged", state)
        }
    }
    
    @PluginMethod
    fun initialize(call: PluginCall) {
        val config = call.getObject("config")
        if (config == null) {
            call.reject("Configuration object is required")
            return
        }
        
        try {
            // Initialize with filesystem and preferences if provided
            // In Android, we typically don't need these as we use native APIs
            
            // Apply configuration
            configure(call)
            
            isInitialized = true
            call.resolve()
        } catch (e: Exception) {
            call.reject("Initialization failed", e)
        }
    }
    
    @PluginMethod
    fun isInitialized(call: PluginCall) {
        call.resolve(JSObject().put("initialized", isInitialized))
    }
    
    @PluginMethod
    fun cleanup(call: PluginCall) {
        try {
            // Clean up any resources
            liveUpdatePlugin.cleanup()
            backgroundUpdatePlugin.disableBackgroundUpdates()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Cleanup failed", e)
        }
    }
    
    @PluginMethod
    fun configure(call: PluginCall) {
        val config = call.getObject("config")
        
        if (config == null) {
            call.reject("Configuration object is required")
            return
        }
        
        try {
            // Validate security settings
            val securityConfig = config.getJSObject("security")
            if (securityConfig != null) {
                securityManager.configure(securityConfig)
            }
            
            // Configure sub-plugins
            config.getJSObject("liveUpdate")?.let {
                liveUpdatePlugin.configure(it)
            }
            
            config.getJSObject("appUpdate")?.let {
                appUpdatePlugin.configure(it)
            }
            
            config.getJSObject("appReview")?.let {
                appReviewPlugin.configure(it)
            }
            
            // Background update configuration is handled separately via enableBackgroundUpdates
            
            call.resolve()
        } catch (e: Exception) {
            call.reject("Configuration failed", e)
        }
    }
    
    @PluginMethod
    fun getSecurityInfo(call: PluginCall) {
        call.resolve(securityManager.getSecurityInfo())
    }
    
    // Live Update Methods
    
    @PluginMethod
    fun sync(call: PluginCall) {
        liveUpdatePlugin.sync(call)
    }
    
    @PluginMethod
    fun download(call: PluginCall) {
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("storage", call, "handleStoragePermission")
            return
        }
        liveUpdatePlugin.download(call)
    }
    
    @PluginMethod
    fun set(call: PluginCall) {
        liveUpdatePlugin.set(call)
    }
    
    @PluginMethod
    fun reload(call: PluginCall) {
        liveUpdatePlugin.reload(call)
    }
    
    @PluginMethod
    fun reset(call: PluginCall) {
        try {
            // Reset plugin state
            liveUpdatePlugin.reset(call)
            isInitialized = false
        } catch (e: Exception) {
            call.reject("Reset failed", e)
        }
    }
    
    @PluginMethod
    fun current(call: PluginCall) {
        liveUpdatePlugin.current(call)
    }
    
    @PluginMethod
    fun list(call: PluginCall) {
        liveUpdatePlugin.list(call)
    }
    
    @PluginMethod
    fun delete(call: PluginCall) {
        liveUpdatePlugin.delete(call)
    }
    
    @PluginMethod
    fun notifyAppReady(call: PluginCall) {
        liveUpdatePlugin.notifyAppReady(call)
    }
    
    @PluginMethod
    fun getLatest(call: PluginCall) {
        liveUpdatePlugin.getLatest(call)
    }
    
    @PluginMethod
    fun setChannel(call: PluginCall) {
        liveUpdatePlugin.setChannel(call)
    }
    
    @PluginMethod
    fun setUpdateUrl(call: PluginCall) {
        liveUpdatePlugin.setUpdateUrl(call)
    }
    
    @PluginMethod
    fun validateUpdate(call: PluginCall) {
        liveUpdatePlugin.validateUpdate(call)
    }
    
    // App Update Methods
    
    @PluginMethod
    fun getAppUpdateInfo(call: PluginCall) {
        appUpdatePlugin.getAppUpdateInfo(call)
    }
    
    @PluginMethod
    fun performImmediateUpdate(call: PluginCall) {
        appUpdatePlugin.performImmediateUpdate(call)
    }
    
    @PluginMethod
    fun startFlexibleUpdate(call: PluginCall) {
        appUpdatePlugin.startFlexibleUpdate(call)
    }
    
    @PluginMethod
    fun completeFlexibleUpdate(call: PluginCall) {
        appUpdatePlugin.completeFlexibleUpdate(call)
    }
    
    @PluginMethod
    fun openAppStore(call: PluginCall) {
        appUpdatePlugin.openAppStore(call)
    }
    
    // App Review Methods
    
    @PluginMethod
    fun requestReview(call: PluginCall) {
        appReviewPlugin.requestReview(call)
    }
    
    @PluginMethod
    fun canRequestReview(call: PluginCall) {
        appReviewPlugin.canRequestReview(call)
    }
    
    // Background Update Methods
    
    @PluginMethod
    fun enableBackgroundUpdates(call: PluginCall) {
        backgroundUpdatePlugin.enableBackgroundUpdates(call)
    }
    
    @PluginMethod
    fun disableBackgroundUpdates(call: PluginCall) {
        backgroundUpdatePlugin.disableBackgroundUpdates(call)
    }
    
    @PluginMethod
    fun getBackgroundUpdateStatus(call: PluginCall) {
        backgroundUpdatePlugin.getBackgroundUpdateStatus(call)
    }
    
    @PluginMethod
    fun scheduleBackgroundCheck(call: PluginCall) {
        backgroundUpdatePlugin.scheduleBackgroundCheck(call)
    }
    
    @PluginMethod
    fun triggerBackgroundCheck(call: PluginCall) {
        backgroundUpdatePlugin.triggerBackgroundCheck(call)
    }
    
    @PluginMethod
    fun setNotificationPreferences(call: PluginCall) {
        backgroundUpdatePlugin.setNotificationPreferences(call)
    }
    
    @PluginMethod
    fun getNotificationPermissions(call: PluginCall) {
        backgroundUpdatePlugin.getNotificationPermissions(call)
    }
    
    @PluginMethod
    fun requestNotificationPermissions(call: PluginCall) {
        backgroundUpdatePlugin.requestNotificationPermissions(call)
    }
    
    // Permission Callbacks
    
    @PluginMethod
    fun handleStoragePermission(call: PluginCall) {
        if (hasPermission("storage")) {
            // Retry the original method
            when (call.methodName) {
                "download" -> liveUpdatePlugin.download(call)
                else -> call.reject("Unknown method")
            }
        } else {
            call.reject("Storage permission denied")
        }
    }
    
    override fun hasRequiredPermissions(): Boolean {
        return hasPermission("storage")
    }
}