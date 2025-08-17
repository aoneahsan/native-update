package com.aoneahsan.nativeupdate

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallState
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.android.play.core.ktx.isFlexibleUpdateAllowed
import com.google.android.play.core.ktx.isImmediateUpdateAllowed
import com.google.android.gms.tasks.Tasks
import kotlinx.coroutines.tasks.await

class AppUpdatePlugin(
    private val activity: Activity,
    private val context: Context
) {
    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(context)
    private var config: JSObject? = null
    private var updateInfo: AppUpdateInfo? = null
    
    companion object {
        const val REQUEST_CODE_UPDATE = 12345
    }
    
    private val installStateUpdatedListener = InstallStateUpdatedListener { state ->
        handleInstallState(state)
    }
    
    init {
        appUpdateManager.registerListener(installStateUpdatedListener)
    }
    
    fun configure(config: JSObject) {
        this.config = config
    }
    
    fun getAppUpdateInfo(call: PluginCall) {
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo
        
        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            this.updateInfo = appUpdateInfo
            
            val result = JSObject()
            result.put("updateAvailable", appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE)
            result.put("currentVersion", getCurrentAppVersion())
            result.put("availableVersion", appUpdateInfo.availableVersionCode().toString())
            result.put("updatePriority", appUpdateInfo.updatePriority())
            result.put("immediateUpdateAllowed", appUpdateInfo.isImmediateUpdateAllowed)
            result.put("flexibleUpdateAllowed", appUpdateInfo.isFlexibleUpdateAllowed)
            result.put("clientVersionStalenessDays", appUpdateInfo.clientVersionStalenessDays() ?: -1)
            
            // Add install status if update is in progress
            if (appUpdateInfo.installStatus() != InstallStatus.UNKNOWN) {
                result.put("installStatus", getInstallStatusString(appUpdateInfo.installStatus()))
                result.put("bytesDownloaded", appUpdateInfo.bytesDownloaded())
                result.put("totalBytesToDownload", appUpdateInfo.totalBytesToDownload())
            }
            
            call.resolve(result)
        }.addOnFailureListener { e ->
            call.reject("UPDATE_CHECK_FAILED", e.message)
        }
    }
    
    fun performImmediateUpdate(call: PluginCall) {
        val appUpdateInfo = updateInfo
        
        if (appUpdateInfo == null) {
            // Need to check for updates first
            appUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
                this.updateInfo = info
                startImmediateUpdate(info, call)
            }.addOnFailureListener { e ->
                call.reject("UPDATE_CHECK_FAILED", e.message)
            }
        } else {
            startImmediateUpdate(appUpdateInfo, call)
        }
    }
    
    fun startFlexibleUpdate(call: PluginCall) {
        val appUpdateInfo = updateInfo
        
        if (appUpdateInfo == null) {
            // Need to check for updates first
            appUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
                this.updateInfo = info
                startFlexibleUpdateFlow(info, call)
            }.addOnFailureListener { e ->
                call.reject("UPDATE_CHECK_FAILED", e.message)
            }
        } else {
            startFlexibleUpdateFlow(appUpdateInfo, call)
        }
    }
    
    fun completeFlexibleUpdate(call: PluginCall) {
        appUpdateManager.completeUpdate()
        call.resolve()
    }
    
    fun openAppStore(call: PluginCall) {
        try {
            val packageName = call.getString("appId") ?: context.packageName
            
            // Try to open in Play Store app first
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName"))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            } catch (e: Exception) {
                // Fallback to web browser
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$packageName"))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
            
            call.resolve()
        } catch (e: Exception) {
            call.reject("OPEN_STORE_FAILED", e.message)
        }
    }
    
    private fun startImmediateUpdate(appUpdateInfo: AppUpdateInfo, call: PluginCall) {
        if (!appUpdateInfo.isImmediateUpdateAllowed) {
            call.reject("UPDATE_NOT_ALLOWED", "Immediate update is not allowed")
            return
        }
        
        try {
            val updateOptions = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
            
            appUpdateManager.startUpdateFlow(
                appUpdateInfo,
                activity,
                updateOptions
            )
            
            call.resolve()
        } catch (e: Exception) {
            call.reject("UPDATE_FAILED", e.message)
        }
    }
    
    private fun startFlexibleUpdateFlow(appUpdateInfo: AppUpdateInfo, call: PluginCall) {
        if (!appUpdateInfo.isFlexibleUpdateAllowed) {
            call.reject("UPDATE_NOT_ALLOWED", "Flexible update is not allowed")
            return
        }
        
        try {
            val updateOptions = AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()
            
            appUpdateManager.startUpdateFlow(
                appUpdateInfo,
                activity,
                updateOptions
            )
            
            call.resolve()
        } catch (e: Exception) {
            call.reject("UPDATE_FAILED", e.message)
        }
    }
    
    private fun handleInstallState(state: InstallState) {
        when (state.installStatus()) {
            InstallStatus.DOWNLOADED -> {
                // Update has been downloaded, prompt user to restart
                popupSnackbarForCompleteUpdate()
            }
            InstallStatus.INSTALLED -> {
                // Update installed, cleanup
                appUpdateManager.unregisterListener(installStateUpdatedListener)
            }
            InstallStatus.FAILED -> {
                // Update failed
            }
            else -> {
                // Handle other states
            }
        }
    }
    
    private fun popupSnackbarForCompleteUpdate() {
        // In a real implementation, show a snackbar or notification
        // For now, we'll just complete the update
        appUpdateManager.completeUpdate()
    }
    
    private fun getCurrentAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }
    
    private fun getInstallStatusString(status: Int): String {
        return when (status) {
            InstallStatus.PENDING -> "PENDING"
            InstallStatus.DOWNLOADING -> "DOWNLOADING"
            InstallStatus.DOWNLOADED -> "DOWNLOADED"
            InstallStatus.INSTALLING -> "INSTALLING"
            InstallStatus.INSTALLED -> "INSTALLED"
            InstallStatus.FAILED -> "FAILED"
            InstallStatus.CANCELED -> "CANCELED"
            else -> "UNKNOWN"
        }
    }
    
    fun onActivityResult(requestCode: Int, resultCode: Int) {
        if (requestCode == REQUEST_CODE_UPDATE) {
            when (resultCode) {
                Activity.RESULT_OK -> {
                    // Update flow completed successfully
                }
                Activity.RESULT_CANCELED -> {
                    // User cancelled the update
                }
                else -> {
                    // Update flow failed
                }
            }
        }
    }
    
    fun onResume() {
        // Check if update is waiting to be installed
        appUpdateManager.appUpdateInfo.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                // Resume the update
                val updateOptions = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
                appUpdateManager.startUpdateFlow(
                    appUpdateInfo,
                    activity,
                    updateOptions
                )
            }
        }
    }
    
    // Async method for background update checks
    suspend fun getAppUpdateInfoAsync(): AppUpdateInfo? {
        return try {
            val appUpdateInfo = appUpdateManager.appUpdateInfo.await()
            
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                AppUpdateInfo(
                    updateAvailable = true,
                    currentVersion = getCurrentAppVersion(),
                    availableVersion = appUpdateInfo.availableVersionCode().toString()
                )
            } else {
                AppUpdateInfo(
                    updateAvailable = false,
                    currentVersion = getCurrentAppVersion(),
                    availableVersion = null
                )
            }
        } catch (e: Exception) {
            null
        }
    }
}