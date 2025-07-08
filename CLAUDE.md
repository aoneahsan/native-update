# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Capacitor plugin project called "capacitor-native-update" that provides a comprehensive update solution combining:
1. **Live/OTA Updates** - Deploy JavaScript/HTML/CSS updates instantly without app store approval
2. **Native App Updates** - Check and prompt for app store updates
3. **App Review Integration** - Request user reviews at optimal moments

The plugin aims to be type-safe, framework-independent, secure, and highly performant, offering a complete update lifecycle management solution.

## Key Features to Implement

### Live Update (OTA) Features
- Bundle download and management with delta updates
- Multiple update strategies (immediate, background, manual)
- Version management with semantic versioning
- Automatic rollback on failed updates
- Update channels (production, staging, development)
- End-to-end encryption and signature verification
- Bundle integrity checks with checksums

### Native App Update Features
- App store version checking
- Immediate (blocking) and flexible (background) updates
- Version comparison and update priority
- Native update UI integration
- Direct app store navigation

### App Review Features
- In-app review prompts without leaving the app
- Smart triggering with rate limiting
- Platform-specific implementations (StoreKit for iOS, Play Core for Android)

## Common Development Commands

### Build and Development
- `npm run build` - Clean, compile TypeScript, and bundle with Rollup
- `npm run watch` - Watch mode for TypeScript compilation during development
- `npm run clean` - Remove dist directory

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run prettier` - Format code with Prettier
- `npm run swiftlint` - Lint Swift code (when iOS implementation exists)

## Architecture and Structure

### Plugin Architecture
The plugin follows the standard Capacitor plugin structure with separate implementations for web, Android, and iOS platforms:

1. **TypeScript Core (`/src/`)**: 
   - `definitions.ts` - Plugin interface definitions that all platforms must implement
   - `index.ts` - Main entry point that exports the plugin
   - `web.ts` - Web implementation of the plugin interface
   - `live-update/` - Live update functionality modules
   - `app-update/` - Native app update modules
   - `app-review/` - App review modules

2. **Native Implementations** (to be created):
   - `/android/` - Android native implementation using Kotlin
     - Google Play Core Library for in-app updates
     - Play Core for in-app reviews
     - Custom bundle management
   - `/ios/` - iOS native implementation using Swift
     - StoreKit for app reviews
     - URLSession for update downloads
     - Manual version checking for app updates

3. **Build Output (`/dist/`)**: Generated JavaScript bundles for different module systems

### Key Configuration Files
- `capacitor.config.ts` - Capacitor configuration with app ID `com.zaions.cap_native_update`
- `CapacitorNativeUpdate.podspec` - iOS CocoaPods specification for the plugin
- `rollup.config.js` - Bundler configuration for multiple output formats

### Development Workflow
1. Define the plugin API in `src/definitions.ts` with three main interfaces:
   - `LiveUpdatePlugin` - OTA update methods
   - `AppUpdatePlugin` - Native app update methods  
   - `AppReviewPlugin` - Review request methods
2. Implement web fallback in `src/web.ts` 
3. Create native implementations in platform-specific directories
4. Implement security features (encryption, signature verification)
5. Build and test using the provided npm scripts
6. Ensure code quality with lint and prettier before commits

### Security Implementation Notes (Following Capacitor Security Guidelines)

#### Core Security Principles
- **Never embed secrets** in plugin code (API keys, encryption keys, certificates)
- Always use HTTPS for update URLs - never allow http:// endpoints
- Implement SHA-256 (or higher) checksum verification for all downloads
- Use public key verification for bundle signatures (RSA/ECDSA)
- Implement certificate pinning for critical update server connections
- Validate and sanitize all input from JavaScript layer
- Only pass JSON-serializable data between native and web layers

#### Platform-Specific Security
- **iOS**: Use Keychain Services for sensitive data, not UserDefaults
- **iOS**: Validate all file operations stay within app sandbox
- **Android**: Use Android Keystore for sensitive data storage
- **Android**: Request only necessary permissions with runtime checks
- **Both**: Use platform-specific secure networking APIs

#### Update Security Requirements
- Prevent downgrade attacks by default (validate version numbers)
- Store downloads in system temporary directories with proper permissions
- Clean up temporary files immediately after installation or failure
- Implement proper file locking mechanisms during updates
- Set reasonable file size limits to prevent resource exhaustion
- Validate MIME types and file extensions before processing

#### Error Handling Best Practices
- Never expose system paths or internal implementation details in errors
- Provide detailed error codes for debugging without revealing sensitive info
- Log security events without including sensitive data
- Implement comprehensive input validation with clear error messages

#### Permission Management
- Request permissions only when needed (lazy loading)
- Implement proper permission callbacks and error handling
- Document all required permissions and their purposes
- Use Capacitor's @Permission decorator for Android

#### Testing Security Features
- Test with malformed update packages
- Verify checksum validation with corrupted files
- Test network interruption and retry scenarios
- Validate permission denial flows
- Test storage limit scenarios