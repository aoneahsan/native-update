import { registerPlugin } from '@capacitor/core';

import type {
  NativeUpdateCombinedPlugin,
  NativeUpdateListeners,
} from './definitions';

const CapacitorNativeUpdate = registerPlugin<
  NativeUpdateCombinedPlugin & NativeUpdateListeners
>('CapacitorNativeUpdate', {
  web: () => import('./web').then((m) => new m.NativeUpdateWeb()),
});

// Main plugin export
export { CapacitorNativeUpdate };

// Export all type definitions, interfaces, and enums
export * from './definitions';

// Export background update utilities
export * from './background-update';

// Export security utilities
export { CryptoUtils } from './security/crypto';
export { Validator } from './security/validator';

// Export live update utilities
export { BundleManager } from './live-update/bundle-manager';
export { DownloadManager } from './live-update/download-manager';
export { VersionManager } from './live-update/version-manager';

// Export web implementation for advanced users
export { NativeUpdateWeb } from './web';
