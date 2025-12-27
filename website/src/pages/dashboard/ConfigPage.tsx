import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { App } from '@/types';
import { Copy, CheckCircle, Code, FileCode, Package } from 'lucide-react';

export function ConfigPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadApps();
  }, [user]);

  async function loadApps() {
    if (!user) return;

    try {
      const appsRef = collection(db, 'apps');
      const appsQuery = query(appsRef, where('userId', '==', user.uid));
      const appsSnapshot = await getDocs(appsQuery);

      const appsData = appsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as App[];

      setApps(appsData);

      if (appsData.length > 0 && !selectedAppId) {
        setSelectedAppId(appsData[0].id);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
      toast.error('Failed to load apps', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(code: string, index: number) {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      toast.error('Failed to copy', 'Please try again');
    }
  }

  const selectedApp = apps.find((app) => app.id === selectedAppId);

  const configurations = selectedApp
    ? [
        {
          title: 'iOS Configuration',
          description: 'Add this to your Info.plist file',
          icon: Package,
          language: 'xml',
          code: `<key>NativeUpdateConfig</key>
<dict>
    <key>appId</key>
    <string>${selectedApp.packageId}</string>
    <key>updateUrl</key>
    <string>https://your-update-server.com/api/updates</string>
    <key>channel</key>
    <string>production</string>
    <key>checkFrequency</key>
    <integer>3600</integer>
    <key>autoUpdate</key>
    <true/>
</dict>`,
        },
        {
          title: 'Android Configuration',
          description: 'Add this to your AndroidManifest.xml',
          icon: Code,
          language: 'xml',
          code: `<meta-data
    android:name="com.aoneahsan.nativeupdate.appId"
    android:value="${selectedApp.packageId}" />
<meta-data
    android:name="com.aoneahsan.nativeupdate.updateUrl"
    android:value="https://your-update-server.com/api/updates" />
<meta-data
    android:name="com.aoneahsan.nativeupdate.channel"
    android:value="production" />
<meta-data
    android:name="com.aoneahsan.nativeupdate.autoUpdate"
    android:value="true" />`,
        },
        {
          title: 'Capacitor Configuration',
          description: 'Add this to your capacitor.config.ts',
          icon: FileCode,
          language: 'typescript',
          code: `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${selectedApp.packageId}',
  appName: '${selectedApp.name}',
  webDir: 'dist',
  plugins: {
    NativeUpdate: {
      appId: '${selectedApp.packageId}',
      updateUrl: 'https://your-update-server.com/api/updates',
      channel: 'production',
      checkFrequency: 3600,
      autoUpdate: true,
      updateStrategy: 'background'
    }
  }
};

export default config;`,
        },
        {
          title: 'JavaScript/TypeScript Usage',
          description: 'Initialize and use the plugin in your code',
          icon: Code,
          language: 'typescript',
          code: `import { NativeUpdate } from '@aoneahsan/native-update';

// Check for updates
async function checkForUpdates() {
  try {
    const update = await NativeUpdate.checkForUpdate();

    if (update.available) {
      console.log('Update available:', update.version);

      // Download the update
      await NativeUpdate.downloadUpdate({
        onProgress: (progress) => {
          console.log('Download progress:', progress.percent + '%');
        }
      });

      // Install the update
      await NativeUpdate.installUpdate();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

// Listen for update events
NativeUpdate.addListener('updateAvailable', (info) => {
  console.log('New update available:', info.version);
});

NativeUpdate.addListener('downloadProgress', (progress) => {
  console.log('Download progress:', progress.percent);
});

NativeUpdate.addListener('updateReady', () => {
  console.log('Update ready to install');
});`,
        },
      ]
    : [];

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      </Container>
    );
  }

  if (apps.length === 0) {
    return (
      <Container className="py-8">
        <Alert variant="warning">
          <Package className="h-4 w-4" />
          <AlertTitle>No apps found</AlertTitle>
          <AlertDescription>
            You need to create an app before viewing configurations.{' '}
            <a href="/dashboard/apps" className="font-medium underline">
              Create your first app
            </a>
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-2 text-gray-600">
          Copy and paste these configurations into your project
        </p>
      </div>

      <div className="mb-6">
        <Select
          label="Select App"
          options={apps.map((app) => ({ value: app.id, label: app.name }))}
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
        />
      </div>

      {selectedApp && (
        <Alert variant="info" className="mb-6">
          <Package className="h-4 w-4" />
          <AlertTitle>Configuration for: {selectedApp.name}</AlertTitle>
          <AlertDescription>
            Package ID: <code className="font-mono text-sm">{selectedApp.packageId}</code>
            <br />
            Update the <code className="font-mono text-sm">updateUrl</code> with your actual server
            URL.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {configurations.map((config, index) => {
          const Icon = config.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-100 p-2">
                      <Icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle>{config.title}</CardTitle>
                      <CardDescription className="mt-1">{config.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(config.code, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="mr-2 h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  <code>{config.code}</code>
                </pre>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Install the plugin</p>
                <code className="mt-1 block rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                  npm install @aoneahsan/native-update
                </code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Add platform-specific configuration</p>
                <p className="text-gray-600">
                  Copy the iOS/Android configuration above into your project
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Set up your update server</p>
                <p className="text-gray-600">
                  Replace <code className="font-mono text-xs">updateUrl</code> with your server URL
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                4
              </span>
              <div>
                <p className="font-medium text-gray-900">Implement update logic</p>
                <p className="text-gray-600">
                  Use the JavaScript/TypeScript example above to check and install updates
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                5
              </span>
              <div>
                <p className="font-medium text-gray-900">Upload your first build</p>
                <p className="text-gray-600">
                  <a href="/dashboard/upload" className="text-brand-600 hover:underline">
                    Upload a build
                  </a>{' '}
                  to get started with updates
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ConfigPage;
