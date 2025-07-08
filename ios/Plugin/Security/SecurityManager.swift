import Foundation
import Security
import CommonCrypto
import CryptoKit

class SecurityManager {
    private var config: [String: Any]?
    private let keychain = KeychainWrapper()
    
    func configure(_ config: [String: Any]) throws {
        self.config = config
        
        // Validate security configuration
        let enforceHttps = config["enforceHttps"] as? Bool ?? true
        if !enforceHttps {
            print("⚠️ SecurityManager: HTTPS enforcement is disabled. This is not recommended for production.")
        }
    }
    
    func getSecurityInfo() -> [String: Any] {
        return [
            "enforceHttps": config?["enforceHttps"] as? Bool ?? true,
            "certificatePinning": [
                "enabled": (config?["certificatePinning"] as? [String: Any])?["enabled"] as? Bool ?? false,
                "certificates": (config?["certificatePinning"] as? [String: Any])?["certificates"] as? [String] ?? []
            ],
            "validateInputs": config?["validateInputs"] as? Bool ?? true,
            "secureStorage": config?["secureStorage"] as? Bool ?? true
        ]
    }
    
    func validateUrl(_ url: String) -> Bool {
        if !url.hasPrefix("https://") && isHttpsEnforced() {
            return false
        }
        
        // Check against allowed hosts if configured
        if let allowedHosts = getAllowedHosts(), !allowedHosts.isEmpty {
            guard let urlComponents = URLComponents(string: url),
                  let host = urlComponents.host else {
                return false
            }
            return allowedHosts.contains(host)
        }
        
        return true
    }
    
    func verifySignature(data: Data, signature: String, publicKeyString: String) -> Bool {
        guard let publicKeyData = Data(base64Encoded: publicKeyString),
              let signatureData = Data(base64Encoded: signature) else {
            return false
        }
        
        do {
            // Create SecKey from public key data
            let attributes: [String: Any] = [
                kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
                kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
                kSecAttrKeySizeInBits as String: 2048
            ]
            
            guard let secKey = SecKeyCreateWithData(publicKeyData as CFData, attributes as CFDictionary, nil) else {
                return false
            }
            
            // Verify signature
            let algorithm = SecKeyAlgorithm.rsaSignatureMessagePKCS1v15SHA256
            return SecKeyVerifySignature(secKey, algorithm, data as CFData, signatureData as CFData, nil)
        } catch {
            print("Signature verification failed: \(error)")
            return false
        }
    }
    
    func calculateChecksum(for data: Data, algorithm: String = "SHA-256") -> String {
        let digest: Data
        
        switch algorithm {
        case "SHA-256":
            digest = SHA256.hash(data: data).data
        case "SHA-512":
            digest = SHA512.hash(data: data).data
        default:
            // Fallback to SHA-256
            digest = SHA256.hash(data: data).data
        }
        
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    
    func saveSecureData(key: String, value: String) {
        if isSecureStorageEnabled() {
            keychain.set(value, forKey: key)
        } else {
            // Fallback to UserDefaults (not recommended)
            UserDefaults.standard.set(value, forKey: key)
        }
    }
    
    func getSecureData(key: String) -> String? {
        if isSecureStorageEnabled() {
            return keychain.string(forKey: key)
        } else {
            return UserDefaults.standard.string(forKey: key)
        }
    }
    
    func validatePath(_ path: String) -> Bool {
        // Prevent directory traversal attacks
        if path.contains("..") || path.contains("//") {
            return false
        }
        
        // Ensure path is within app's sandbox
        let url = URL(fileURLWithPath: path)
        let standardizedPath = url.standardizedFileURL.path
        
        // Check if path is within allowed directories
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!.path
        let cachesPath = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!.path
        let tempPath = NSTemporaryDirectory()
        
        return standardizedPath.hasPrefix(documentsPath) ||
               standardizedPath.hasPrefix(cachesPath) ||
               standardizedPath.hasPrefix(tempPath)
    }
    
    func sanitizeInput(_ input: String) -> String {
        // Remove potentially dangerous characters
        let allowedCharacters = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "._-"))
        return input.components(separatedBy: allowedCharacters.inverted).joined()
    }
    
    func isHttpsEnforced() -> Bool {
        return config?["enforceHttps"] as? Bool ?? true
    }
    
    func isSecureStorageEnabled() -> Bool {
        return config?["secureStorage"] as? Bool ?? true
    }
    
    func isInputValidationEnabled() -> Bool {
        return config?["validateInputs"] as? Bool ?? true
    }
    
    func logSecurityEvent(_ event: String, details: String? = nil) {
        guard config?["logSecurityEvents"] as? Bool == true else { return }
        
        let message = "Security Event: \(event) \(details ?? "")"
        print("🔒 \(message)")
        
        // In production, you might want to send these to a security monitoring service
    }
    
    private func getAllowedHosts() -> [String]? {
        var hosts: [String] = []
        
        // Add hosts from live update config
        if let liveUpdateConfig = config?["liveUpdate"] as? [String: Any],
           let allowedHosts = liveUpdateConfig["allowedHosts"] as? [String] {
            hosts.append(contentsOf: allowedHosts)
        }
        
        // Add host from server URL
        if let serverUrl = config?["serverUrl"] as? String,
           let urlComponents = URLComponents(string: serverUrl),
           let host = urlComponents.host {
            hosts.append(host)
        }
        
        return hosts.isEmpty ? nil : Array(Set(hosts))
    }
}

// MARK: - Keychain Wrapper

private class KeychainWrapper {
    private let serviceName = "com.capacitor.nativeupdate"
    
    func set(_ value: String, forKey key: String) {
        guard let data = value.data(using: .utf8) else { return }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        // Delete any existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func string(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        guard status == errSecSuccess,
              let data = dataTypeRef as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return string
    }
    
    func remove(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - CryptoKit Extensions

extension Digest {
    var data: Data {
        Data(self)
    }
}