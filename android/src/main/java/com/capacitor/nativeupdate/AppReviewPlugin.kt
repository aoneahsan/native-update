package com.capacitor.nativeupdate

import android.app.Activity
import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory
import java.util.concurrent.TimeUnit

class AppReviewPlugin(
    private val activity: Activity,
    private val context: Context
) {
    private val reviewManager: ReviewManager = ReviewManagerFactory.create(context)
    private var config: JSObject? = null
    private val prefs = context.getSharedPreferences("native_update_review", Context.MODE_PRIVATE)
    
    companion object {
        private const val PREF_INSTALL_DATE = "install_date"
        private const val PREF_LAST_REVIEW_REQUEST = "last_review_request"
        private const val PREF_LAUNCH_COUNT = "launch_count"
        private const val PREF_REVIEW_SHOWN_COUNT = "review_shown_count"
    }
    
    init {
        // Initialize install date if not set
        if (!prefs.contains(PREF_INSTALL_DATE)) {
            prefs.edit().putLong(PREF_INSTALL_DATE, System.currentTimeMillis()).apply()
        }
        
        // Increment launch count
        incrementLaunchCount()
    }
    
    fun configure(config: JSObject) {
        this.config = config
    }
    
    fun requestReview(call: PluginCall) {
        // First check if we can request a review
        val canRequestResult = checkCanRequestReview()
        
        if (!canRequestResult.first) {
            val result = JSObject()
            result.put("shown", false)
            result.put("error", canRequestResult.second)
            call.resolve(result)
            return
        }
        
        // Request review info
        val request = reviewManager.requestReviewFlow()
        
        request.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val reviewInfo = task.result
                launchReviewFlow(reviewInfo, call)
            } else {
                val result = JSObject()
                result.put("shown", false)
                result.put("error", "Failed to request review flow")
                call.resolve(result)
            }
        }
    }
    
    fun canRequestReview(call: PluginCall) {
        val (allowed, reason) = checkCanRequestReview()
        
        val result = JSObject()
        result.put("allowed", allowed)
        if (!allowed) {
            result.put("reason", reason)
        }
        
        call.resolve(result)
    }
    
    private fun launchReviewFlow(reviewInfo: ReviewInfo, call: PluginCall) {
        val flow = reviewManager.launchReviewFlow(activity, reviewInfo)
        
        flow.addOnCompleteListener { _ ->
            // The flow has finished. The API does not indicate whether the user
            // reviewed or not, or even whether the review dialog was shown.
            // Update last review request time
            prefs.edit().putLong(PREF_LAST_REVIEW_REQUEST, System.currentTimeMillis()).apply()
            
            // Increment shown count
            val shownCount = prefs.getInt(PREF_REVIEW_SHOWN_COUNT, 0)
            prefs.edit().putInt(PREF_REVIEW_SHOWN_COUNT, shownCount + 1).apply()
            
            val result = JSObject()
            result.put("shown", true)
            call.resolve(result)
        }.addOnFailureListener { e ->
            val result = JSObject()
            result.put("shown", false)
            result.put("error", e.message)
            call.resolve(result)
        }
    }
    
    private fun checkCanRequestReview(): Pair<Boolean, String?> {
        val now = System.currentTimeMillis()
        val installDate = prefs.getLong(PREF_INSTALL_DATE, now)
        val lastReviewRequest = prefs.getLong(PREF_LAST_REVIEW_REQUEST, 0)
        val launchCount = prefs.getInt(PREF_LAUNCH_COUNT, 0)
        val shownCount = prefs.getInt(PREF_REVIEW_SHOWN_COUNT, 0)
        
        // Check if debug mode is enabled
        val debugMode = config?.getBool("debugMode") ?: false
        if (debugMode) {
            return Pair(true, null)
        }
        
        // Check minimum days since install
        val minDaysSinceInstall = config?.getInteger("minimumDaysSinceInstall") ?: 7
        val daysSinceInstall = TimeUnit.MILLISECONDS.toDays(now - installDate)
        if (daysSinceInstall < minDaysSinceInstall) {
            return Pair(false, "Not enough days since install")
        }
        
        // Check minimum days since last prompt
        if (lastReviewRequest > 0) {
            val minDaysSinceLastPrompt = config?.getInteger("minimumDaysSinceLastPrompt") ?: 90
            val daysSinceLastPrompt = TimeUnit.MILLISECONDS.toDays(now - lastReviewRequest)
            if (daysSinceLastPrompt < minDaysSinceLastPrompt) {
                return Pair(false, "Too soon since last review request")
            }
        }
        
        // Check minimum launch count
        val minLaunchCount = config?.getInteger("minimumLaunchCount") ?: 3
        if (launchCount < minLaunchCount) {
            return Pair(false, "Not enough app launches")
        }
        
        // Google Play has internal quotas that we can't check directly
        // But we can limit our own requests to be safe
        if (shownCount >= 3) {
            return Pair(false, "Review quota exceeded")
        }
        
        return Pair(true, null)
    }
    
    private fun incrementLaunchCount() {
        val currentCount = prefs.getInt(PREF_LAUNCH_COUNT, 0)
        prefs.edit().putInt(PREF_LAUNCH_COUNT, currentCount + 1).apply()
    }
}