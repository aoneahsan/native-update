import Foundation
import Capacitor
import UserNotifications

class BackgroundNotificationManager: NSObject {
    
    private weak var plugin: BackgroundUpdatePlugin?
    private var preferences: NotificationPreferences
    private let notificationCenter = UNUserNotificationCenter.current()
    
    init(plugin: BackgroundUpdatePlugin) {
        self.plugin = plugin
        self.preferences = NotificationPreferences.default()
        super.init()
        
        // Set notification delegate
        notificationCenter.delegate = self
        
        // Setup notification categories
        setupNotificationCategories()
    }
    
    func setPreferences(_ preferencesData: [String: Any]) {
        preferences = NotificationPreferences.from[String: Any](preferencesData)
    }
    
    func getPermissionStatus(completion: @escaping (NotificationPermissionStatus) -> Void) {
        notificationCenter.getNotificationSettings { settings in
            let status = NotificationPermissionStatus(
                granted: settings.authorizationStatus == .authorized,
                canRequest: settings.authorizationStatus == .notDetermined,
                shouldShowRationale: settings.authorizationStatus == .denied
            )
            completion(status)
        }
    }
    
    func requestPermissions(completion: @escaping (Bool) -> Void) {
        notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if let error = error {
                NSLog("Notification permission error: \(error.localizedDescription)")
            }
            completion(granted)
        }
    }
    
    func sendUpdateNotification(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?) async -> Bool {
        // Check permissions first
        let settings = await notificationCenter.notificationSettings()
        guard settings.authorizationStatus == .authorized else {
            return false
        }
        
        let content = createNotificationContent(appUpdate: appUpdate, liveUpdate: liveUpdate)
        let identifier = "update_notification_\(Int(Date().timeIntervalSince1970))"
        
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: nil // Immediate delivery
        )
        
        do {
            try await notificationCenter.add(request)
            
            // Notify listeners
            await MainActor.run {
                self.plugin?.notifyListeners("backgroundUpdateNotification", data: [
                    "type": appUpdate?.updateAvailable == true ? "app_update" : "live_update",
                    "updateAvailable": true,
                    "version": appUpdate?.availableVersion ?? liveUpdate?.version ?? "unknown",
                    "action": "shown"
                ])
            }
            
            return true
        } catch {
            NSLog("Failed to send notification: \(error.localizedDescription)")
            return false
        }
    }
    
    func cancelNotification(identifier: String) {
        notificationCenter.removePendingNotificationRequests(withIdentifiers: [identifier])
        notificationCenter.removeDeliveredNotifications(withIdentifiers: [identifier])
    }
    
    private func createNotificationContent(appUpdate: AppUpdateInfo?, liveUpdate: LatestVersion?) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        
        // Determine title and body
        var title = preferences.title ?? "App Update Available"
        var body = preferences.description ?? "A new version of the app is available"
        
        if let appUpdate = appUpdate, appUpdate.updateAvailable,
           let liveUpdate = liveUpdate, liveUpdate.available {
            title = "App Updates Available"
            body = "App version \(appUpdate.availableVersion ?? "unknown") and content updates are available"
        } else if let appUpdate = appUpdate, appUpdate.updateAvailable {
            title = "App Update Available"
            body = "Version \(appUpdate.availableVersion ?? "unknown") is available"
        } else if let liveUpdate = liveUpdate, liveUpdate.available {
            title = "Content Update Available"
            body = "New content version \(liveUpdate.version ?? "unknown") is available"
        }
        
        content.title = title
        content.body = body
        
        // Set badge
        content.badge = 1
        
        // Set sound
        if preferences.soundEnabled {
            content.sound = .default
        }
        
        // Set category for actions
        if preferences.showActions {
            content.categoryIdentifier = "UPDATE_CATEGORY"
        }
        
        // Set user info
        content.userInfo = [
            "type": "update_available",
            "appUpdate": appUpdate?.to[String: Any]() ?? [:],
            "liveUpdate": liveUpdate?.to[String: Any]() ?? [:]
        ]
        
        return content
    }
    
    private func setupNotificationCategories() {
        guard preferences.showActions else { return }
        
        // Create actions
        let updateNowAction = UNNotificationAction(
            identifier: "UPDATE_NOW",
            title: preferences.actionLabels?.updateNow ?? "Update Now",
            options: [.foreground]
        )
        
        let updateLaterAction = UNNotificationAction(
            identifier: "UPDATE_LATER",
            title: preferences.actionLabels?.updateLater ?? "Later",
            options: []
        )
        
        let dismissAction = UNNotificationAction(
            identifier: "DISMISS",
            title: preferences.actionLabels?.dismiss ?? "Dismiss",
            options: []
        )
        
        // Create category
        let updateCategory = UNNotificationCategory(
            identifier: "UPDATE_CATEGORY",
            actions: [updateNowAction, updateLaterAction, dismissAction],
            intentIdentifiers: [],
            options: []
        )
        
        // Set categories
        notificationCenter.setNotificationCategories([updateCategory])
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension BackgroundNotificationManager: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let userInfo = response.notification.request.content.userInfo
        
        DispatchQueue.main.async {
            self.plugin?.notifyListeners("backgroundUpdateNotification", data: [
                "type": userInfo["type"] as? String ?? "unknown",
                "updateAvailable": true,
                "action": self.mapActionIdentifier(response.actionIdentifier)
            ])
        }
        
        // Handle different actions
        switch response.actionIdentifier {
        case "UPDATE_NOW":
            // Trigger immediate update
            self.handleUpdateNowAction(userInfo: userInfo)
        case "UPDATE_LATER":
            // Schedule reminder or do nothing
            break
        case "DISMISS":
            // Remove notification
            break
        default:
            // Default tap action - open app
            self.handleDefaultTapAction(userInfo: userInfo)
        }
        
        completionHandler()
    }
    
    private func mapActionIdentifier(_ identifier: String) -> String {
        switch identifier {
        case "UPDATE_NOW":
            return "update_now"
        case "UPDATE_LATER":
            return "update_later"
        case "DISMISS":
            return "dismiss"
        case UNNotificationDefaultActionIdentifier:
            return "tapped"
        default:
            return "unknown"
        }
    }
    
    private func handleUpdateNowAction(userInfo: [AnyHashable: Any]) {
        // Here you would typically trigger the update process
        // This could involve calling the app update or live update functionality
        NSLog("Update now action triggered")
    }
    
    private func handleDefaultTapAction(userInfo: [AnyHashable: Any]) {
        // App was opened via notification tap
        NSLog("Notification tapped - app opened")
    }
}

