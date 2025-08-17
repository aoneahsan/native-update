import Foundation
import Capacitor
import UIKit

class AppUpdatePlugin {
    private weak var plugin: CAPPlugin?
    private var config: [String: Any]?
    private let iTunesLookupURL = "https://itunes.apple.com/lookup"
    
    init(plugin: CAPPlugin) {
        self.plugin = plugin
    }
    
    func configure(_ config: [String: Any]) throws {
        self.config = config
    }
    
    func getAppUpdateInfo(_ call: CAPPluginCall) {
        Task {
            do {
                let bundleId = Bundle.main.bundleIdentifier ?? ""
                let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
                
                // Check iTunes for app info
                let appInfo = try await checkAppStoreVersion(bundleId: bundleId)
                
                let storeVersion = appInfo["version"] as? String ?? "0.0.0"
                let updateAvailable = isVersionNewer(storeVersion, than: currentVersion)
                
                var result: [String: Any] = [
                    "updateAvailable": updateAvailable,
                    "currentVersion": currentVersion
                ]
                
                if updateAvailable {
                    result["availableVersion"] = storeVersion
                    
                    // Calculate staleness in days
                    if let releaseDate = appInfo["currentVersionReleaseDate"] as? String {
                        let formatter = ISO8601DateFormatter()
                        if let date = formatter.date(from: releaseDate) {
                            let days = Calendar.current.dateComponents([.day], from: date, to: Date()).day ?? 0
                            result["clientVersionStalenessDays"] = days
                        }
                    }
                }
                
                // iOS doesn't have the same update types as Android
                result["immediateUpdateAllowed"] = false
                result["flexibleUpdateAllowed"] = false
                
                // Check minimum version requirement
                if let minimumVersion = config?["minimumVersion"] as? String {
                    let needsUpdate = isVersionNewer(minimumVersion, than: currentVersion)
                    if needsUpdate {
                        result["updatePriority"] = 5 // High priority
                    }
                }
                
                call.resolve(result)
            } catch {
                call.reject("UPDATE_CHECK_FAILED", error.localizedDescription)
            }
        }
    }
    
    func performImmediateUpdate(_ call: CAPPluginCall) {
        // iOS doesn't support in-app updates like Android
        // We'll open the App Store instead
        openAppStore(call)
    }
    
    func startFlexibleUpdate(_ call: CAPPluginCall) {
        // iOS doesn't support flexible updates
        call.reject("PLATFORM_NOT_SUPPORTED", "Flexible updates are not supported on iOS")
    }
    
    func completeFlexibleUpdate(_ call: CAPPluginCall) {
        // iOS doesn't support flexible updates
        call.reject("PLATFORM_NOT_SUPPORTED", "Flexible updates are not supported on iOS")
    }
    
    func openAppStore(_ call: CAPPluginCall) {
        let appId = call.getString("appId") ?? getAppStoreId()
        
        guard let appId = appId else {
            call.reject("APP_ID_REQUIRED", "App ID is required to open App Store")
            return
        }
        
        let urlString = "itms-apps://apple.com/app/id\(appId)"
        
        DispatchQueue.main.async {
            if let url = URL(string: urlString),
               UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:]) { success in
                    if success {
                        call.resolve()
                    } else {
                        // Fallback to web URL
                        if let webUrl = URL(string: "https://apps.apple.com/app/id\(appId)") {
                            UIApplication.shared.open(webUrl, options: [:]) { webSuccess in
                                if webSuccess {
                                    call.resolve()
                                } else {
                                    call.reject("OPEN_STORE_FAILED", "Failed to open App Store")
                                }
                            }
                        } else {
                            call.reject("OPEN_STORE_FAILED", "Failed to open App Store")
                        }
                    }
                }
            } else {
                call.reject("INVALID_URL", "Invalid App Store URL")
            }
        }
    }
    
    // MARK: - Async Methods for Background Updates
    
    func getAppUpdateInfoAsync() async -> AppUpdateInfo? {
        do {
            let bundleId = Bundle.main.bundleIdentifier ?? ""
            let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
            
            // Check iTunes for app info
            let appInfo = try await checkAppStoreVersion(bundleId: bundleId)
            
            let storeVersion = appInfo["version"] as? String ?? "0.0.0"
            let updateAvailable = isVersionNewer(storeVersion, than: currentVersion)
            
            return AppUpdateInfo(
                updateAvailable: updateAvailable,
                currentVersion: currentVersion,
                availableVersion: updateAvailable ? storeVersion : nil
            )
        } catch {
            NSLog("Failed to check app update: \(error.localizedDescription)")
            return nil
        }
    }
    
    // MARK: - Private Methods
    
    private func checkAppStoreVersion(bundleId: String) async throws -> [String: Any] {
        guard let countryCode = Locale.current.regionCode else {
            throw NSError(domain: "AppUpdatePlugin", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Could not determine country code"
            ])
        }
        
        var components = URLComponents(string: iTunesLookupURL)!
        components.queryItems = [
            URLQueryItem(name: "bundleId", value: bundleId),
            URLQueryItem(name: "country", value: countryCode)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "AppUpdatePlugin", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Invalid iTunes lookup URL"
            ])
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let results = json["results"] as? [[String: Any]],
              let appInfo = results.first else {
            throw NSError(domain: "AppUpdatePlugin", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "No app found in App Store"
            ])
        }
        
        return appInfo
    }
    
    private func isVersionNewer(_ version1: String, than version2: String) -> Bool {
        let v1Components = version1.split(separator: ".").compactMap { Int($0) }
        let v2Components = version2.split(separator: ".").compactMap { Int($0) }
        
        let maxCount = max(v1Components.count, v2Components.count)
        
        for i in 0..<maxCount {
            let v1 = i < v1Components.count ? v1Components[i] : 0
            let v2 = i < v2Components.count ? v2Components[i] : 0
            
            if v1 > v2 {
                return true
            } else if v1 < v2 {
                return false
            }
        }
        
        return false
    }
    
    private func getAppStoreId() -> String? {
        // Try to get from config first
        if let storeUrl = (config?["storeUrl"] as? [String: Any])?["ios"] as? String {
            // Extract ID from URL like https://apps.apple.com/app/id123456789
            let pattern = #"id(\d+)"#
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: storeUrl, range: NSRange(storeUrl.startIndex..., in: storeUrl)) {
                let range = Range(match.range(at: 1), in: storeUrl)!
                return String(storeUrl[range])
            }
        }
        
        // Try to get from Info.plist
        return Bundle.main.infoDictionary?["AppStoreId"] as? String
    }
}

// MARK: - Data Models

public struct AppUpdateInfo {
    public let updateAvailable: Bool
    public let currentVersion: String
    public let availableVersion: String?
    
    public func toDictionary() -> [String: Any] {
        var obj: [String: Any] = [
            "updateAvailable": updateAvailable,
            "currentVersion": currentVersion
        ]
        
        if let availableVersion = availableVersion {
            obj["availableVersion"] = availableVersion
        }
        
        return obj
    }
}