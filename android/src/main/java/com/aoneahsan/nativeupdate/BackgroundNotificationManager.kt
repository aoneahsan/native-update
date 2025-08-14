package com.aoneahsan.nativeupdate

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin

class BackgroundNotificationManager(
    private val context: Context,
    private val plugin: BackgroundUpdatePlugin
) {
    
    companion object {
        private const val CHANNEL_ID = "capacitor_native_update"
        private const val CHANNEL_NAME = "App Updates"
        private const val NOTIFICATION_ID = 1001
        private const val ACTION_UPDATE_NOW = "com.aoneahsan.nativeupdate.UPDATE_NOW"
        private const val ACTION_UPDATE_LATER = "com.aoneahsan.nativeupdate.UPDATE_LATER"
        private const val ACTION_DISMISS = "com.aoneahsan.nativeupdate.DISMISS"
    }
    
    private var preferences: NotificationPreferences = NotificationPreferences.default()
    
    fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications for app updates"
                enableLights(true)
                enableVibration(true)
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun setPreferences(preferencesData: JSObject) {
        preferences = NotificationPreferences.fromJSObject(preferencesData)
        
        // Update channel if preferences changed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = preferences.channelId ?: CHANNEL_ID
            val channelName = preferences.channelName ?: CHANNEL_NAME
            
            val channel = NotificationChannel(
                channelId,
                channelName,
                getNotificationImportance(preferences.priority)
            ).apply {
                description = "Notifications for app updates"
                enableLights(true)
                enableVibration(preferences.vibrationEnabled)
                
                if (!preferences.soundEnabled) {
                    setSound(null, null)
                }
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun getPermissionStatus(): NotificationPermissionStatus {
        val notificationManager = NotificationManagerCompat.from(context)
        val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
        
        return NotificationPermissionStatus(
            granted = areNotificationsEnabled,
            canRequest = !areNotificationsEnabled,
            shouldShowRationale = false // Android doesn't have this concept
        )
    }
    
    fun requestPermissions(): Boolean {
        // On Android 13+, notification permissions need to be requested
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }
        
        // For older versions, notifications are enabled by default
        return true
    }
    
    fun sendUpdateNotification(
        appUpdate: AppUpdateInfo?,
        liveUpdate: LatestVersion?
    ): Boolean {
        val permissionStatus = getPermissionStatus()
        if (!permissionStatus.granted) {
            return false
        }
        
        val notificationBuilder = createNotificationBuilder(appUpdate, liveUpdate)
        
        try {
            val notificationManager = NotificationManagerCompat.from(context)
            notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build())
            
            // Notify listeners
            val eventData = JSObject()
            eventData.put("type", if (appUpdate?.updateAvailable == true) "app_update" else "live_update")
            eventData.put("updateAvailable", true)
            eventData.put("version", appUpdate?.availableVersion ?: liveUpdate?.version ?: "unknown")
            eventData.put("action", "shown")
            
            plugin.notifyListeners("backgroundUpdateNotification", eventData)
            
            return true
        } catch (e: Exception) {
            android.util.Log.e("BackgroundNotificationManager", "Failed to send notification", e)
            return false
        }
    }
    
    fun cancelNotification() {
        val notificationManager = NotificationManagerCompat.from(context)
        notificationManager.cancel(NOTIFICATION_ID)
    }
    
    private fun createNotificationBuilder(
        appUpdate: AppUpdateInfo?,
        liveUpdate: LatestVersion?
    ): NotificationCompat.Builder {
        val title = determineTitle(appUpdate, liveUpdate)
        val content = determineContent(appUpdate, liveUpdate)
        
        val builder = NotificationCompat.Builder(context, preferences.channelId ?: CHANNEL_ID)
            .setSmallIcon(getNotificationIcon())
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(NotificationCompat.BigTextStyle().bigText(content))
            .setPriority(getNotificationPriority(preferences.priority))
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
        
        // Set sound
        if (preferences.soundEnabled) {
            builder.setDefaults(NotificationCompat.DEFAULT_SOUND)
        }
        
        // Set vibration
        if (preferences.vibrationEnabled) {
            builder.setVibrate(longArrayOf(0, 300, 300, 300))
        }
        
        // Set content intent (tap action)
        val contentIntent = createContentIntent(appUpdate, liveUpdate)
        builder.setContentIntent(contentIntent)
        
        // Add action buttons if enabled
        if (preferences.showActions) {
            addActionButtons(builder, appUpdate, liveUpdate)
        }
        
        return builder
    }
    
    private fun determineTitle(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?): String {
        return when {
            appUpdate?.updateAvailable == true && liveUpdate?.available == true -> "App Updates Available"
            appUpdate?.updateAvailable == true -> "App Update Available"
            liveUpdate?.available == true -> "Content Update Available"
            else -> preferences.title ?: "App Update Available"
        }
    }
    
    private fun determineContent(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?): String {
        return when {
            appUpdate?.updateAvailable == true && liveUpdate?.available == true -> 
                "App version ${appUpdate.availableVersion} and content updates are available"
            appUpdate?.updateAvailable == true -> 
                "Version ${appUpdate.availableVersion} is available"
            liveUpdate?.available == true -> 
                "New content version ${liveUpdate.version} is available"
            else -> preferences.description ?: "A new version of the app is available"
        }
    }
    
    private fun getNotificationIcon(): Int {
        // Try to get custom icon, fallback to default
        return try {
            context.packageManager.getApplicationInfo(context.packageName, 0).icon
        } catch (e: Exception) {
            android.R.drawable.ic_dialog_info
        }
    }
    
    private fun getNotificationPriority(priority: NotificationPriority): Int {
        return when (priority) {
            NotificationPriority.MIN -> NotificationCompat.PRIORITY_MIN
            NotificationPriority.LOW -> NotificationCompat.PRIORITY_LOW
            NotificationPriority.DEFAULT -> NotificationCompat.PRIORITY_DEFAULT
            NotificationPriority.HIGH -> NotificationCompat.PRIORITY_HIGH
            NotificationPriority.MAX -> NotificationCompat.PRIORITY_MAX
        }
    }
    
    private fun getNotificationImportance(priority: NotificationPriority): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            when (priority) {
                NotificationPriority.MIN -> NotificationManager.IMPORTANCE_MIN
                NotificationPriority.LOW -> NotificationManager.IMPORTANCE_LOW
                NotificationPriority.DEFAULT -> NotificationManager.IMPORTANCE_DEFAULT
                NotificationPriority.HIGH -> NotificationManager.IMPORTANCE_HIGH
                NotificationPriority.MAX -> NotificationManager.IMPORTANCE_MAX
            }
        } else {
            NotificationManager.IMPORTANCE_DEFAULT
        }
    }
    
    private fun createContentIntent(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?): PendingIntent {
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent()
        
        intent.putExtra("notification_action", "tapped")
        intent.putExtra("update_type", if (appUpdate?.updateAvailable == true) "app_update" else "live_update")
        
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    private fun addActionButtons(
        builder: NotificationCompat.Builder,
        appUpdate: AppUpdateInfo?,
        liveUpdate: LatestVersion?
    ) {
        val actionLabels = preferences.actionLabels ?: ActionLabels.default()
        
        // Update Now action
        val updateNowIntent = Intent(ACTION_UPDATE_NOW).apply {
            putExtra("update_type", if (appUpdate?.updateAvailable == true) "app_update" else "live_update")
        }
        val updateNowPendingIntent = PendingIntent.getBroadcast(
            context,
            1,
            updateNowIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        builder.addAction(
            android.R.drawable.ic_menu_upload,
            actionLabels.updateNow ?: "Update Now",
            updateNowPendingIntent
        )
        
        // Update Later action
        val updateLaterIntent = Intent(ACTION_UPDATE_LATER)
        val updateLaterPendingIntent = PendingIntent.getBroadcast(
            context,
            2,
            updateLaterIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        builder.addAction(
            android.R.drawable.ic_menu_recent_history,
            actionLabels.updateLater ?: "Later",
            updateLaterPendingIntent
        )
        
        // Dismiss action
        val dismissIntent = Intent(ACTION_DISMISS)
        val dismissPendingIntent = PendingIntent.getBroadcast(
            context,
            3,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        builder.addAction(
            android.R.drawable.ic_menu_close_clear_cancel,
            actionLabels.dismiss ?: "Dismiss",
            dismissPendingIntent
        )
    }
}

data class NotificationPreferences(
    val title: String? = null,
    val description: String? = null,
    val iconName: String? = null,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val showActions: Boolean = true,
    val actionLabels: ActionLabels? = null,
    val channelId: String? = null,
    val channelName: String? = null,
    val priority: NotificationPriority = NotificationPriority.DEFAULT
) {
    companion object {
        fun default(): NotificationPreferences {
            return NotificationPreferences(
                title = "App Update Available",
                description = "A new version of the app is available",
                actionLabels = ActionLabels.default()
            )
        }
        
        fun fromJSObject(obj: JSObject): NotificationPreferences {
            val actionLabelsObj = obj.getJSObject("actionLabels")
            val priorityString = obj.getString("priority", "default")
            
            return NotificationPreferences(
                title = obj.getString("title"),
                description = obj.getString("description"),
                iconName = obj.getString("iconName"),
                soundEnabled = obj.getBoolean("soundEnabled", true),
                vibrationEnabled = obj.getBoolean("vibrationEnabled", true),
                showActions = obj.getBoolean("showActions", true),
                actionLabels = actionLabelsObj?.let { ActionLabels.fromJSObject(it) } ?: ActionLabels.default(),
                channelId = obj.getString("channelId"),
                channelName = obj.getString("channelName"),
                priority = NotificationPriority.fromString(priorityString)
            )
        }
    }
}

data class ActionLabels(
    val updateNow: String? = null,
    val updateLater: String? = null,
    val dismiss: String? = null
) {
    companion object {
        fun default(): ActionLabels {
            return ActionLabels(
                updateNow = "Update Now",
                updateLater = "Later",
                dismiss = "Dismiss"
            )
        }
        
        fun fromJSObject(obj: JSObject): ActionLabels {
            return ActionLabels(
                updateNow = obj.getString("updateNow"),
                updateLater = obj.getString("updateLater"),
                dismiss = obj.getString("dismiss")
            )
        }
    }
}

enum class NotificationPriority(val value: String) {
    MIN("min"),
    LOW("low"),
    DEFAULT("default"),
    HIGH("high"),
    MAX("max");
    
    companion object {
        fun fromString(value: String): NotificationPriority {
            return values().find { it.value == value } ?: DEFAULT
        }
    }
}

data class NotificationPermissionStatus(
    val granted: Boolean,
    val canRequest: Boolean,
    val shouldShowRationale: Boolean? = null
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("granted", granted)
        obj.put("canRequest", canRequest)
        shouldShowRationale?.let { obj.put("shouldShowRationale", it) }
        return obj
    }
}