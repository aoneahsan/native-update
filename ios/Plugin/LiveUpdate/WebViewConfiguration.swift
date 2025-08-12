import Foundation
import Capacitor
import WebKit

extension NativeUpdatePlugin {
    
    // This method should be called by the Capacitor app during WebView setup
    @objc public func configureWebView(for webView: WKWebView) {
        // Check if there's an active bundle to load
        if let activeBundleId = UserDefaults.standard.string(forKey: "native_update_active_bundle"),
           let bundles = UserDefaults.standard.dictionary(forKey: "native_update_bundles"),
           let bundleInfo = bundles[activeBundleId] as? [String: Any],
           let extractedPath = bundleInfo["extractedPath"] as? String {
            
            // Verify the bundle still exists
            let bundleURL = URL(fileURLWithPath: extractedPath)
            let indexURL = bundleURL.appendingPathComponent("index.html")
            
            if FileManager.default.fileExists(atPath: indexURL.path) {
                // Configure WebView to load from the active bundle
                webView.loadFileURL(indexURL, allowingReadAccessTo: bundleURL)
                return
            }
        }
        
        // If no active bundle or bundle doesn't exist, clear the active bundle
        UserDefaults.standard.removeObject(forKey: "native_update_active_bundle")
    }
    
    // Helper method to get the current bundle's base URL
    @objc public func getCurrentBundleURL() -> URL? {
        if let activeBundleId = UserDefaults.standard.string(forKey: "native_update_active_bundle"),
           let bundles = UserDefaults.standard.dictionary(forKey: "native_update_bundles"),
           let bundleInfo = bundles[activeBundleId] as? [String: Any],
           let extractedPath = bundleInfo["extractedPath"] as? String {
            
            let bundleURL = URL(fileURLWithPath: extractedPath)
            if FileManager.default.fileExists(atPath: bundleURL.path) {
                return bundleURL
            }
        }
        
        return nil
    }
}