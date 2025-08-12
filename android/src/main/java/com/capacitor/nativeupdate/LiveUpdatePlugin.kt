package com.capacitor.nativeupdate

import android.app.Activity
import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.tls.HandshakeCertificates
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import javax.net.ssl.X509TrustManager

class LiveUpdatePlugin(
    private val activity: Activity,
    private val context: Context
) {
    private var config: JSObject? = null
    private var progressListener: ((JSObject) -> Unit)? = null
    private var stateChangeListener: ((JSObject) -> Unit)? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var okHttpClient: OkHttpClient
    private val securityManager = SecurityManager(context)
    
    init {
        // Initialize OkHttp with default settings
        okHttpClient = createOkHttpClient()
    }
    
    private fun createOkHttpClient(): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
        
        // Configure certificate pinning if config is available
        if (config != null) {
            val certificatePinner = securityManager.getCertificatePinner()
            if (certificatePinner != null) {
                builder.certificatePinner(certificatePinner)
            }
        }
        
        return builder.build()
    }
    
    fun configure(config: JSObject) {
        this.config = config
        
        // Configure security manager
        securityManager.configure(config)
        
        // Recreate OkHttpClient with new configuration
        okHttpClient = createOkHttpClient()
        
        // Validate configuration
        val serverUrl = config.getString("serverUrl")
        if (serverUrl != null && !serverUrl.startsWith("https://")) {
            val enforceHttps = config.getJSObject("security")?.getBool("enforceHttps") ?: true
            if (enforceHttps) {
                throw IllegalArgumentException("Server URL must use HTTPS")
            }
        }
    }
    
    fun setProgressListener(listener: (JSObject) -> Unit) {
        progressListener = listener
    }
    
    fun setStateChangeListener(listener: (JSObject) -> Unit) {
        stateChangeListener = listener
    }
    
    fun sync(call: PluginCall) {
        scope.launch {
            try {
                val channel = call.getString("channel") ?: config?.getString("channel") ?: "production"
                val serverUrl = config?.getString("serverUrl") ?: run {
                    call.reject("Server URL not configured")
                    return@launch
                }
                
                // Check for updates
                val latestVersion = checkForUpdates(serverUrl, channel)
                
                if (latestVersion != null) {
                    val result = JSObject()
                    result.put("status", "UPDATE_AVAILABLE")
                    result.put("version", latestVersion.getString("version"))
                    result.put("description", latestVersion.getString("description"))
                    call.resolve(result)
                } else {
                    val result = JSObject()
                    result.put("status", "UP_TO_DATE")
                    result.put("version", getCurrentVersion())
                    call.resolve(result)
                }
            } catch (e: Exception) {
                val error = JSObject()
                error.put("code", "NETWORK_ERROR")
                error.put("message", e.message)
                
                val result = JSObject()
                result.put("status", "ERROR")
                result.put("error", error)
                call.resolve(result)
            }
        }
    }
    
    fun download(call: PluginCall) {
        scope.launch {
            try {
                val url = call.getString("url") ?: run {
                    call.reject("URL is required")
                    return@launch
                }
                
                val version = call.getString("version") ?: run {
                    call.reject("Version is required")
                    return@launch
                }
                
                val checksum = call.getString("checksum") ?: run {
                    call.reject("Checksum is required")
                    return@launch
                }
                
                // Validate URL
                if (!url.startsWith("https://") && config?.getJSObject("security")?.getBool("enforceHttps") != false) {
                    call.reject("INSECURE_URL", "Download URL must use HTTPS")
                    return@launch
                }
                
                val bundleId = "bundle-${System.currentTimeMillis()}"
                val downloadDir = File(context.filesDir, "updates/$bundleId")
                downloadDir.mkdirs()
                
                // Start download
                val downloadedFile = downloadBundle(url, downloadDir, bundleId)
                
                // Verify checksum
                if (!verifyChecksum(downloadedFile, checksum)) {
                    downloadedFile.delete()
                    call.reject("CHECKSUM_ERROR", "Bundle checksum validation failed")
                    return@launch
                }
                
                // Verify signature if provided
                val signature = call.getString("signature")
                if (signature != null) {
                    val securityConfig = config?.getJSObject("security")
                    val publicKey = securityConfig?.getString("publicKey")
                    val enableSignatureValidation = securityConfig?.getBoolean("enableSignatureValidation", false) ?: false
                    
                    if (enableSignatureValidation && publicKey != null) {
                        val fileBytes = downloadedFile.readBytes()
                        if (!securityManager.verifySignature(fileBytes, signature, publicKey)) {
                            downloadedFile.delete()
                            call.reject("SIGNATURE_ERROR", "Bundle signature validation failed")
                            return@launch
                        }
                    }
                }
                
                // Create bundle info
                val bundleInfo = JSObject()
                bundleInfo.put("bundleId", bundleId)
                bundleInfo.put("version", version)
                bundleInfo.put("path", downloadedFile.absolutePath)
                bundleInfo.put("downloadTime", System.currentTimeMillis())
                bundleInfo.put("size", downloadedFile.length())
                bundleInfo.put("status", "READY")
                bundleInfo.put("checksum", checksum)
                bundleInfo.put("verified", true)
                
                // Save bundle info
                saveBundleInfo(bundleInfo)
                
                // Notify state change
                stateChangeListener?.invoke(JSObject().apply {
                    put("status", "READY")
                    put("bundleId", bundleId)
                    put("version", version)
                })
                
                call.resolve(bundleInfo)
            } catch (e: Exception) {
                call.reject("DOWNLOAD_ERROR", e.message)
            }
        }
    }
    
    fun set(call: PluginCall) {
        val bundleId = call.getString("bundleId") ?: run {
            call.reject("Bundle ID is required")
            return
        }
        
        // Set active bundle
        setActiveBundle(bundleId)
        call.resolve()
    }
    
    fun reload(call: PluginCall) {
        // In Android, we need to restart the activity or reload the WebView
        activity.runOnUiThread {
            activity.recreate()
        }
        call.resolve()
    }
    
    fun reset(call: PluginCall) {
        // Reset to original bundle
        clearAllBundles()
        call.resolve()
    }
    
    fun current(call: PluginCall) {
        val currentBundle = getCurrentBundleInfo()
        call.resolve(currentBundle)
    }
    
    fun list(call: PluginCall) {
        val bundles = getAllBundles()
        val result = JSObject()
        result.put("bundles", bundles)
        call.resolve(result)
    }
    
    fun delete(call: PluginCall) {
        val bundleId = call.getString("bundleId")
        if (bundleId != null) {
            deleteBundle(bundleId)
        } else {
            val keepVersions = call.getInt("keepVersions")
            if (keepVersions != null) {
                cleanupOldBundles(keepVersions)
            }
        }
        call.resolve()
    }
    
    fun notifyAppReady(call: PluginCall) {
        // Mark current bundle as verified
        markBundleAsVerified()
        call.resolve()
    }
    
    fun getLatest(call: PluginCall) {
        scope.launch {
            try {
                val serverUrl = config?.getString("serverUrl") ?: run {
                    call.reject("Server URL not configured")
                    return@launch
                }
                
                val channel = config?.getString("channel") ?: "production"
                val latestVersion = checkForUpdates(serverUrl, channel)
                
                if (latestVersion != null) {
                    val result = JSObject()
                    result.put("available", true)
                    result.put("version", latestVersion.getString("version"))
                    result.put("url", latestVersion.getString("url"))
                    result.put("notes", latestVersion.getString("notes"))
                    call.resolve(result)
                } else {
                    val result = JSObject()
                    result.put("available", false)
                    call.resolve(result)
                }
            } catch (e: Exception) {
                call.reject("NETWORK_ERROR", e.message)
            }
        }
    }
    
    fun setChannel(call: PluginCall) {
        val channel = call.getString("channel") ?: run {
            call.reject("Channel is required")
            return
        }
        
        config?.put("channel", channel)
        call.resolve()
    }
    
    fun setUpdateUrl(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.reject("URL is required")
            return
        }
        
        if (!url.startsWith("https://") && config?.getJSObject("security")?.getBool("enforceHttps") != false) {
            call.reject("INSECURE_URL", "Update URL must use HTTPS")
            return
        }
        
        config?.put("serverUrl", url)
        call.resolve()
    }
    
    fun validateUpdate(call: PluginCall) {
        scope.launch {
            try {
                val bundlePath = call.getString("bundlePath") ?: run {
                    call.reject("Bundle path is required")
                    return@launch
                }
                
                val checksum = call.getString("checksum") ?: run {
                    call.reject("Checksum is required")
                    return@launch
                }
                
                val file = File(bundlePath)
                val checksumValid = verifyChecksum(file, checksum)
                
                val result = JSObject()
                result.put("isValid", checksumValid)
                
                val details = JSObject()
                details.put("checksumValid", checksumValid)
                result.put("details", details)
                
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("VALIDATION_ERROR", e.message)
            }
        }
    }
    
    // Private helper methods
    
    private suspend fun checkForUpdates(serverUrl: String, channel: String): JSObject? {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$serverUrl/check?channel=$channel")
                    .build()
                
                val response = okHttpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    // Parse JSON response
                    body?.let { JSObject(it) }
                } else {
                    null
                }
            } catch (e: Exception) {
                null
            }
        }
    }
    
    private suspend fun downloadBundle(url: String, downloadDir: File, bundleId: String): File {
        return withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url(url)
                .build()
            
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                throw Exception("Download failed: ${response.code}")
            }
            
            val file = File(downloadDir, "bundle.zip")
            val totalBytes = response.body?.contentLength() ?: -1
            var downloadedBytes = 0L
            
            response.body?.byteStream()?.use { input ->
                FileOutputStream(file).use { output ->
                    val buffer = ByteArray(8192)
                    var read: Int
                    
                    while (input.read(buffer).also { read = it } != -1) {
                        output.write(buffer, 0, read)
                        downloadedBytes += read
                        
                        // Report progress
                        if (totalBytes > 0) {
                            val percent = ((downloadedBytes * 100) / totalBytes).toInt()
                            progressListener?.invoke(JSObject().apply {
                                put("percent", percent)
                                put("bytesDownloaded", downloadedBytes)
                                put("totalBytes", totalBytes)
                                put("bundleId", bundleId)
                            })
                        }
                    }
                }
            }
            
            file
        }
    }
    
    private fun verifyChecksum(file: File, expectedChecksum: String): Boolean {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        
        val calculatedChecksum = digest.digest().joinToString("") { "%02x".format(it) }
        return calculatedChecksum == expectedChecksum
    }
    
    private fun getCurrentVersion(): String {
        // Get current bundle version or app version
        return "1.0.0"
    }
    
    private fun saveBundleInfo(bundleInfo: JSObject) {
        // Save bundle info to SharedPreferences or database
        val prefs = context.getSharedPreferences("native_update_bundles", Context.MODE_PRIVATE)
        val bundleId = bundleInfo.getString("bundleId")
        prefs.edit().putString(bundleId, bundleInfo.toString()).apply()
    }
    
    private fun setActiveBundle(bundleId: String) {
        val prefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
        prefs.edit().putString("active_bundle", bundleId).apply()
    }
    
    private fun clearAllBundles() {
        val updateDir = File(context.filesDir, "updates")
        updateDir.deleteRecursively()
        
        val prefs = context.getSharedPreferences("native_update_bundles", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        
        val activePrefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
        activePrefs.edit().remove("active_bundle").apply()
    }
    
    private fun getCurrentBundleInfo(): JSObject {
        val prefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
        val activeBundleId = prefs.getString("active_bundle", null)
        
        if (activeBundleId != null) {
            val bundlePrefs = context.getSharedPreferences("native_update_bundles", Context.MODE_PRIVATE)
            val bundleData = bundlePrefs.getString(activeBundleId, null)
            if (bundleData != null) {
                return JSObject(bundleData)
            }
        }
        
        // Return default bundle
        return JSObject().apply {
            put("bundleId", "default")
            put("version", "1.0.0")
            put("path", "/")
            put("downloadTime", System.currentTimeMillis())
            put("size", 0)
            put("status", "ACTIVE")
            put("checksum", "")
            put("verified", true)
        }
    }
    
    private fun getAllBundles(): List<JSObject> {
        val prefs = context.getSharedPreferences("native_update_bundles", Context.MODE_PRIVATE)
        return prefs.all.mapNotNull { entry ->
            try {
                JSObject(entry.value as String)
            } catch (e: Exception) {
                null
            }
        }
    }
    
    private fun deleteBundle(bundleId: String) {
        // Delete bundle files
        val bundleDir = File(context.filesDir, "updates/$bundleId")
        bundleDir.deleteRecursively()
        
        // Remove from preferences
        val prefs = context.getSharedPreferences("native_update_bundles", Context.MODE_PRIVATE)
        prefs.edit().remove(bundleId).apply()
    }
    
    private fun cleanupOldBundles(keepVersions: Int) {
        val bundles = getAllBundles().sortedByDescending { it.getLong("downloadTime") }
        if (bundles.size > keepVersions) {
            bundles.drop(keepVersions).forEach { bundle ->
                bundle.getString("bundleId")?.let { deleteBundle(it) }
            }
        }
    }
    
    private fun markBundleAsVerified() {
        val prefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("current_bundle_verified", true).apply()
    }
    
    // Async method for background update checks
    suspend fun getLatestVersionAsync(): LatestVersion? {
        return try {
            val serverUrl = config?.getString("serverUrl") ?: return null
            val channel = config?.getString("channel") ?: "production"
            
            val latestVersion = checkForUpdates(serverUrl, channel)
            
            if (latestVersion != null) {
                LatestVersion(
                    available = true,
                    version = latestVersion.getString("version")
                )
            } else {
                LatestVersion(
                    available = false,
                    version = null
                )
            }
        } catch (e: Exception) {
            null
        }
    }
}