package com.capacitor.nativeupdate

import android.content.Context
import androidx.work.*
import com.getcapacitor.Bridge
import com.getcapacitor.JSObject
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class BackgroundUpdateWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {
    
    companion object {
        private const val TAG = "BackgroundUpdateWorker"
        private const val NOTIFICATION_ID = 1001
    }
    
    override suspend fun doWork(): Result {
        return withContext(Dispatchers.IO) {
            try {
                val configJson = inputData.getString("config")
                val config = parseConfig(configJson)
                
                if (config == null || !config.enabled) {
                    return@withContext Result.failure()
                }
                
                val result = performBackgroundCheck(config)
                
                // Update plugin status
                updatePluginStatus(result)
                
                // Send notification if updates found
                if (result.updatesFound) {
                    sendNotification(result)
                }
                
                // Notify listeners
                notifyListeners(result)
                
                if (result.success) Result.success() else Result.retry()
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Background update failed", e)
                Result.failure()
            }
        }
    }
    
    private fun parseConfig(configJson: String?): BackgroundUpdateConfig? {
        return try {
            configJson?.let {
                val jsonObject = JSONObject(it)
                val jsObject = JSObject.fromJSONObject(jsonObject)
                BackgroundUpdateConfig.fromJSObject(jsObject)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to parse config", e)
            null
        }
    }
    
    private suspend fun performBackgroundCheck(config: BackgroundUpdateConfig): BackgroundCheckResult {
        try {
            var appUpdate: AppUpdateInfo? = null
            var liveUpdate: LatestVersion? = null
            
            // Check for app updates
            if (config.updateTypes.contains(BackgroundUpdateType.APP_UPDATE) ||
                config.updateTypes.contains(BackgroundUpdateType.BOTH)) {
                appUpdate = checkForAppUpdate()
            }
            
            // Check for live updates
            if (config.updateTypes.contains(BackgroundUpdateType.LIVE_UPDATE) ||
                config.updateTypes.contains(BackgroundUpdateType.BOTH)) {
                liveUpdate = checkForLiveUpdate()
            }
            
            val updatesFound = (appUpdate?.updateAvailable == true) || (liveUpdate?.available == true)
            
            return BackgroundCheckResult(
                success = true,
                updatesFound = updatesFound,
                appUpdate = appUpdate,
                liveUpdate = liveUpdate,
                notificationSent = false // Will be updated after notification is sent
            )
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Background check failed", e)
            return BackgroundCheckResult(
                success = false,
                updatesFound = false,
                error = UpdateError("UNKNOWN_ERROR", e.message ?: "Unknown error")
            )
        }
    }
    
    private suspend fun checkForAppUpdate(): AppUpdateInfo? {
        return withContext(Dispatchers.IO) {
            try {
                val appUpdatePlugin = BackgroundUpdateManager.getAppUpdatePlugin()
                if (appUpdatePlugin != null) {
                    // Use actual plugin to check for updates
                    appUpdatePlugin.getAppUpdateInfoAsync()
                } else {
                    // Fallback to basic implementation
                    val currentVersion = getCurrentAppVersion()
                    val availableVersion = getAvailableAppVersion()
                    
                    AppUpdateInfo(
                        updateAvailable = availableVersion != currentVersion,
                        currentVersion = currentVersion,
                        availableVersion = if (availableVersion != currentVersion) availableVersion else null
                    )
                }
            } catch (e: Exception) {
                android.util.Log.e(TAG, "App update check failed", e)
                null
            }
        }
    }
    
    private suspend fun checkForLiveUpdate(): LatestVersion? {
        return withContext(Dispatchers.IO) {
            try {
                val liveUpdatePlugin = BackgroundUpdateManager.getLiveUpdatePlugin()
                if (liveUpdatePlugin != null) {
                    // Use actual plugin to check for updates
                    liveUpdatePlugin.getLatestVersionAsync()
                } else {
                    // Fallback to basic implementation
                    val hasUpdate = checkForLiveUpdateAvailable()
                    
                    LatestVersion(
                        available = hasUpdate,
                        version = if (hasUpdate) "2.0.0" else null
                    )
                }
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Live update check failed", e)
                null
            }
        }
    }
    
    private fun getCurrentAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }
    
    private fun getAvailableAppVersion(): String {
        // This would typically check Google Play Store API
        // For demo purposes, we'll return a mock version
        return "1.0.1"
    }
    
    private fun checkForLiveUpdateAvailable(): Boolean {
        // This would typically check the live update server
        // For demo purposes, we'll return false
        return false
    }
    
    private fun sendNotification(result: BackgroundCheckResult) {
        try {
            val plugin = getBackgroundUpdatePlugin()
            val notificationManager = plugin?.getNotificationManager()
            
            if (notificationManager != null) {
                val sent = notificationManager.sendUpdateNotification(
                    result.appUpdate,
                    result.liveUpdate
                )
                
                // Update result
                result.copy(notificationSent = sent)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to send notification", e)
        }
    }
    
    private fun updatePluginStatus(result: BackgroundCheckResult) {
        try {
            val plugin = getBackgroundUpdatePlugin()
            val currentStatus = plugin?.getBackgroundConfig()?.let { BackgroundUpdateStatus() } ?: return
            
            currentStatus.apply {
                isRunning = false
                checkCount++
                lastCheckTime = System.currentTimeMillis()
                
                if (result.success) {
                    lastError = null
                    if (result.updatesFound) {
                        lastUpdateTime = System.currentTimeMillis()
                    }
                } else {
                    failureCount++
                    lastError = result.error
                }
            }
            
            plugin.updateBackgroundStatus(currentStatus)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to update plugin status", e)
        }
    }
    
    private fun notifyListeners(result: BackgroundCheckResult) {
        try {
            val plugin = getBackgroundUpdatePlugin()
            
            // Notify about progress
            val progressData = JSObject()
            progressData.put("type", if (result.appUpdate != null) "app_update" else "live_update")
            progressData.put("status", if (result.success) "completed" else "failed")
            progressData.put("percent", 100)
            
            plugin?.notifyListeners("backgroundUpdateProgress", progressData)
            
            // Notify about notification if sent
            if (result.notificationSent) {
                val notificationData = JSObject()
                notificationData.put("type", if (result.appUpdate != null) "app_update" else "live_update")
                notificationData.put("updateAvailable", result.updatesFound)
                notificationData.put("action", "shown")
                
                plugin?.notifyListeners("backgroundUpdateNotification", notificationData)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to notify listeners", e)
        }
    }
    
    private fun getBackgroundUpdatePlugin(): BackgroundUpdatePlugin? {
        return try {
            BackgroundUpdateManager.getBackgroundUpdatePlugin()
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to get plugin", e)
            null
        }
    }
}