# Known Limitations & Implementation Notes

**Last Updated**: 2025-12-26
**Project Version**: 1.1.6
**Status**: Beta - Ready for Testing

---

## Overview

This document tracks known limitations and platform-specific implementation notes that need attention before production deployment. These are intentional design decisions or platform limitations that cannot be fully resolved in the web/JavaScript layer.

---

## Web Platform Limitations

### 1. Storage Size Detection
**Location**: `src/core/performance.ts:166-167`

**Issue**: Accurate storage detection is not available via web APIs

**Current Implementation**:
```typescript
// Check storage (placeholder - implement per platform)
const storage = 1000; // MB - placeholder
```

**Why This Exists**:
- Web platform does not provide reliable storage size APIs
- Navigator.storage.estimate() has limited support and accuracy
- Actual storage depends on platform implementation (iOS/Android)

**Resolution**:
- ✅ Web: Use hardcoded reasonable value (1000MB)
- ✅ iOS: Implement via native FileManager in Swift
- ✅ Android: Implement via native StatFs in Kotlin

**Status**: **ACCEPTABLE** - This is a web platform limitation, native implementations should override this

---

### 2. Certificate Pinning
**Location**: `src/core/security.ts:363`

**Issue**: Certificate pinning cannot be implemented on web platform

**Current Implementation**:
```typescript
/**
 * Validate certificate pinning
 * Note: This is a placeholder for web implementation as certificate pinning
 * is primarily a native platform feature and cannot be fully implemented in web
 */
async validateCertificatePin(hostname: string, certificate: string): Promise<boolean> {
  // Implementation for native platforms only
  // Web platform always returns true (no pinning available)
}
```

**Why This Exists**:
- Certificate pinning requires low-level network stack access
- Web browsers do not expose certificate details to JavaScript
- This is a security feature that MUST be implemented on native platforms

**Resolution**:
- ✅ Web: Document limitation, rely on HTTPS
- ✅ iOS: Implement via URLSessionDelegate in Swift
- ✅ Android: Implement via OkHttp CertificatePinner in Kotlin

**Status**: **ACCEPTABLE** - This is intentional, native implementations exist

---

## iOS Native Implementation Notes

### 1. File Operations - Bundle Installation
**Location**: `ios/Plugin/LiveUpdate/LiveUpdatePlugin.swift:570`

**Issue**: Simple file copy used instead of proper archive extraction

**Current Implementation**:
```swift
// For now, we'll use a simple file copy as placeholder
// This works for development but production needs proper implementation
```

**Why This Exists**:
- Full archive extraction requires additional Swift dependencies
- Need to evaluate: ZIPFoundation vs SSZipArchive vs native solutions
- Current implementation sufficient for basic testing

**Resolution Options**:
1. Use ZIPFoundation (Swift Package Manager)
2. Use SSZipArchive (CocoaPods)
3. Implement custom using libcompression

**Status**: **NEEDS IMPLEMENTATION** before production use

---

### 2. Archive Extraction
**Location**: `ios/Plugin/LiveUpdate/LiveUpdatePlugin.swift:573`

**Issue**: Proper unzip library needed for bundle extraction

**Current Implementation**:
```swift
// This is a placeholder - in real implementation, use a proper unzip library
// such as ZIPFoundation or SSZipArchive
```

**Why This Exists**:
- Bundles are distributed as compressed archives
- Need secure, verified extraction process
- Must handle corrupted archives gracefully

**Resolution**:
- Implement proper archive extraction with ZIPFoundation
- Add checksum verification before extraction
- Handle extraction errors with proper rollback

**Status**: **NEEDS IMPLEMENTATION** before production use

---

## Android Native Implementation Notes

### Status
- ✅ Android implementation is more complete than iOS
- ✅ Uses standard Java/Kotlin APIs for file operations
- ✅ Archive extraction via java.util.zip

**No critical placeholders identified in Android code**

---

## Summary of Action Items

### Before Production Deployment

1. **iOS File Operations** (CRITICAL)
   - [ ] Replace file copy placeholder with proper implementation
   - [ ] Implement secure archive extraction with ZIPFoundation
   - [ ] Add comprehensive error handling
   - [ ] Test with corrupted/malicious archives

2. **Certificate Pinning** (OPTIONAL - only if using HTTPS pinning)
   - [ ] Document that web cannot support pinning
   - [ ] Ensure iOS implementation is complete
   - [ ] Ensure Android implementation is complete
   - [ ] Test pinning validation on both platforms

3. **Storage Detection** (LOW PRIORITY)
   - [ ] iOS: Implement via FileManager
   - [ ] Android: Implement via StatFs
   - [ ] Web: Keep current hardcoded value

---

## Development vs Production

### Development/Testing (Current State)
- ✅ Placeholders are acceptable
- ✅ Web implementation works for testing
- ✅ Basic functionality available on all platforms

### Production Requirements
- ❌ iOS file operations MUST be properly implemented
- ❌ Certificate pinning should be implemented if using pinning strategy
- ⚠️ Storage detection recommended but not critical

---

## Testing Recommendations

### Before Marking as Production-Ready

1. **iOS Testing**
   - Test bundle download and extraction on real device
   - Test with large bundles (50MB+)
   - Test with corrupted/invalid archives
   - Verify rollback works when extraction fails

2. **Android Testing**
   - Verify archive extraction works correctly
   - Test storage detection accuracy
   - Test certificate pinning if enabled

3. **Web Testing**
   - Document limitations clearly
   - Ensure graceful degradation
   - Test error handling

---

## Notes

- These limitations are **intentional and documented**
- The package is designed as a **foundation/framework**
- Production implementations should address these based on needs
- Not all limitations need fixing for every use case

**This is NOT a complete production solution** - it's a foundation that requires platform-specific implementation for production use.
