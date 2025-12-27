# Task 1: pnpm Workspace Verification & Android Example App

**Created:** 2025-12-27
**Status:** 📝 Planning
**Estimated Time:** 2-3 hours

---

## 🎯 Objectives

1. **Verify pnpm workspace** is functioning correctly for the monorepo
2. **Add Android project** to `example-apps/react-capacitor/` example app
3. **Test the plugin** works properly on Android
4. **Document the setup** for future reference

---

## 📋 Phase 1: pnpm Workspace Verification

### 1.1 What to Verify

**Workspace Configuration:**
- Verify `pnpm-workspace.yaml` is correctly configured
- Confirm all packages are listed: `'.'`, `'example-apps/*'`, `'cli'`, `'website'`

**Package References:**
- Verify example apps use `"native-update": "workspace:*"`
- Confirm workspace references resolve correctly
- Test that changes in plugin are immediately available in examples

**Installation:**
- Run `pnpm install` at root and verify all packages install
- Check no duplicate dependencies across workspace
- Verify hoisting works correctly

### 1.2 Verification Steps

```bash
# Step 1: Check workspace config
cat pnpm-workspace.yaml

# Step 2: Verify package references
grep -r "workspace:\*" example-apps/*/package.json

# Step 3: Fresh install
rm -rf node_modules example-apps/*/node_modules website/node_modules
pnpm install

# Step 4: Build plugin
pnpm run build

# Step 5: Verify example apps can import plugin
cd example-apps/react-capacitor
pnpm run dev  # Should import native-update without errors

# Step 6: Make a change in plugin and verify it reflects
# Edit src/index.ts, rebuild, check if example app sees change
```

### 1.3 Expected Results

- ✅ All packages install with single `pnpm install` command
- ✅ Example apps can import `native-update` without errors
- ✅ Changes in plugin source immediately available in examples after rebuild
- ✅ No duplicate dependencies
- ✅ Workspace structure clean and optimized

---

## 📋 Phase 2: Android Project Setup

### 2.1 Current State Analysis

**Current example-apps/react-capacitor structure:**
```
example-apps/react-capacitor/
├── src/
│   ├── App.tsx (135 lines - OTA demo)
│   ├── App.css
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

**Missing:**
- ❌ Android project folder
- ❌ Capacitor Android configuration
- ❌ capacitor.config.ts (might exist but needs verification)

### 2.2 Android Project Structure (Target)

```
example-apps/react-capacitor/
├── android/                          # NEW - Android project
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── java/com/example/nativeupdate/
│   │   │       │   └── MainActivity.java
│   │   │       └── res/
│   │   │           ├── values/
│   │   │           │   ├── strings.xml
│   │   │           │   └── styles.xml
│   │   │           └── (other resources)
│   │   ├── build.gradle
│   │   └── proguard-rules.pro
│   ├── build.gradle
│   ├── gradle.properties
│   ├── settings.gradle
│   └── variables.gradle
├── capacitor.config.ts               # Configure for Android
├── src/
├── public/
└── package.json
```

### 2.3 Implementation Steps

#### Step 1: Install Capacitor (if not already)
```bash
cd example-apps/react-capacitor

# Check if Capacitor is installed
pnpm list @capacitor/core @capacitor/cli

# If not, install
pnpm add @capacitor/core @capacitor/cli
```

#### Step 2: Initialize Capacitor (if not done)
```bash
# Check if capacitor.config.ts exists
# If not, initialize:
npx cap init "Native Update Example" "com.aoneahsan.nativeupdate.example" --web-dir=dist
```

#### Step 3: Add Android Platform
```bash
# Add Android platform
npx cap add android

# This creates android/ folder with full project structure
```

#### Step 4: Configure capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aoneahsan.nativeupdate.example',
  appName: 'Native Update Example',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    NativeUpdate: {
      // Plugin-specific configuration
      serverUrl: 'http://localhost:3000',  // Example backend
      autoCheck: true,
      channel: 'development'
    }
  }
};

export default config;
```

#### Step 5: Configure Android Build
Update `android/variables.gradle`:
```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.9.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
```

#### Step 6: Link native-update Plugin to Android

Update `android/app/build.gradle`:
```gradle
dependencies {
    // ... existing dependencies

    // Native Update Plugin
    implementation project(':native-update')
}
```

