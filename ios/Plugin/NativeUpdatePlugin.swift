import Foundation
import Capacitor

@objc(NativeUpdatePlugin)
public class NativeUpdatePlugin: CAPPlugin {
    private var liveUpdatePlugin: LiveUpdatePlugin!
    private var appUpdatePlugin: AppUpdatePlugin!
    private var appReviewPlugin: AppReviewPlugin!
    private var backgroundUpdatePlugin: BackgroundUpdatePlugin!
    private var securityManager: SecurityManager!
    private var isInitialized = false
    
    override public func load() {
        super.load()
        
        // Initialize sub-plugins
        liveUpdatePlugin = LiveUpdatePlugin(plugin: self)
        appUpdatePlugin = AppUpdatePlugin(plugin: self)
        appReviewPlugin = AppReviewPlugin(plugin: self)
        backgroundUpdatePlugin = BackgroundUpdatePlugin()
        securityManager = SecurityManager()
        
        // Set up listeners
        liveUpdatePlugin.setProgressListener { [weak self] progress in
            self?.notifyListeners("downloadProgress", data: progress)
        }
        
        liveUpdatePlugin.setStateChangeListener { [weak self] state in
            self?.notifyListeners("updateStateChanged", data: state)
        }
        
        // Set up app update event listener
        appUpdatePlugin.setEventListener { [weak self] eventName, data in
            self?.notifyListeners(eventName, data: data)
        }
    }
    
    @objc func initialize(_ call: CAPPluginCall) {
        guard let config = call.getObject("config") else {
            call.reject("Configuration object is required")
            return
        }
        
        do {
            // Initialize with filesystem and preferences if provided
            // In iOS, we typically don't need these as we use native APIs
            
            // Apply configuration
            configure(call)
            
            isInitialized = true
            call.resolve()
        } catch {
            call.reject("Initialization failed", error.localizedDescription)
        }
    }
    
    @objc func isInitialized(_ call: CAPPluginCall) {
        call.resolve(["initialized": isInitialized])
    }
    
    @objc func cleanup(_ call: CAPPluginCall) {
        // Clean up any resources
        liveUpdatePlugin.cleanup()
        // Disable background updates through the plugin method
        let disableCall = CAPPluginCall(
            callbackId: "cleanup_disable",
            options: [:],
            success: { _ in },
            error: { _ in }
        )
        backgroundUpdatePlugin.disableBackgroundUpdates(disableCall)
        call.resolve()
    }
    
    @objc func configure(_ call: CAPPluginCall) {
        guard let config = call.getObject("config") else {
            call.reject("Configuration object is required")
            return
        }
        
        do {
            // Validate security settings
            if let securityConfig = config["security"] as? [String: Any] {
                try securityManager.configure(securityConfig)
            }
            
            // Configure sub-plugins
            if let liveUpdateConfig = config["liveUpdate"] as? [String: Any] {
                try liveUpdatePlugin.configure(liveUpdateConfig)
            }
            
            if let appUpdateConfig = config["appUpdate"] as? [String: Any] {
                try appUpdatePlugin.configure(appUpdateConfig)
            }
            
            if let appReviewConfig = config["appReview"] as? [String: Any] {
                try appReviewPlugin.configure(appReviewConfig)
            }
            
            if let backgroundUpdateConfig = config["backgroundUpdate"] as? [String: Any] {
                try backgroundUpdatePlugin.configure(backgroundUpdateConfig)
            }
            
            call.resolve()
        } catch {
            call.reject("Configuration failed", error.localizedDescription)
        }
    }
    
    @objc func getSecurityInfo(_ call: CAPPluginCall) {
        call.resolve(securityManager.getSecurityInfo())
    }
    
    // MARK: - Live Update Methods
    
    @objc func sync(_ call: CAPPluginCall) {
        liveUpdatePlugin.sync(call)
    }
    
    @objc func download(_ call: CAPPluginCall) {
        liveUpdatePlugin.download(call)
    }
    
    @objc func set(_ call: CAPPluginCall) {
        liveUpdatePlugin.set(call)
    }
    
    @objc func reload(_ call: CAPPluginCall) {
        liveUpdatePlugin.reload(call)
    }
    
    @objc func reset(_ call: CAPPluginCall) {
        liveUpdatePlugin.reset(call)
        isInitialized = false
    }
    
    @objc func current(_ call: CAPPluginCall) {
        liveUpdatePlugin.current(call)
    }
    
    @objc func list(_ call: CAPPluginCall) {
        liveUpdatePlugin.list(call)
    }
    
    @objc func delete(_ call: CAPPluginCall) {
        liveUpdatePlugin.delete(call)
    }
    
    @objc func notifyAppReady(_ call: CAPPluginCall) {
        liveUpdatePlugin.notifyAppReady(call)
    }
    
    @objc func getLatest(_ call: CAPPluginCall) {
        liveUpdatePlugin.getLatest(call)
    }
    
    @objc func setChannel(_ call: CAPPluginCall) {
        liveUpdatePlugin.setChannel(call)
    }
    
    @objc func setUpdateUrl(_ call: CAPPluginCall) {
        liveUpdatePlugin.setUpdateUrl(call)
    }
    
    @objc func validateUpdate(_ call: CAPPluginCall) {
        liveUpdatePlugin.validateUpdate(call)
    }
    
    // MARK: - App Update Methods
    
    @objc func getAppUpdateInfo(_ call: CAPPluginCall) {
        appUpdatePlugin.getAppUpdateInfo(call)
    }
    
    @objc func performImmediateUpdate(_ call: CAPPluginCall) {
        appUpdatePlugin.performImmediateUpdate(call)
    }
    
    @objc func startFlexibleUpdate(_ call: CAPPluginCall) {
        appUpdatePlugin.startFlexibleUpdate(call)
    }
    
    @objc func completeFlexibleUpdate(_ call: CAPPluginCall) {
        appUpdatePlugin.completeFlexibleUpdate(call)
    }
    
    @objc func openAppStore(_ call: CAPPluginCall) {
        appUpdatePlugin.openAppStore(call)
    }
    
    // MARK: - App Review Methods
    
    @objc func requestReview(_ call: CAPPluginCall) {
        appReviewPlugin.requestReview(call)
    }
    
    @objc func canRequestReview(_ call: CAPPluginCall) {
        appReviewPlugin.canRequestReview(call)
    }
    
    // MARK: - Background Update Methods
    
    @objc func enableBackgroundUpdates(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.enableBackgroundUpdates(call)
    }
    
    @objc func disableBackgroundUpdates(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.disableBackgroundUpdates(call)
    }
    
    @objc func getBackgroundUpdateStatus(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.getBackgroundUpdateStatus(call)
    }
    
    @objc func scheduleBackgroundCheck(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.scheduleBackgroundCheck(call)
    }
    
    @objc func triggerBackgroundCheck(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.triggerBackgroundCheck(call)
    }
    
    @objc func setNotificationPreferences(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.setNotificationPreferences(call)
    }
    
    @objc func getNotificationPermissions(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.getNotificationPermissions(call)
    }
    
    @objc func requestNotificationPermissions(_ call: CAPPluginCall) {
        backgroundUpdatePlugin.requestNotificationPermissions(call)
    }
}