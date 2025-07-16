package com.capacitor.nativeupdate

import android.content.Context
import android.content.pm.PackageManager
import androidx.work.*
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.concurrent.TimeUnit
import org.json.JSONObject
import org.json.JSONArray

@CapacitorPlugin(name = "BackgroundUpdatePlugin")
class BackgroundUpdatePlugin : Plugin() {
    
    private lateinit var notificationManager: BackgroundNotificationManager
    private var backgroundUpdateConfig: BackgroundUpdateConfig? = null
    private var backgroundUpdateStatus: BackgroundUpdateStatus = BackgroundUpdateStatus()
    
    companion object {
        private const val WORK_NAME = "background_update_work"
        private const val WORK_TAG = "capacitor_native_update"
    }
    
    override fun load() {
        super.load()
        notificationManager = BackgroundNotificationManager(context, this)
        notificationManager.createNotificationChannel()
    }
    
    @PluginMethod
    fun enableBackgroundUpdates(call: PluginCall) {
        try {
            val configData = call.data
            val config = BackgroundUpdateConfig.fromJSObject(configData)
            
            backgroundUpdateConfig = config
            backgroundUpdateStatus.enabled = config.enabled
            
            if (config.enabled) {
                scheduleBackgroundWork(config.checkInterval.toLong())
            } else {
                disableBackgroundUpdates()
            }
            
            call.resolve()
        } catch (e: Exception) {
            call.reject("Invalid configuration: ${e.message}")
        }
    }
    
    @PluginMethod
    fun disableBackgroundUpdates(call: PluginCall) {
        disableBackgroundUpdates()
        call.resolve()
    }
    
    @PluginMethod
    fun getBackgroundUpdateStatus(call: PluginCall) {
        call.resolve(backgroundUpdateStatus.toJSObject())
    }
    
    @PluginMethod
    fun scheduleBackgroundCheck(call: PluginCall) {
        val interval = call.getLong("interval", 24 * 60 * 60 * 1000L) // Default 24 hours
        scheduleBackgroundWork(interval)
        call.resolve()
    }
    
    @PluginMethod
    fun triggerBackgroundCheck(call: PluginCall) {
        val workRequest = OneTimeWorkRequestBuilder<BackgroundUpdateWorker>()
            .setInputData(createWorkData())
            .addTag(WORK_TAG)
            .build()
        
        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                "${WORK_NAME}_manual",
                ExistingWorkPolicy.REPLACE,
                workRequest
            )
        
        // Return immediately - actual result will be sent via listeners
        call.resolve(JSObject().put("triggered", true))
    }
    
    @PluginMethod
    fun setNotificationPreferences(call: PluginCall) {
        val preferences = call.data
        notificationManager.setPreferences(preferences)
        call.resolve()
    }
    
    @PluginMethod
    fun getNotificationPermissions(call: PluginCall) {
        val status = notificationManager.getPermissionStatus()
        call.resolve(status.toJSObject())
    }
    
    @PluginMethod
    fun requestNotificationPermissions(call: PluginCall) {
        val granted = notificationManager.requestPermissions()
        call.resolve(JSObject().put("granted", granted))
    }
    
    private fun disableBackgroundUpdates() {
        backgroundUpdateStatus.enabled = false
        backgroundUpdateStatus.isRunning = false
        backgroundUpdateStatus.currentTaskId = null
        
        WorkManager.getInstance(context).cancelAllWorkByTag(WORK_TAG)
    }
    
    private fun scheduleBackgroundWork(intervalMs: Long) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(
                if (backgroundUpdateConfig?.requireWifi == true) 
                    NetworkType.UNMETERED 
                else 
                    NetworkType.CONNECTED
            )
            .setRequiresBatteryNotLow(backgroundUpdateConfig?.respectBatteryOptimization != false)
            .build()
        
        val workRequest = PeriodicWorkRequestBuilder<BackgroundUpdateWorker>(
            intervalMs,
            TimeUnit.MILLISECONDS,
            PeriodicWorkRequest.MIN_PERIODIC_FLEX_MILLIS,
            TimeUnit.MILLISECONDS
        )
            .setConstraints(constraints)
            .setInputData(createWorkData())
            .addTag(WORK_TAG)
            .build()
        
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.REPLACE,
                workRequest
            )
        
        backgroundUpdateStatus.nextCheckTime = System.currentTimeMillis() + intervalMs
    }
    
    private fun createWorkData(): Data {
        val configJson = backgroundUpdateConfig?.toJSONObject()?.toString() ?: "{}"
        return Data.Builder()
            .putString("config", configJson)
            .build()
    }
    
    fun updateBackgroundStatus(status: BackgroundUpdateStatus) {
        backgroundUpdateStatus = status
    }
    
    fun getBackgroundConfig(): BackgroundUpdateConfig? {
        return backgroundUpdateConfig
    }
    
    fun getNotificationManager(): BackgroundNotificationManager {
        return notificationManager
    }
}

