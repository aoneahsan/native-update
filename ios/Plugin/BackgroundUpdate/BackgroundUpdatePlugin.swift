import Foundation
import Capacitor
import BackgroundTasks
import UserNotifications

@objc(BackgroundUpdatePlugin)
public class BackgroundUpdatePlugin: CAPPlugin {
    
    private let backgroundTaskIdentifier = "com.aoneahsan.nativeupdate.background"
    private var backgroundUpdateConfig: BackgroundUpdateConfig?
    private var backgroundUpdateStatus = BackgroundUpdateStatus(
        enabled: false,
        isRunning: false,
        checkCount: 0,
        failureCount: 0
    )
    private var notificationManager: BackgroundNotificationManager?
    
    public override func load() {
        super.load()
        
        // Initialize notification manager
        notificationManager = BackgroundNotificationManager(plugin: self)
        
        // Register background task
        if #available(iOS 13.0, *) {
            BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundTaskIdentifier, using: nil) { task in
                self.handleBackgroundTask(task: task as! BGAppRefreshTask)
            }
        }
    }
    
    func configure(_ config: [String: Any]) throws {
        // Configuration is handled in enableBackgroundUpdates
        // This method exists for consistency with other plugins
    }
    
    @objc func enableBackgroundUpdates(_ call: CAPPluginCall) {
        guard let configData = call.options else {
            call.reject("Missing configuration")
            return
        }
        
        do {
            // Convert [AnyHashable: Any] to [String: Any]
            let stringKeyedConfig = configData.reduce(into: [String: Any]()) { result, pair in
                if let key = pair.key as? String {
                    result[key] = pair.value
                }
            }
            let config = try BackgroundUpdateConfig.from(stringKeyedConfig)
            backgroundUpdateConfig = config
            backgroundUpdateStatus.enabled = config.enabled
            
            if config.enabled {
                scheduleBackgroundTask(interval: config.checkInterval)
            } else {
                disableBackgroundUpdates()
            }
            
            call.resolve()
        } catch {
            call.reject("Invalid configuration: \(error.localizedDescription)")
        }
    }
    
    @objc func disableBackgroundUpdates(_ call: CAPPluginCall) {
        disableBackgroundUpdates()
        call.resolve()
    }
    
    @objc func getBackgroundUpdateStatus(_ call: CAPPluginCall) {
        call.resolve(backgroundUpdateStatus.toDictionary())
    }
    
    @objc func scheduleBackgroundCheck(_ call: CAPPluginCall) {
        guard let interval = call.getDouble("interval") else {
            call.reject("Missing interval parameter")
            return
        }
        
        scheduleBackgroundTask(interval: Int(interval))
        call.resolve()
    }
    
    @objc func triggerBackgroundCheck(_ call: CAPPluginCall) {
        Task {
            let result = await performBackgroundCheck()
            call.resolve(result.toDictionary())
        }
    }
    
    @objc func setNotificationPreferences(_ call: CAPPluginCall) {
        guard let preferences = call.options else {
            call.reject("Missing preferences")
            return
        }
        
        // Convert [AnyHashable: Any] to [String: Any]
        let stringKeyedPreferences = preferences.reduce(into: [String: Any]()) { result, pair in
            if let key = pair.key as? String {
                result[key] = pair.value
            }
        }
        
        notificationManager?.setPreferences(stringKeyedPreferences)
        call.resolve()
    }
    
    @objc func getNotificationPermissions(_ call: CAPPluginCall) {
        notificationManager?.getPermissionStatus { status in
            call.resolve(status.toDictionary())
        }
    }
    
    @objc func requestNotificationPermissions(_ call: CAPPluginCall) {
        notificationManager?.requestPermissions { granted in
            call.resolve(["granted": granted])
        }
    }
    
    // MARK: - Private Methods
    
    private func disableBackgroundUpdates() {
        backgroundUpdateStatus.enabled = false
        backgroundUpdateStatus.isRunning = false
        backgroundUpdateStatus.currentTaskId = nil
        
        if #available(iOS 13.0, *) {
            BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: backgroundTaskIdentifier)
        }
    }
    
    private func scheduleBackgroundTask(interval: Int) {
        guard #available(iOS 13.0, *) else {
            NSLog("BackgroundTasks framework not available on iOS < 13.0")
            return
        }
        
        let request = BGAppRefreshTaskRequest(identifier: backgroundTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: TimeInterval(interval / 1000))
        
        do {
            try BGTaskScheduler.shared.submit(request)
            backgroundUpdateStatus.nextCheckTime = Int(Date().timeIntervalSince1970 * 1000) + interval
            NSLog("Background task scheduled for \(interval)ms from now")
        } catch {
            NSLog("Failed to schedule background task: \(error.localizedDescription)")
        }
    }
    
    @available(iOS 13.0, *)
    private func handleBackgroundTask(task: BGAppRefreshTask) {
        NSLog("Background task started")
        
        // Schedule next task
        if let config = backgroundUpdateConfig {
            scheduleBackgroundTask(interval: config.checkInterval)
        }
        
        // Set expiration handler
        task.expirationHandler = {
            NSLog("Background task expired")
            self.backgroundUpdateStatus.isRunning = false
            task.setTaskCompleted(success: false)
        }
        
        // Perform background check
        Task {
            let result = await performBackgroundCheck()
            
            // Notify listeners
            await MainActor.run {
                self.notifyListeners("backgroundUpdateProgress", data: [
                    "type": result.appUpdate != nil ? "app_update" : "live_update",
                    "status": result.success ? "completed" : "failed",
                    "percent": 100
                ])
            }
            
            task.setTaskCompleted(success: result.success)
        }
    }
    
    private func performBackgroundCheck() async -> BackgroundCheckResult {
        guard let config = backgroundUpdateConfig, config.enabled else {
            return BackgroundCheckResult(
                success: false,
                updatesFound: false,
                appUpdate: nil,
                liveUpdate: nil,
                notificationSent: false,
                error: UpdateError(code: "INVALID_CONFIG", message: "Background updates not enabled")
            )
        }
        
        backgroundUpdateStatus.isRunning = true
        backgroundUpdateStatus.checkCount += 1
        backgroundUpdateStatus.lastCheckTime = Int(Date().timeIntervalSince1970 * 1000)
        
        do {
            var appUpdate: AppUpdateInfo?
            var liveUpdate: LatestVersion?
            
            // Check for app updates
            if config.updateTypes.contains(.appUpdate) || config.updateTypes.contains(.both) {
                appUpdate = await checkForAppUpdate()
            }
            
            // Check for live updates
            if config.updateTypes.contains(.liveUpdate) || config.updateTypes.contains(.both) {
                liveUpdate = await checkForLiveUpdate()
            }
            
            let updatesFound = (appUpdate?.updateAvailable ?? false) || (liveUpdate?.available ?? false)
            var notificationSent = false
            
            if updatesFound {
                notificationSent = await sendNotification(appUpdate: appUpdate, liveUpdate: liveUpdate)
            }
            
            backgroundUpdateStatus.isRunning = false
            backgroundUpdateStatus.lastError = nil
            
            if updatesFound {
                backgroundUpdateStatus.lastUpdateTime = Int(Date().timeIntervalSince1970 * 1000)
            }
            
            return BackgroundCheckResult(
                success: true,
                updatesFound: updatesFound,
                appUpdate: appUpdate,
                liveUpdate: liveUpdate,
                notificationSent: notificationSent,
                error: nil
            )
            
        } catch {
            backgroundUpdateStatus.isRunning = false
            backgroundUpdateStatus.failureCount += 1
            
            let updateError = UpdateError(
                code: "UNKNOWN_ERROR",
                message: error.localizedDescription
            )
            backgroundUpdateStatus.lastError = updateError
            
            return BackgroundCheckResult(
                success: false,
                updatesFound: false,
                appUpdate: nil,
                liveUpdate: nil,
                notificationSent: false,
                error: updateError
            )
        }
    }
    
    private func checkForAppUpdate() async -> AppUpdateInfo? {
        // Create an instance of AppUpdatePlugin to check for updates
        let appUpdatePlugin = AppUpdatePlugin(plugin: self)
        return await appUpdatePlugin.getAppUpdateInfoAsync()
    }
    
    private func checkForLiveUpdate() async -> LatestVersion? {
        // Create an instance of LiveUpdatePlugin to check for updates
        let liveUpdatePlugin = LiveUpdatePlugin(plugin: self)
        return await liveUpdatePlugin.getLatestVersionAsync()
    }
    
    private func sendNotification(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?) async -> Bool {
        guard let notificationManager = notificationManager else {
            return false
        }
        
        return await notificationManager.sendUpdateNotification(
            appUpdate: appUpdate,
            liveUpdate: liveUpdate
        )
    }
}

