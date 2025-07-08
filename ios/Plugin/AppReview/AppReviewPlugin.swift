import Foundation
import Capacitor
import StoreKit

class AppReviewPlugin {
    private weak var plugin: CAPPlugin?
    private var config: [String: Any]?
    private let userDefaults = UserDefaults.standard
    
    private struct Keys {
        static let installDate = "native_update_review_install_date"
        static let lastReviewRequest = "native_update_review_last_request"
        static let launchCount = "native_update_review_launch_count"
        static let reviewShownCount = "native_update_review_shown_count"
    }
    
    init(plugin: CAPPlugin) {
        self.plugin = plugin
        
        // Initialize install date if not set
        if userDefaults.object(forKey: Keys.installDate) == nil {
            userDefaults.set(Date(), forKey: Keys.installDate)
        }
        
        // Increment launch count
        incrementLaunchCount()
    }
    
    func configure(_ config: [String: Any]) throws {
        self.config = config
    }
    
    func requestReview(_ call: CAPPluginCall) {
        // First check if we can request a review
        let (allowed, reason) = checkCanRequestReview()
        
        if !allowed {
            call.resolve([
                "shown": false,
                "error": reason ?? "Review conditions not met"
            ])
            return
        }
        
        // Request review using StoreKit
        DispatchQueue.main.async { [weak self] in
            if #available(iOS 14.0, *) {
                if let windowScene = UIApplication.shared.connectedScenes
                    .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                    SKStoreReviewController.requestReview(in: windowScene)
                    self?.updateReviewRequestTime()
                    
                    call.resolve([
                        "shown": true
                    ])
                } else {
                    call.resolve([
                        "shown": false,
                        "error": "No active window scene found"
                    ])
                }
            } else {
                // Fallback for iOS 13 and earlier
                SKStoreReviewController.requestReview()
                self?.updateReviewRequestTime()
                
                call.resolve([
                    "shown": true
                ])
            }
        }
    }
    
    func canRequestReview(_ call: CAPPluginCall) {
        let (allowed, reason) = checkCanRequestReview()
        
        var result: [String: Any] = ["allowed": allowed]
        if !allowed, let reason = reason {
            result["reason"] = reason
        }
        
        call.resolve(result)
    }
    
    // MARK: - Private Methods
    
    private func checkCanRequestReview() -> (Bool, String?) {
        // Check if debug mode is enabled
        let debugMode = config?["debugMode"] as? Bool ?? false
        if debugMode {
            return (true, nil)
        }
        
        let now = Date()
        let installDate = userDefaults.object(forKey: Keys.installDate) as? Date ?? now
        let lastReviewRequest = userDefaults.object(forKey: Keys.lastReviewRequest) as? Date
        let launchCount = userDefaults.integer(forKey: Keys.launchCount)
        let shownCount = userDefaults.integer(forKey: Keys.reviewShownCount)
        
        // Check minimum days since install
        let minDaysSinceInstall = config?["minimumDaysSinceInstall"] as? Int ?? 7
        let daysSinceInstall = Calendar.current.dateComponents([.day], from: installDate, to: now).day ?? 0
        if daysSinceInstall < minDaysSinceInstall {
            return (false, "Not enough days since install")
        }
        
        // Check minimum days since last prompt
        if let lastRequest = lastReviewRequest {
            let minDaysSinceLastPrompt = config?["minimumDaysSinceLastPrompt"] as? Int ?? 90
            let daysSinceLastPrompt = Calendar.current.dateComponents([.day], from: lastRequest, to: now).day ?? 0
            if daysSinceLastPrompt < minDaysSinceLastPrompt {
                return (false, "Too soon since last review request")
            }
        }
        
        // Check minimum launch count
        let minLaunchCount = config?["minimumLaunchCount"] as? Int ?? 3
        if launchCount < minLaunchCount {
            return (false, "Not enough app launches")
        }
        
        // iOS limits to 3 review requests per year
        if shownCount >= 3 {
            // Check if it's been a year since the first request
            if let firstRequestDate = userDefaults.object(forKey: "native_update_review_first_request") as? Date {
                let daysSinceFirst = Calendar.current.dateComponents([.day], from: firstRequestDate, to: now).day ?? 0
                if daysSinceFirst < 365 {
                    return (false, "Review quota exceeded")
                } else {
                    // Reset count after a year
                    userDefaults.set(0, forKey: Keys.reviewShownCount)
                    userDefaults.removeObject(forKey: "native_update_review_first_request")
                }
            }
        }
        
        return (true, nil)
    }
    
    private func incrementLaunchCount() {
        let currentCount = userDefaults.integer(forKey: Keys.launchCount)
        userDefaults.set(currentCount + 1, forKey: Keys.launchCount)
    }
    
    private func updateReviewRequestTime() {
        let now = Date()
        userDefaults.set(now, forKey: Keys.lastReviewRequest)
        
        // Track first request for yearly quota
        if userDefaults.object(forKey: "native_update_review_first_request") == nil {
            userDefaults.set(now, forKey: "native_update_review_first_request")
        }
        
        // Increment shown count
        let shownCount = userDefaults.integer(forKey: Keys.reviewShownCount)
        userDefaults.set(shownCount + 1, forKey: Keys.reviewShownCount)
    }
}