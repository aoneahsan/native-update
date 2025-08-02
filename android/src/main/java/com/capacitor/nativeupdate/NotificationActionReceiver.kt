package com.capacitor.nativeupdate

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf

/**
 * Handles notification actions for background updates
 */
class NotificationActionReceiver : BroadcastReceiver() {
    
    companion object {
        const val ACTION_INSTALL_NOW = "com.capacitor.nativeupdate.ACTION_INSTALL_NOW"
        const val ACTION_INSTALL_LATER = "com.capacitor.nativeupdate.ACTION_INSTALL_LATER"
        const val ACTION_DISMISS = "com.capacitor.nativeupdate.ACTION_DISMISS"
        
        const val EXTRA_UPDATE_TYPE = "update_type"
        const val EXTRA_BUNDLE_ID = "bundle_id"
        const val EXTRA_VERSION = "version"
        
        private const val TAG = "NotificationActionReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        
        Log.d(TAG, "Received action: $action")
        
        when (action) {
            ACTION_INSTALL_NOW -> handleInstallNow(context, intent)
            ACTION_INSTALL_LATER -> handleInstallLater(context, intent)
            ACTION_DISMISS -> handleDismiss(context, intent)
        }
        
        // Cancel the notification
        val notificationManager = BackgroundNotificationManager(context)
        notificationManager.cancelUpdateNotification()
    }
    
    private fun handleInstallNow(context: Context, intent: Intent) {
        val updateType = intent.getStringExtra(EXTRA_UPDATE_TYPE) ?: return
        
        when (updateType) {
            "live_update" -> {
                val bundleId = intent.getStringExtra(EXTRA_BUNDLE_ID) ?: return
                // Trigger immediate installation through WorkManager
                val workRequest = OneTimeWorkRequestBuilder<BackgroundUpdateWorker>()
                    .setInputData(workDataOf(
                        "action" to "install_bundle",
                        "bundle_id" to bundleId
                    ))
                    .build()
                
                WorkManager.getInstance(context).enqueueUniqueWork(
                    "install_update_$bundleId",
                    ExistingWorkPolicy.REPLACE,
                    workRequest
                )
                
                Log.d(TAG, "Scheduled immediate installation for bundle: $bundleId")
            }
            "app_update" -> {
                // Open Play Store for app update
                try {
                    val packageName = context.packageName
                    val playStoreIntent = Intent(Intent.ACTION_VIEW).apply {
                        data = android.net.Uri.parse("market://details?id=$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(playStoreIntent)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to open Play Store", e)
                }
            }
        }
    }
    
    private fun handleInstallLater(context: Context, intent: Intent) {
        // Store preference to install later
        val prefs = context.getSharedPreferences("capacitor_native_update", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("pending_update", true)
            putLong("deferred_until", System.currentTimeMillis() + 24 * 60 * 60 * 1000) // 24 hours
            apply()
        }
        
        Log.d(TAG, "Update deferred for 24 hours")
    }
    
    private fun handleDismiss(context: Context, intent: Intent) {
        // Just dismiss the notification, already handled in onReceive
        Log.d(TAG, "Update notification dismissed")
    }
}