// MARK: - Data Models

struct BackgroundUpdateConfig {
    let enabled: Bool
    let checkInterval: Int
    let updateTypes: [BackgroundUpdateType]
    let autoInstall: Bool
    let notificationPreferences: NotificationPreferences?
    let respectBatteryOptimization: Bool
    let allowMeteredConnection: Bool
    let minimumBatteryLevel: Int
    let requireWifi: Bool
    let maxRetries: Int
    let retryDelay: Int
    let taskIdentifier: String?
    
    static func from(_ obj: [String: Any]) throws -> BackgroundUpdateConfig {
        guard let enabled = obj["enabled"] as? Bool,
              let checkInterval = obj["checkInterval"] as? Int,
              let updateTypesArray = obj["updateTypes"] as? [String] else {
            throw NSError(domain: "BackgroundUpdateConfig", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing required fields"])
        }
        
        let updateTypes = updateTypesArray.compactMap { BackgroundUpdateType(rawValue: $0) }
        let notificationPreferences = obj["notificationPreferences"] as? [String: Any]
        
        return BackgroundUpdateConfig(
            enabled: enabled,
            checkInterval: checkInterval,
            updateTypes: updateTypes,
            autoInstall: obj["autoInstall"] as? Bool ?? false,
            notificationPreferences: notificationPreferences != nil ? NotificationPreferences.from(notificationPreferences!) : nil,
            respectBatteryOptimization: obj["respectBatteryOptimization"] as? Bool ?? true,
            allowMeteredConnection: obj["allowMeteredConnection"] as? Bool ?? false,
            minimumBatteryLevel: obj["minimumBatteryLevel"] as? Int ?? 20,
            requireWifi: obj["requireWifi"] as? Bool ?? false,
            maxRetries: obj["maxRetries"] as? Int ?? 3,
            retryDelay: obj["retryDelay"] as? Int ?? 5000,
            taskIdentifier: obj["taskIdentifier"] as? String
        )
    }
}

enum BackgroundUpdateType: String, CaseIterable {
    case appUpdate = "app_update"
    case liveUpdate = "live_update"
    case both = "both"
}

struct BackgroundUpdateStatus {
    var enabled: Bool
    var lastCheckTime: Int?
    var nextCheckTime: Int?
    var lastUpdateTime: Int?
    var currentTaskId: String?
    var isRunning: Bool
    var checkCount: Int
    var failureCount: Int
    var lastError: UpdateError?
    
