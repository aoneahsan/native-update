# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2025-01-15

### Fixed
- **Critical Android Build Issues**:
  - Fixed Google Play app-update library dependencies by using explicit version 2.1.0 instead of variable
  - Resolved kotlinVersion resolution issues by hardcoding version in gradle plugin
  - Made all Google Play Services dependencies use explicit versions to prevent resolution errors
  - Added variables.gradle file for better variable management
  - Ensured no manual intervention is required by users

### Changed
- Updated package version to 1.0.7
- Hardcoded critical dependency versions in Android build.gradle to prevent resolution issues

## [1.0.6] - 2025-01-15

### Fixed
- **Android Build Issues**:
  - Fixed Google Play app-update library version error (changed from non-existent 18.2.0 to correct 2.1.0)
  - Fixed `kotlinVersion` MissingPropertyException by properly defining it in buildscript ext block
  - Added missing Kotlin stdlib dependency
  - Reorganized build.gradle structure to ensure proper variable scope

### Documentation Fixes
- Corrected all API method references to match TypeScript definitions
- Fixed method signatures and parameters across all documentation
- Updated event names to match the 4 defined events (downloadProgress, updateStateChanged, backgroundUpdateProgress, backgroundUpdateNotification)
- Removed references to non-existent methods
- Fixed broken documentation links

### Android Configuration
- kotlinVersion: 1.9.22 (stable version)
- playAppUpdateVersion: 2.1.0 (correct Google Play version)
- playReviewVersion: 2.0.1
- All dependencies now use proper version variables

## [1.4.0] - 2025-01-02

### Added

- Complete TypeScript implementation with strict typing
- Core plugin architecture with modular design
- Comprehensive error handling system
- Security validation framework
- Bundle management system
- Download manager with retry logic
- Version management capabilities
- Configuration manager
- Logging system with multiple log levels
- Cache management
- Background update support
- Plugin initialization system

### Changed

- Migrated from class-based to functional architecture
- Improved type definitions and interfaces
- Enhanced security with input validation
- Better error messages and error codes

### Fixed

- Removed circular dependencies
- Fixed TypeScript compilation issues
- Proper exclusion of test files in tsconfig
- Removed console.log statements in favor of Logger

## [0.0.2] - 2024-12-01

### Added

- Comprehensive documentation for all features
- Bundle signing and security utilities
- CI/CD pipeline with GitHub Actions
- Example update server implementation
- TypeScript strict mode
- ESLint v9 flat config support

### Fixed

- Security vulnerabilities in update process
- TypeScript compilation errors
- Path traversal prevention

### Security

- Enforced HTTPS for all update downloads
- Added RSA signature verification
- Implemented checksum validation
- Added certificate pinning support

## [0.0.1] - 2024-01-08

### Added

- Initial release of Capacitor Native Update plugin
- Live/OTA update functionality
  - Bundle download and management
  - Multiple update strategies (immediate, background, manual)
  - Delta update support
  - Automatic rollback on failed updates
  - Update channels (production, staging, development)
  - End-to-end encryption and signature verification
  - Bundle integrity checks with SHA-256/512 checksums
- Native app update functionality
  - App store version checking
  - Immediate and flexible update flows (Android)
  - Direct app store navigation
  - Version comparison and update priority
- App review functionality
  - In-app review prompts using native APIs
  - Smart triggering with configurable conditions
  - Rate limiting to respect platform quotas
- Security features
  - HTTPS enforcement by default
  - Certificate pinning support
  - Public key signature verification
  - Input validation and sanitization
  - Secure storage using platform keystores
- Platform support
  - iOS implementation using Swift
  - Android implementation using Kotlin
  - Web fallback implementation
- Comprehensive TypeScript definitions
- Example application demonstrating all features
- Extensive documentation
  - API reference
  - Security guidelines
  - Migration guide
  - Feature overview

### Security

- Enforced HTTPS for all update operations by default
- Required checksum validation for all bundle downloads
- Implemented path traversal prevention
- Added secure storage for sensitive configuration

### Known Issues

- ESLint configuration needs update for v9 compatibility
- Certificate pinning requires manual certificate configuration
- Delta updates require server-side implementation

## Future Releases

### [0.1.0] - Planned

- Add delta update server reference implementation
- Improve offline update handling
- Add update scheduling APIs
- Enhanced progress reporting with ETA
- Batch update support

### [0.2.0] - Planned

- Machine learning for optimal update timing
- Peer-to-peer update distribution
- Advanced A/B testing framework
- Custom update UI components
- Differential compression algorithms
