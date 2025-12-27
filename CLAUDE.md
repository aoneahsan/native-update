# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📏 PROJECT STRUCTURE SYNC STATUS
| Metric | Value | Last Updated |
|--------|-------|--------------|
| Project Type | Capacitor Plugin Package | 2025-12-27 |
| Package Manager | pnpm@9.15.4 | 2025-12-27 |
| Workspace Setup | ✅ Monorepo with pnpm workspace | 2025-12-27 |
| Example Apps Structure | ✅ 3 simplified apps (react-capacitor, node-express, firebase-backend) | 2025-12-27 |
| Marketing Website | ✅ Complete (React + RadixUI + Firebase) | 2025-12-27 |
| Docs Organization | ✅ All docs in /docs folder | 2025-12-27 |
| .gitignore Configuration | ✅ Private repo mode | 2025-12-27 |
| Build Status | ✅ Zero errors/warnings | 2025-12-27 |
| ESLint Status | ✅ Zero warnings (no @eslint/js) | 2025-12-27 |
| Production Ready | ✅ YES | 2025-12-27 |

**Last Major Restructure:** 2025-12-27
**Completion Report:** See `/docs/reports/PROJECT_RESTRUCTURE_FINAL_SUMMARY.md`

## 🎯 Project Status: PRODUCTION READY

Both example apps restructuring and marketing website are 100% complete:
- ✅ Example apps simplified to 3 apps (67-87% reduction in complexity)
- ✅ pnpm workspace configured with `workspace:*` references
- ✅ Marketing website with 8 pages, bold animated design
- ✅ Zero build errors, zero lint warnings
- ✅ Comprehensive documentation in /docs folder
- ✅ Ready for npm publication and website deployment

## Project Type Context

**This is a Capacitor Plugin Package** - Many global CLAUDE.md rules do NOT apply:

### ❌ Rules That DO NOT Apply to This Project:
- No RadixUI/ShadCN (this is a plugin, not a UI app)
- No analytics setup (Firebase Analytics, Clarity, Amplitude)
- No user authentication or accounts
- No privacy pages, terms, about pages (plugin, not end-user app)
- No sitemap
- No app store assets (plugin is distributed via npm)
- No advertising panels
- No theme customizers
- No responsive design concerns (no UI)

### ✅ Rules That DO Apply:
- pnpm package manager exclusively
- SVG for all visual assets (logos, diagrams in docs)
- No .sh scripts policy
- *.ignore.* and project-record-ignore/ gitignore patterns
- Clean build output (zero warnings/errors)
- ESLint configuration (no @eslint/js)
- Documentation organization in /docs folder
- pnpm workspace for monorepo structure

## Monorepo Structure

This project uses **pnpm workspace** to manage the plugin and example apps:

```
/
├── src/                    # Main plugin source code
├── cli/                    # CLI tool for bundle management
├── android/                # Android native implementation
├── ios/                    # iOS native implementation
├── docs/                   # All documentation
├── example-apps/           # Example applications
│   ├── react-capacitor/    # React + Capacitor + Vite frontend example
│   ├── firebase-backend/   # Firebase Functions backend example
│   └── node-express/       # Node.js + Express backend example
├── website/                # Marketing website (separate React app)
└── pnpm-workspace.yaml     # Workspace configuration
```

**Workspace Benefits:**
- Example apps use `native-update: workspace:*` to reference local plugin
- No need to publish plugin to test in example apps
- Build plugin → changes automatically available in example apps
- Single `pnpm install` at root installs all dependencies

## Example Apps Guidelines

**Keep Example Apps SIMPLE:**
- Frontend: Single page demonstrating OTA updates ("change this text and deploy")
- Backend: Minimal setup - just enough to show plugin working
- No unnecessary complexity or features
- Focus on showcasing THIS plugin only
- Use SVG assets for all visual elements

## Project Overview

This is a Capacitor plugin project called "native-update" that provides a comprehensive update solution combining:

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

## Package Manager

**CRITICAL: This project uses pnpm exclusively**
- ✅ Use `pnpm` for all package management operations
- ❌ Never use `npm` or `yarn`
- Package manager is locked to `pnpm@9.15.4` via `packageManager` field in package.json

## 🔌 Unique Dev Server Ports

**CRITICAL: Never use default/common ports (3000, 5000, 5173, 8000, 8080)**

All sub-projects use unique ports registered in `~/.dev-ports.json`:

| Project | Dev Port | Preview Port | Registry Key |
|---------|----------|--------------|--------------|
| website | 5942 | 5943 | native-update-website |
| example-apps/react-capacitor | 5944 | 5945 | native-update-react-capacitor |

**Port Management Rules:**
- Each project has a unique port in the 5900-6999 range
- Ports are registered globally at `~/.dev-ports.json`
- Use `strictPort: true` in Vite to fail if port is taken
- Never change ports without updating: vite.config, CLAUDE.md, ~/.dev-ports.json

**Verification:** Before starting dev server, confirm port matches all 3 locations.

## ESLint Configuration

**CRITICAL: Never use @eslint/js package**
- ❌ **NEVER** use `@eslint/js` package (versioning is broken in npm registry)
- ✅ Use only `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
- ✅ Configure ESLint with flat config using TypeScript ESLint recommended rules only
- ✅ Remove any imports of `@eslint/js` from eslint.config.js

**Correct ESLint Setup**:
```javascript
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Your custom rules
    },
  },
];
```

## Common Development Commands

### Build and Development

- `pnpm run build` - Clean, compile TypeScript, and bundle with Rollup
- `pnpm run watch` - Watch mode for TypeScript compilation during development
- `pnpm run clean` - Remove dist directory

### Code Quality

- `pnpm run lint` - Run ESLint on TypeScript files
- `pnpm run prettier` - Format code with Prettier
- `pnpm run swiftlint` - Lint Swift code (when iOS implementation exists)

## Assets and Design Guidelines

**CRITICAL: Use SVG for all visual assets**

- ✅ **ALWAYS** use SVG format for icons, logos, illustrations, and graphics
- ✅ Create high-quality, scalable SVG assets with proper optimization
- ✅ Use SVG inline in documentation when possible for better rendering
- ✅ Optimize SVGs with tools like SVGO before committing
- ❌ **NEVER** use PNG, JPG, or other raster formats unless absolutely necessary (e.g., photos, screenshots)
- ❌ Avoid bloated SVGs with unnecessary metadata or complex paths

**Benefits of SVG:**
- Infinitely scalable without quality loss
- Smaller file sizes compared to high-res rasters
- Can be styled with CSS
- Better for documentation and web display
- Version control friendly (text-based)

**When raster formats are acceptable:**
- Screenshots of actual app interfaces (use PNG)
- Photographic content (use optimized JPG/WebP)
- Generated charts/graphs from external tools (convert to SVG if possible)

**SVG Best Practices:**
- Keep viewBox attribute for proper scaling
- Remove unnecessary groups and transforms
- Use semantic naming for IDs and classes
- Ensure proper accessibility with title and desc elements
- Minimize path complexity while maintaining visual quality

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

- `capacitor.config.ts` - Capacitor configuration with app ID `com.aoneahsan.nativeupdate`
- `NativeUpdate.podspec` - iOS CocoaPods specification for the plugin
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