    func toDictionary() -> [String: Any] {
        var obj: [String: Any] = [
            "enabled": enabled,
            "isRunning": isRunning,
            "checkCount": checkCount,
            "failureCount": failureCount
        ]
        
        if let lastCheckTime = lastCheckTime {
            obj["lastCheckTime"] = lastCheckTime
        }
        
        if let nextCheckTime = nextCheckTime {
            obj["nextCheckTime"] = nextCheckTime
        }
        
        if let lastUpdateTime = lastUpdateTime {
            obj["lastUpdateTime"] = lastUpdateTime
        }
        
        if let currentTaskId = currentTaskId {
            obj["currentTaskId"] = currentTaskId
        }
        
        if let lastError = lastError {
            obj["lastError"] = lastError.toDictionary()
        }
        
        return obj
    }
}

struct BackgroundCheckResult {
    let success: Bool
    let updatesFound: Bool
    let appUpdate: AppUpdateInfo?
    let liveUpdate: LatestVersion?
    let notificationSent: Bool
    let error: UpdateError?
    
    func toDictionary() -> [String: Any] {
        var obj: [String: Any] = [
            "success": success,
            "updatesFound": updatesFound,
            "notificationSent": notificationSent
        ]
        
        if let appUpdate = appUpdate {
            obj["appUpdate"] = appUpdate.toDictionary()
        }
        
        if let liveUpdate = liveUpdate {
            obj["liveUpdate"] = liveUpdate.toDictionary()
        }
        
        if let error = error {
            obj["error"] = error.toDictionary()
        }
        
        return obj
    }
}

struct UpdateError {
    let code: String
    let message: String
    
    func toDictionary() -> [String: Any] {
        return [
            "code": code,
            "message": message
        ]
    }
}