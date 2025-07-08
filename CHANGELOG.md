# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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