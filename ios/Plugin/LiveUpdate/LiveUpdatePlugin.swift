import Foundation
import Capacitor
import CommonCrypto

class LiveUpdatePlugin {
    private weak var plugin: CAPPlugin?
    private var config: [String: Any]?
    private var progressListener: (([String: Any]) -> Void)?
    private var stateChangeListener: (([String: Any]) -> Void)?
    private let session: URLSession
    private var downloadTask: URLSessionDownloadTask?
    
    init(plugin: CAPPlugin) {
        self.plugin = plugin
        
        // Configure URLSession with security settings
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.tlsMinimumSupportedProtocolVersion = .TLSv12
        
        self.session = URLSession(configuration: config)
    }
    
    func configure(_ config: [String: Any]) throws {
        self.config = config
        
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
        // In iOS, we need to reload the WebView
        DispatchQueue.main.async { [weak self] in
            if let webView = self?.plugin?.webView {
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
        if let bundle = getCurrentBundleInfo(),
           let version = bundle["version"] as? String {
            return version
        }
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
            "version": getCurrentVersion(),
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
}