import Foundation
import Capacitor
import CommonCrypto

class LiveUpdatePlugin {
    private weak var plugin: CAPPlugin?
    private var config: [String: Any]?
    private var progressListener: (([String: Any]) -> Void)?
    private var stateChangeListener: (([String: Any]) -> Void)?
    private var session: URLSession!
    private var downloadTask: URLSessionDownloadTask?
    private let securityManager = SecurityManager()
    
    init(plugin: CAPPlugin) {
        self.plugin = plugin
        
        // Create initial session with default configuration
        self.session = createURLSession()
    }
    
    private func createURLSession() -> URLSession {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        
        // Configure certificate pinning if available
        if let securityConfig = self.config?["security"] as? [String: Any],
           let certificatePinning = securityConfig["certificatePinning"] as? [String: Any],
           certificatePinning["enabled"] as? Bool == true {
            
            return URLSession(configuration: config, delegate: CertificatePinningDelegate(securityManager: securityManager), delegateQueue: nil)
        }
        
        return URLSession(configuration: config)
    }
    
    func configure(_ config: [String: Any]) throws {
        self.config = config
        
        // Configure security manager
        try securityManager.configure(config)
        
        // Recreate URLSession with new configuration
        self.session = createURLSession()
        
        // Validate configuration
        if let serverUrl = config["serverUrl"] as? String,
           !serverUrl.hasPrefix("https://") {
            let enforceHttps = (config["security"] as? [String: Any])?["enforceHttps"] as? Bool ?? true
            if enforceHttps {
                throw NSError(domain: "LiveUpdatePlugin", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "Server URL must use HTTPS"
                ])
            }
        }
    }
    
    func setProgressListener(_ listener: @escaping ([String: Any]) -> Void) {
        self.progressListener = listener
    }
    
    func setStateChangeListener(_ listener: @escaping ([String: Any]) -> Void) {
        self.stateChangeListener = listener
    }
    
    func sync(_ call: CAPPluginCall) {
        Task {
            do {
                let channel = call.getString("channel") ?? config?["channel"] as? String ?? "production"
                guard let serverUrl = config?["serverUrl"] as? String else {
                    call.reject("Server URL not configured")
                    return
                }
                
                // Check for updates
                if let latestVersion = try await checkForUpdates(serverUrl: serverUrl, channel: channel) {
                    call.resolve([
                        "status": "UPDATE_AVAILABLE",
                        "version": latestVersion["version"] ?? "",
                        "description": latestVersion["description"] ?? ""
                    ])
                } else {
                    call.resolve([
                        "status": "UP_TO_DATE",
                        "version": getCurrentVersion()
                    ])
                }
            } catch {
                call.resolve([
                    "status": "ERROR",
                    "error": [
                        "code": "NETWORK_ERROR",
                        "message": error.localizedDescription
                    ]
                ])
            }
        }
    }
    
    func download(_ call: CAPPluginCall) {
        guard let url = call.getString("url") else {
            call.reject("URL is required")
            return
        }
        
        guard let version = call.getString("version") else {
            call.reject("Version is required")
            return
        }
        
        guard let checksum = call.getString("checksum") else {
            call.reject("Checksum is required")
            return
        }
        
        // Validate URL
        if !url.hasPrefix("https://") {
            let enforceHttps = (config?["security"] as? [String: Any])?["enforceHttps"] as? Bool ?? true
            if enforceHttps {
                call.reject("INSECURE_URL", "Download URL must use HTTPS")
                return
            }
        }
        
        Task {
            do {
                let bundleId = "bundle-\(Date().timeIntervalSince1970)"
                let downloadDir = getUpdatesDirectory().appendingPathComponent(bundleId)
                try FileManager.default.createDirectory(at: downloadDir, withIntermediateDirectories: true)
                
                // Start download
                let downloadedFile = try await downloadBundle(from: url, to: downloadDir, bundleId: bundleId)
                
                // Verify checksum
                let calculatedChecksum = try calculateChecksum(for: downloadedFile)
                if calculatedChecksum != checksum {
                    try FileManager.default.removeItem(at: downloadedFile)
                    call.reject("CHECKSUM_ERROR", "Bundle checksum validation failed")
                    return
                }
                
                // Verify signature if provided
                if let signature = call.getString("signature"),
                   let publicKey = (config?["security"] as? [String: Any])?["publicKey"] as? String,
                   (config?["security"] as? [String: Any])?["enableSignatureValidation"] as? Bool == true {
                    
                    let fileData = try Data(contentsOf: downloadedFile)
                    let securityManager = SecurityManager()
                    
                    if !securityManager.verifySignature(data: fileData, signature: signature, publicKeyString: publicKey) {
                        try FileManager.default.removeItem(at: downloadedFile)
                        call.reject("SIGNATURE_ERROR", "Bundle signature validation failed")
                        return
                    }
                }
                
                // Create bundle info
                let bundleInfo: [String: Any] = [
                    "bundleId": bundleId,
                    "version": version,
                    "path": downloadedFile.path,
                    "downloadTime": Date().timeIntervalSince1970 * 1000,
                    "size": try FileManager.default.attributesOfItem(atPath: downloadedFile.path)[.size] ?? 0,
                    "status": "READY",
                    "checksum": checksum,
                    "verified": true
                ]
                
                // Save bundle info
                saveBundleInfo(bundleInfo)
                
                // Extract the bundle
                try extractAndApplyBundle(downloadedFile, bundleId: bundleId)
                
                // Notify state change
                stateChangeListener?([
                    "status": "READY",
                    "bundleId": bundleId,
                    "version": version
                ])
                
                call.resolve(bundleInfo)
            } catch {
                call.reject("DOWNLOAD_ERROR", error.localizedDescription)
            }
        }
    }
    
    func set(_ call: CAPPluginCall) {
        guard let bundleId = call.getString("bundleId") else {
            call.reject("Bundle ID is required")
            return
        }
        
        setActiveBundle(bundleId)
        call.resolve()
    }
    
    func reload(_ call: CAPPluginCall) {
        // In iOS, we need to reload the WebView with the new bundle path
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let webView = self.plugin?.webView else {
                return
            }
            
            // Get the active bundle path
            if let activeBundleId = UserDefaults.standard.string(forKey: "native_update_active_bundle"),
               let bundles = UserDefaults.standard.dictionary(forKey: "native_update_bundles"),
               let bundleInfo = bundles[activeBundleId] as? [String: Any],
               let extractedPath = bundleInfo["extractedPath"] as? String {
                
                // Load from extracted bundle path
                let indexPath = URL(fileURLWithPath: extractedPath).appendingPathComponent("index.html")
                webView.load(URLRequest(url: indexPath))
            } else {
                // Fallback to regular reload
                webView.reload()
            }
        }
        call.resolve()
    }
    
    func reset(_ call: CAPPluginCall) {
        clearAllBundles()
        call.resolve()
    }
    
    func current(_ call: CAPPluginCall) {
        let currentBundle = getCurrentBundleInfo()
        call.resolve(currentBundle)
    }
    
    func list(_ call: CAPPluginCall) {
        let bundles = getAllBundles()
        call.resolve(["bundles": bundles])
    }
    
    func delete(_ call: CAPPluginCall) {
        if let bundleId = call.getString("bundleId") {
            deleteBundle(bundleId)
        } else if let keepVersions = call.getInt("keepVersions") {
            cleanupOldBundles(keepVersions: keepVersions)
        }
        call.resolve()
    }
    
    func notifyAppReady(_ call: CAPPluginCall) {
        markBundleAsVerified()
        call.resolve()
    }
    
    func getLatest(_ call: CAPPluginCall) {
        Task {
            do {
                guard let serverUrl = config?["serverUrl"] as? String else {
                    call.reject("Server URL not configured")
                    return
                }
                
                let channel = config?["channel"] as? String ?? "production"
                
                if let latestVersion = try await checkForUpdates(serverUrl: serverUrl, channel: channel) {
                    call.resolve([
                        "available": true,
                        "version": latestVersion["version"] ?? "",
                        "url": latestVersion["url"] ?? "",
                        "notes": latestVersion["notes"] ?? ""
                    ])
                } else {
                    call.resolve(["available": false])
                }
            } catch {
                call.reject("NETWORK_ERROR", error.localizedDescription)
            }
        }
    }
    
    func setChannel(_ call: CAPPluginCall) {
        guard let channel = call.getString("channel") else {
            call.reject("Channel is required")
            return
        }
        
        config?["channel"] = channel
        call.resolve()
    }
    
    func setUpdateUrl(_ call: CAPPluginCall) {
        guard let url = call.getString("url") else {
            call.reject("URL is required")
            return
        }
        
        if !url.hasPrefix("https://") {
            let enforceHttps = (config?["security"] as? [String: Any])?["enforceHttps"] as? Bool ?? true
            if enforceHttps {
                call.reject("INSECURE_URL", "Update URL must use HTTPS")
                return
            }
        }
        
        config?["serverUrl"] = url
        call.resolve()
    }
    
    func validateUpdate(_ call: CAPPluginCall) {
        guard let bundlePath = call.getString("bundlePath") else {
            call.reject("Bundle path is required")
            return
        }
        
        guard let checksum = call.getString("checksum") else {
            call.reject("Checksum is required")
            return
        }
        
        do {
            let url = URL(fileURLWithPath: bundlePath)
            let calculatedChecksum = try calculateChecksum(for: url)
            let isValid = calculatedChecksum == checksum
            
            call.resolve([
                "isValid": isValid,
                "details": [
                    "checksumValid": isValid
                ]
            ])
        } catch {
            call.reject("VALIDATION_ERROR", error.localizedDescription)
        }
    }
    
    // MARK: - Async Methods for Background Updates
    
    func getLatestVersionAsync() async -> LatestVersion? {
        do {
            guard let serverUrl = config?["serverUrl"] as? String else {
                NSLog("Server URL not configured")
                return nil
            }
            
            let channel = config?["channel"] as? String ?? "production"
            
            if let latestVersion = try await checkForUpdates(serverUrl: serverUrl, channel: channel) {
                return LatestVersion(
                    available: true,
                    version: latestVersion["version"] as? String
                )
            } else {
                return LatestVersion(
                    available: false,
                    version: nil
                )
            }
        } catch {
            NSLog("Failed to check live update: \(error.localizedDescription)")
            return nil
        }
    }
    
    // MARK: - Private Methods
    
    private func checkForUpdates(serverUrl: String, channel: String) async throws -> [String: Any]? {
        guard let url = URL(string: "\(serverUrl)/check?channel=\(channel)") else {
            throw NSError(domain: "LiveUpdatePlugin", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Invalid server URL"
            ])
        }
        
        let (data, _) = try await session.data(from: url)
        
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let available = json["available"] as? Bool,
           available {
            return json
        }
        
        return nil
    }
    
    private func downloadBundle(from urlString: String, to directory: URL, bundleId: String) async throws -> URL {
        guard let url = URL(string: urlString) else {
            throw NSError(domain: "LiveUpdatePlugin", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "Invalid download URL"
            ])
        }
        
        let destinationURL = directory.appendingPathComponent("bundle.zip")
        
        return try await withCheckedThrowingContinuation { continuation in
            let task = session.downloadTask(with: url) { [weak self] tempURL, response, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                guard let tempURL = tempURL else {
                    continuation.resume(throwing: NSError(domain: "LiveUpdatePlugin", code: 4, userInfo: [
                        NSLocalizedDescriptionKey: "Download failed"
                    ]))
                    return
                }
                
                do {
                    try FileManager.default.moveItem(at: tempURL, to: destinationURL)
                    continuation.resume(returning: destinationURL)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
            
            // Track progress
            let observation = task.progress.observe(\.fractionCompleted) { [weak self] progress, _ in
                let percent = Int(progress.fractionCompleted * 100)
                self?.progressListener?([
                    "percent": percent,
                    "bytesDownloaded": progress.completedUnitCount,
                    "totalBytes": progress.totalUnitCount,
                    "bundleId": bundleId
                ])
            }
            
            task.resume()
            self.downloadTask = task
        }
    }
    
    private func calculateChecksum(for url: URL) throws -> String {
        let data = try Data(contentsOf: url)
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        
        data.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
        }
        
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    
    private func getUpdatesDirectory() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("updates")
    }
    
    private func getCurrentVersion() -> String {
        // First check if we have an active bundle with version
        let defaults = UserDefaults.standard
        if let activeBundleId = defaults.string(forKey: "native_update_active_bundle"),
           let bundles = defaults.dictionary(forKey: "native_update_bundles"),
           let bundleInfo = bundles[activeBundleId] as? [String: Any],
           let version = bundleInfo["version"] as? String {
            return version
        }
        // Fall back to app version
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
    
    private func saveBundleInfo(_ bundleInfo: [String: Any]) {
        guard let bundleId = bundleInfo["bundleId"] as? String else { return }
        
        let defaults = UserDefaults.standard
        var bundles = defaults.dictionary(forKey: "native_update_bundles") ?? [:]
        bundles[bundleId] = bundleInfo
        defaults.set(bundles, forKey: "native_update_bundles")
    }
    
    private func setActiveBundle(_ bundleId: String) {
        UserDefaults.standard.set(bundleId, forKey: "native_update_active_bundle")
    }
    
    private func clearAllBundles() {
        let updateDir = getUpdatesDirectory()
        try? FileManager.default.removeItem(at: updateDir)
        
        UserDefaults.standard.removeObject(forKey: "native_update_bundles")
        UserDefaults.standard.removeObject(forKey: "native_update_active_bundle")
    }
    
    private func getCurrentBundleInfo() -> [String: Any] {
        let defaults = UserDefaults.standard
        
        if let activeBundleId = defaults.string(forKey: "native_update_active_bundle"),
           let bundles = defaults.dictionary(forKey: "native_update_bundles"),
           let bundleInfo = bundles[activeBundleId] as? [String: Any] {
            return bundleInfo
        }
        
        // Return default bundle
        return [
            "bundleId": "default",
            "version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0",
            "path": "/",
            "downloadTime": Date().timeIntervalSince1970 * 1000,
            "size": 0,
            "status": "ACTIVE",
            "checksum": "",
            "verified": true
        ]
    }
    
    private func getAllBundles() -> [[String: Any]] {
        let defaults = UserDefaults.standard
        let bundles = defaults.dictionary(forKey: "native_update_bundles") ?? [:]
        return bundles.values.compactMap { $0 as? [String: Any] }
    }
    
    private func deleteBundle(_ bundleId: String) {
        // Delete bundle files
        let bundleDir = getUpdatesDirectory().appendingPathComponent(bundleId)
        try? FileManager.default.removeItem(at: bundleDir)
        
        // Remove from UserDefaults
        let defaults = UserDefaults.standard
        var bundles = defaults.dictionary(forKey: "native_update_bundles") ?? [:]
        bundles.removeValue(forKey: bundleId)
        defaults.set(bundles, forKey: "native_update_bundles")
    }
    
    func cleanup() {
        // Clean up any resources
        downloadTask?.cancel()
        downloadTask = nil
    }
    
    private func cleanupOldBundles(keepVersions: Int) {
        let bundles = getAllBundles().sorted { bundle1, bundle2 in
            let time1 = bundle1["downloadTime"] as? Double ?? 0
            let time2 = bundle2["downloadTime"] as? Double ?? 0
            return time1 > time2
        }
        
        if bundles.count > keepVersions {
            let bundlesToDelete = bundles.dropFirst(keepVersions)
            for bundle in bundlesToDelete {
                if let bundleId = bundle["bundleId"] as? String {
                    deleteBundle(bundleId)
                }
            }
        }
    }
    
    private func markBundleAsVerified() {
        UserDefaults.standard.set(true, forKey: "native_update_current_bundle_verified")
    }
    
    // MARK: - Bundle Extraction and WebView Configuration
    
    private func extractAndApplyBundle(_ bundleUrl: URL, bundleId: String) throws {
        let extractedPath = getUpdatesDirectory().appendingPathComponent(bundleId).appendingPathComponent("www")
        
        // Extract the zip bundle
        try extractZipBundle(from: bundleUrl, to: extractedPath)
        
        // Update bundle info with extracted path
        var bundleInfo = getAllBundles().first { $0["bundleId"] as? String == bundleId } ?? [:]
        bundleInfo["extractedPath"] = extractedPath.path
        bundleInfo["status"] = "READY"
        saveBundleInfo(bundleInfo)
        
        // Configure WebView to use new path
        configureWebViewPath(extractedPath.path)
    }
    
    private func extractZipBundle(from zipUrl: URL, to destinationUrl: URL) throws {
        // Create destination directory
        try FileManager.default.createDirectory(at: destinationUrl, withIntermediateDirectories: true)
        
        // Use FileManager to extract (requires iOS unzip library or manual implementation)
        // For now, we'll use a simple file copy as placeholder
        // In production, you would use a library like ZIPFoundation or SSZipArchive
        
        // This is a placeholder - in real implementation, use a proper unzip library
        throw NSError(domain: "LiveUpdatePlugin", code: 5, userInfo: [
            NSLocalizedDescriptionKey: "Unzip functionality not implemented. Please integrate a zip library like ZIPFoundation."
        ])
    }
    
    private func configureWebViewPath(_ path: String) {
        // Store the active bundle path
        UserDefaults.standard.set(path, forKey: "native_update_webview_path")
        
        // The actual WebView path configuration happens in the main plugin
        // when the WebView is loaded or reloaded
    }
}