data class BackgroundUpdateConfig(
    val enabled: Boolean,
    val checkInterval: Int,
    val updateTypes: List<BackgroundUpdateType>,
    val autoInstall: Boolean = false,
    val notificationPreferences: NotificationPreferences? = null,
    val respectBatteryOptimization: Boolean = true,
    val allowMeteredConnection: Boolean = false,
    val minimumBatteryLevel: Int = 20,
    val requireWifi: Boolean = false,
    val maxRetries: Int = 3,
    val retryDelay: Int = 5000,
    val taskIdentifier: String? = null
) {
    companion object {
        fun fromJSObject(obj: JSObject): BackgroundUpdateConfig {
            val enabled = obj.getBoolean("enabled", false)
            val checkInterval = obj.getInt("checkInterval", 24 * 60 * 60 * 1000)
            val updateTypesArray = obj.getJSONArray("updateTypes")
            val updateTypes = mutableListOf<BackgroundUpdateType>()
            
            for (i in 0 until updateTypesArray.length()) {
                val typeString = updateTypesArray.getString(i)
                BackgroundUpdateType.fromString(typeString)?.let { updateTypes.add(it) }
            }
            
            val notificationPrefs = obj.getJSObject("notificationPreferences")
            
            return BackgroundUpdateConfig(
                enabled = enabled,
                checkInterval = checkInterval,
                updateTypes = updateTypes,
                autoInstall = obj.getBoolean("autoInstall", false),
                notificationPreferences = notificationPrefs?.let { NotificationPreferences.fromJSObject(it) },
                respectBatteryOptimization = obj.getBoolean("respectBatteryOptimization", true),
                allowMeteredConnection = obj.getBoolean("allowMeteredConnection", false),
                minimumBatteryLevel = obj.getInt("minimumBatteryLevel", 20),
                requireWifi = obj.getBoolean("requireWifi", false),
                maxRetries = obj.getInt("maxRetries", 3),
                retryDelay = obj.getInt("retryDelay", 5000),
                taskIdentifier = obj.getString("taskIdentifier")
            )
        }
    }
    
    fun toJSONObject(): JSONObject {
        val obj = JSONObject()
        obj.put("enabled", enabled)
        obj.put("checkInterval", checkInterval)
        obj.put("updateTypes", JSONArray(updateTypes.map { it.value }))
        obj.put("autoInstall", autoInstall)
        obj.put("respectBatteryOptimization", respectBatteryOptimization)
        obj.put("allowMeteredConnection", allowMeteredConnection)
        obj.put("minimumBatteryLevel", minimumBatteryLevel)
        obj.put("requireWifi", requireWifi)
        obj.put("maxRetries", maxRetries)
        obj.put("retryDelay", retryDelay)
        taskIdentifier?.let { obj.put("taskIdentifier", it) }
        return obj
    }
}

enum class BackgroundUpdateType(val value: String) {
    APP_UPDATE("app_update"),
    LIVE_UPDATE("live_update"),
    BOTH("both");
    
    companion object {
        fun fromString(value: String): BackgroundUpdateType? {
            return values().find { it.value == value }
        }
    }
}

data class BackgroundUpdateStatus(
    var enabled: Boolean = false,
    var lastCheckTime: Long? = null,
    var nextCheckTime: Long? = null,
    var lastUpdateTime: Long? = null,
    var currentTaskId: String? = null,
    var isRunning: Boolean = false,
    var checkCount: Int = 0,
    var failureCount: Int = 0,
    var lastError: UpdateError? = null
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("enabled", enabled)
        obj.put("isRunning", isRunning)
        obj.put("checkCount", checkCount)
        obj.put("failureCount", failureCount)
        
        lastCheckTime?.let { obj.put("lastCheckTime", it) }
        nextCheckTime?.let { obj.put("nextCheckTime", it) }
        lastUpdateTime?.let { obj.put("lastUpdateTime", it) }
        currentTaskId?.let { obj.put("currentTaskId", it) }
        lastError?.let { obj.put("lastError", it.toJSObject()) }
        
        return obj
    }
}

data class BackgroundCheckResult(
    val success: Boolean,
    val updatesFound: Boolean,
    val appUpdate: AppUpdateInfo? = null,
    val liveUpdate: LatestVersion? = null,
    val notificationSent: Boolean = false,
    val error: UpdateError? = null
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("success", success)
        obj.put("updatesFound", updatesFound)
        obj.put("notificationSent", notificationSent)
        
        appUpdate?.let { obj.put("appUpdate", it.toJSObject()) }
        liveUpdate?.let { obj.put("liveUpdate", it.toJSObject()) }
        error?.let { obj.put("error", it.toJSObject()) }
        
        return obj
    }
}

data class UpdateError(
    val code: String,
    val message: String
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("code", code)
        obj.put("message", message)
        return obj
    }
}

// Placeholder data classes - would be defined in other plugins
data class AppUpdateInfo(
    val updateAvailable: Boolean,
    val currentVersion: String,
    val availableVersion: String? = null
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("updateAvailable", updateAvailable)
        obj.put("currentVersion", currentVersion)
        availableVersion?.let { obj.put("availableVersion", it) }
        return obj
    }
}

data class LatestVersion(
    val available: Boolean,
    val version: String? = null
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("available", available)
        version?.let { obj.put("version", it) }
        return obj
    }
}