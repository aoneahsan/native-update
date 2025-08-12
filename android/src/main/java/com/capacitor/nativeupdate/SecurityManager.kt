package com.capacitor.nativeupdate

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.getcapacitor.JSObject
import okhttp3.CertificatePinner
import java.io.File
import java.security.*
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher

class SecurityManager(private val context: Context) {
    private var config: JSObject? = null
    private val masterKey: MasterKey
    private val securePrefs: android.content.SharedPreferences
    
    init {
        // Initialize master key for encryption
        masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        // Initialize encrypted shared preferences
        securePrefs = EncryptedSharedPreferences.create(
            context,
            "native_update_secure",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
    
    fun configure(config: JSObject) {
        this.config = config
        
        // Validate security configuration
        val enforceHttps = config.getBool("enforceHttps") ?: true
        if (!enforceHttps) {
            // Log warning about disabled HTTPS enforcement
            android.util.Log.w("SecurityManager", "HTTPS enforcement is disabled. This is not recommended for production.")
        }
    }
    
    fun getSecurityInfo(): JSObject {
        val result = JSObject()
        
        result.put("enforceHttps", config?.getBool("enforceHttps") ?: true)
        
        val certificatePinning = JSObject()
        val pinningConfig = config?.getJSObject("certificatePinning")
        certificatePinning.put("enabled", pinningConfig?.getBool("enabled") ?: false)
        
        // Convert pins to proper format
        val pins = mutableListOf<JSObject>()
        val pinsArray = pinningConfig?.getJSONArray("pins")
        if (pinsArray != null) {
            for (i in 0 until pinsArray.length()) {
                val pin = pinsArray.getJSONObject(i)
                val pinObject = JSObject()
                pinObject.put("hostname", pin.getString("hostname"))
                pinObject.put("sha256", pin.getJSONArray("sha256"))
                pins.add(pinObject)
            }
        }
        certificatePinning.put("pins", pins.toTypedArray())
        result.put("certificatePinning", certificatePinning)
        
        result.put("validateInputs", config?.getBool("validateInputs") ?: true)
        result.put("secureStorage", config?.getBool("secureStorage") ?: true)
        
        return result
    }
    
    fun validateUrl(url: String): Boolean {
        if (!url.startsWith("https://") && isHttpsEnforced()) {
            return false
        }
        
        // Check against allowed hosts if configured
        val allowedHosts = getAllowedHosts()
        if (allowedHosts.isNotEmpty()) {
            val uri = android.net.Uri.parse(url)
            val host = uri.host ?: return false
            return allowedHosts.contains(host)
        }
        
        return true
    }
    
    fun getCertificatePinner(): CertificatePinner? {
        val pinningConfig = config?.getJSObject("certificatePinning") ?: return null
        
        if (pinningConfig.getBool("enabled") != true) {
            return null
        }
        
        val pins = pinningConfig.getJSONArray("pins") ?: return null
        if (pins.length() == 0) {
            return null
        }
        
        val builder = CertificatePinner.Builder()
        
        // Add certificate pins for each host
        for (i in 0 until pins.length()) {
            val pin = pins.getJSONObject(i)
            val hostname = pin.getString("hostname") ?: continue
            val sha256Pins = pin.getJSONArray("sha256") ?: continue
            
            for (j in 0 until sha256Pins.length()) {
                val sha256Pin = sha256Pins.getString(j)
                builder.add(hostname, sha256Pin)
            }
        }
        
        return builder.build()
    }
    
    fun verifySignature(data: ByteArray, signature: String, publicKeyString: String): Boolean {
        return try {
            // Handle PEM format or base64 encoded public key
            val publicKeyBase64 = if (publicKeyString.contains("-----BEGIN PUBLIC KEY-----")) {
                publicKeyString
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replace("\n", "")
                    .replace("\r", "")
                    .trim()
            } else {
                publicKeyString
            }
            
            val publicKeyBytes = Base64.decode(publicKeyBase64, Base64.DEFAULT)
            val keySpec = X509EncodedKeySpec(publicKeyBytes)
            val keyFactory = KeyFactory.getInstance("RSA")
            val publicKey = keyFactory.generatePublic(keySpec)
            
            // Use RSA-PSS to match web implementation
            val sig = Signature.getInstance("SHA256withRSA/PSS")
            sig.initVerify(publicKey)
            sig.update(data)
            
            val signatureBytes = Base64.decode(signature, Base64.DEFAULT)
            sig.verify(signatureBytes)
        } catch (e: Exception) {
            android.util.Log.e("SecurityManager", "Signature verification failed", e)
            false
        }
    }
    
    fun calculateChecksum(file: File, algorithm: String = "SHA-256"): String {
        val digest = MessageDigest.getInstance(algorithm)
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
    
    fun saveSecureData(key: String, value: String) {
        if (isSecureStorageEnabled()) {
            securePrefs.edit().putString(key, value).apply()
        } else {
            // Fallback to regular preferences (not recommended)
            val prefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
            prefs.edit().putString(key, value).apply()
        }
    }
    
    fun getSecureData(key: String): String? {
        return if (isSecureStorageEnabled()) {
            securePrefs.getString(key, null)
        } else {
            val prefs = context.getSharedPreferences("native_update", Context.MODE_PRIVATE)
            prefs.getString(key, null)
        }
    }
    
    fun validatePath(path: String): Boolean {
        // Prevent directory traversal attacks
        if (path.contains("..") || path.contains("//")) {
            return false
        }
        
        // Ensure path is within app's private directory
        val file = File(path)
        val canonicalPath = file.canonicalPath
        val appDir = context.filesDir.canonicalPath
        
        return canonicalPath.startsWith(appDir)
    }
    
    fun sanitizeInput(input: String): String {
        // Remove potentially dangerous characters
        return input.replace(Regex("[^a-zA-Z0-9._-]"), "")
    }
    
    fun isHttpsEnforced(): Boolean {
        return config?.getBool("enforceHttps") ?: true
    }
    
    fun isSecureStorageEnabled(): Boolean {
        return config?.getBool("secureStorage") ?: true
    }
    
    fun isInputValidationEnabled(): Boolean {
        return config?.getBool("validateInputs") ?: true
    }
    
    private fun getAllowedHosts(): List<String> {
        val hosts = mutableListOf<String>()
        
        // Add hosts from certificate pinning config
        val pinningConfig = config?.getJSObject("certificatePinning")
        if (pinningConfig != null) {
            // In a real implementation, we'd extract hosts from the configuration
            // For now, we'll use the server URL
            val serverUrl = config?.getString("serverUrl")
            if (serverUrl != null) {
                val uri = android.net.Uri.parse(serverUrl)
                uri.host?.let { hosts.add(it) }
            }
        }
        
        // Add allowed hosts from live update config
        val liveUpdateConfig = config?.getJSObject("liveUpdate")
        val allowedHosts = liveUpdateConfig?.getJSONArray("allowedHosts")
        if (allowedHosts != null) {
            for (i in 0 until allowedHosts.length()) {
                hosts.add(allowedHosts.getString(i))
            }
        }
        
        return hosts.distinct()
    }
    
    fun logSecurityEvent(event: String, details: String? = null) {
        if (config?.getBool("logSecurityEvents") == true) {
            android.util.Log.i("SecurityManager", "Security Event: $event ${details ?: ""}")
            
            // In production, you might want to send these to a security monitoring service
        }
    }
}