// MARK: - Data Models

public struct LatestVersion {
    public let available: Bool
    public let version: String?
    
    public func toDictionary() -> [String: Any] {
        var obj: [String: Any] = [
            "available": available
        ]
        
        if let version = version {
            obj["version"] = version
        }
        
        return obj
    }
}

// MARK: - Certificate Pinning Delegate

class CertificatePinningDelegate: NSObject, URLSessionDelegate {
    private let securityManager: SecurityManager
    
    init(securityManager: SecurityManager) {
        self.securityManager = securityManager
        super.init()
    }
    
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        
        // Get certificate pins from security manager configuration
        let certificatePins = getCertificatePins(for: challenge.protectionSpace.host)
        
        if certificatePins.isEmpty {
            // No pins configured for this host, use default handling
            completionHandler(.performDefaultHandling, nil)
            return
        }
        
        // Evaluate server trust
        var error: CFError?
        let isValid = SecTrustEvaluateWithError(serverTrust, &error)
        
        if !isValid {
            print("Certificate validation failed: \(error?.localizedDescription ?? "Unknown error")")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Check certificate pinning
        if validateCertificatePins(serverTrust: serverTrust, expectedPins: certificatePins) {
            let credential = URLCredential(trust: serverTrust)
            completionHandler(.useCredential, credential)
        } else {
            print("Certificate pinning validation failed for host: \(challenge.protectionSpace.host)")
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
    
    private func getCertificatePins(for host: String) -> [String] {
        // Get pins from security manager configuration
        let securityInfo = securityManager.getSecurityInfo()
        guard let certificatePinning = securityInfo["certificatePinning"] as? [String: Any],
              certificatePinning["enabled"] as? Bool == true,
              let hostPins = certificatePinning["pins"] as? [String: [String]] else {
            return []
        }
        
        // Return pins for the specific host
        return hostPins[host] ?? []
    }
    
    private func validateCertificatePins(serverTrust: SecTrust, expectedPins: [String]) -> Bool {
        let certificateCount = SecTrustGetCertificateCount(serverTrust)
        
        for i in 0..<certificateCount {
            guard let certificate = SecTrustGetCertificateAtIndex(serverTrust, i) else { continue }
            
            let certificateData = SecCertificateCopyData(certificate) as Data
            let hash = certificateData.sha256()
            let pin = "sha256/" + hash.base64EncodedString()
            
            if expectedPins.contains(pin) {
                return true
            }
        }
        
        return false
    }
}

// MARK: - Data Extension for SHA256

extension Data {
    func sha256() -> Data {
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        self.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(self.count), &hash)
        }
        return Data(hash)
    }
}