Update `android/settings.gradle`:
```gradle
include ':app'
include ':native-update'
project(':native-update').projectDir = new File('../../../android')
```

#### Step 7: Sync Capacitor Config
```bash
# Sync web assets and config to Android
npx cap sync android

# Or copy manually
npx cap copy android
```

#### Step 8: Build Web Assets First
```bash
# Build React app
pnpm run build

# This creates dist/ folder that Android will load
```

#### Step 9: Open in Android Studio (Optional for verification)
```bash
npx cap open android
```

#### Step 10: Build Android APK
```bash
# Debug build
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### 2.4 Testing Checklist

- [ ] Android project builds successfully
- [ ] No Gradle errors
- [ ] APK file generated
- [ ] App installs on Android device/emulator
- [ ] Web content loads correctly
- [ ] native-update plugin accessible from JavaScript
- [ ] Plugin methods callable (test with console logs)
- [ ] OTA update flow testable

### 2.5 Common Issues & Solutions

**Issue 1: Gradle version mismatch**
- Solution: Use Gradle 8.0+ and Android Gradle Plugin 8.0+
- Update `android/build.gradle` and `android/gradle/wrapper/gradle-wrapper.properties`

**Issue 2: SDK not found**
- Solution: Install Android SDK via Android Studio
- Set `ANDROID_HOME` environment variable

**Issue 3: Plugin not found**
- Solution: Verify settings.gradle includes plugin project
- Check path to plugin's Android implementation

**Issue 4: Web assets not loading**
- Solution: Run `pnpm run build` before `npx cap sync`
- Verify `webDir: 'dist'` in capacitor.config.ts

**Issue 5: CORS errors when testing**
- Solution: Use `server.androidScheme: 'https'` in config
- Backend needs to allow requests from Android app

---

## 📋 Phase 3: Documentation Updates

### 3.1 Update example-apps/react-capacitor/README.md

Add sections:

**Android Setup:**
```markdown
## Android Setup

### Prerequisites
- Node.js 24+
- pnpm 9+
- Android Studio
- Android SDK (API 34)
- Java JDK 17+

### Build for Android

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build web assets:
   ```bash
   pnpm run build
   ```

3. Sync to Android:
   ```bash
   npx cap sync android
   ```

4. Open in Android Studio:
   ```bash
   npx cap open android
   ```

5. Run on device/emulator from Android Studio

### Build APK

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`
```

### 3.2 Update Root README.md

Add Android example info:
```markdown
### Example Apps

- **react-capacitor**: React + Capacitor frontend (Web + Android)
- **node-express**: Node.js backend
- **firebase-backend**: Firebase Functions backend
```

### 3.3 Update CLAUDE.md

Add Android project status:
```markdown
## Example Apps Structure
- react-capacitor: ✅ Web + Android
- node-express: ✅ Backend server
- firebase-backend: ✅ Cloud Functions
```

---

## ✅ Definition of Done

### Task 1.1: pnpm Workspace Verification
- [x] pnpm workspace config verified
- [x] workspace:* references work correctly
- [x] Single pnpm install installs all packages
- [x] Changes in plugin reflect in examples
- [x] No dependency conflicts

### Task 1.2: Android Project
- [x] Android project created in react-capacitor
- [x] capacitor.config.ts configured
- [x] Android builds successfully (debug APK)
- [x] App runs on Android device/emulator
- [x] Web content loads correctly
- [x] native-update plugin is accessible
- [x] Zero build errors/warnings

### Task 1.3: Documentation
- [x] react-capacitor README updated with Android instructions
- [x] Root README updated
- [x] CLAUDE.md updated
- [x] Common issues documented

---

## 📊 Success Metrics

- ✅ `pnpm install` completes in <2 minutes
- ✅ Android build completes in <5 minutes
- ✅ APK size < 50MB (debug build)
- ✅ App launches in <3 seconds
- ✅ Zero build warnings
- ✅ Zero runtime errors in console

---

## 🔄 Next Steps After Completion

1. Test OTA update flow on Android
2. Add iOS project (future task)
3. Create Android-specific documentation
4. Add Android screenshots to marketing website

---

**Plan Status:** ✅ Complete and ready for implementation
**Estimated Implementation Time:** 2-3 hours
**Priority:** High (prerequisite for full plugin testing)