// MARK: - Data Models

struct NotificationPreferences {
    let title: String?
    let description: String?
    let iconName: String?
    let soundEnabled: Bool
    let vibrationEnabled: Bool
    let showActions: Bool
    let actionLabels: ActionLabels?
    let channelId: String?
    let channelName: String?
    let priority: NotificationPriority
    
    static func `default`() -> NotificationPreferences {
        return NotificationPreferences(
            title: "App Update Available",
            description: "A new version of the app is available",
            iconName: nil,
            soundEnabled: true,
            vibrationEnabled: true,
            showActions: true,
            actionLabels: ActionLabels.default(),
            channelId: "capacitor_native_update",
            channelName: "App Updates",
            priority: .default
        )
    }
    
    static func from[String: Any](_ obj: [String: Any]) -> NotificationPreferences {
        let actionLabelsObj = obj["actionLabels"] as? [String: Any]
        
        return NotificationPreferences(
            title: obj["title"] as? String,
            description: obj["description"] as? String,
            iconName: obj["iconName"] as? String,
            soundEnabled: obj["soundEnabled"] as? Bool ?? true,
            vibrationEnabled: obj["vibrationEnabled"] as? Bool ?? true,
            showActions: obj["showActions"] as? Bool ?? true,
            actionLabels: actionLabelsObj != nil ? ActionLabels.from[String: Any](actionLabelsObj!) : ActionLabels.default(),
            channelId: obj["channelId"] as? String,
            channelName: obj["channelName"] as? String,
            priority: NotificationPriority(rawValue: obj["priority"] as? String ?? "default") ?? .default
        )
    }
}

struct ActionLabels {
    let updateNow: String?
    let updateLater: String?
    let dismiss: String?
    
    static func `default`() -> ActionLabels {
        return ActionLabels(
            updateNow: "Update Now",
            updateLater: "Later",
            dismiss: "Dismiss"
        )
    }
    
    static func from[String: Any](_ obj: [String: Any]) -> ActionLabels {
        return ActionLabels(
            updateNow: obj["updateNow"] as? String,
            updateLater: obj["updateLater"] as? String,
            dismiss: obj["dismiss"] as? String
        )
    }
}

enum NotificationPriority: String, CaseIterable {
    case min = "min"
    case low = "low"
    case `default` = "default"
    case high = "high"
    case max = "max"
}

struct NotificationPermissionStatus {
    let granted: Bool
    let canRequest: Bool
    let shouldShowRationale: Bool?
    
    func to[String: Any]() -> [String: Any] {
        var obj: [String: Any] = [
            "granted": granted,
            "canRequest": canRequest
        ]
        
        if let shouldShowRationale = shouldShowRationale {
            obj["shouldShowRationale"] = shouldShowRationale
        }
        
        return obj
    }
}