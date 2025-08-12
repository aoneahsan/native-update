import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.nativeupdate',
  appName: 'Native Update Example',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorNativeUpdate: {
      serverUrl: 'https://your-update-server.com/api/v1',
      autoCheck: true,
      checkInterval: 3600, // 1 hour
      channel: 'production',
      publicKey: 'YOUR_BASE64_PUBLIC_KEY_HERE',
      appStoreId: '123456789', // iOS App Store ID
      enforceMinVersion: true,
      security: {
        enforceHttps: true,
        validateSignatures: true,
        pinCertificates: false
      },
      analytics: {
        enabled: true,
        provider: 'firebase'
      }
    }
  }
};

export default config;