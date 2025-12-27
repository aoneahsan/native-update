import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { googleDriveService, type DriveFile } from '@/services/google-drive-service';
import { formatBytes, formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  Folder,
  Info,
  LogOut,
  HardDrive,
  FileText,
} from 'lucide-react';

export function GoogleDrivePage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [stats, setStats] = useState({ filesCount: 0, totalSize: 0 });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data() as User;
        setUserData(data);

        if (data.driveConnected) {
          await loadDriveData();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function loadDriveData() {
    if (!user) return;

    try {
      const files = await googleDriveService.listFiles(user.uid);
      const folderFiles = files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
      setFolders(folderFiles);

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      setStats({
        filesCount: files.length,
        totalSize,
      });
    } catch (error) {
      console.error('Error loading Drive data:', error);
    }
  }

  async function handleConnect() {
    if (!user) return;

    setConnecting(true);
    try {
      await googleDriveService.connectDrive(user.uid);
      toast.success('Connected to Google Drive', 'Your Drive account has been linked successfully');
      await loadData();
    } catch (error) {
      console.error('Error connecting to Drive:', error);
      toast.error(
        'Failed to connect',
        error instanceof Error ? error.message : 'Please try again later'
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!user) return;

    setDisconnecting(true);
    try {
      await googleDriveService.disconnectDrive(user.uid);
      toast.success('Disconnected from Google Drive', 'Your Drive account has been unlinked');
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              driveConnected: false,
              driveEmail: null,
              driveConnectedAt: null,
            }
          : null
      );
      setFolders([]);
      setStats({ filesCount: 0, totalSize: 0 });
    } catch (error) {
      console.error('Error disconnecting from Drive:', error);
      toast.error('Failed to disconnect', 'Please try again later');
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Google Drive</h1>
        <p className="mt-2 text-gray-600">Manage your Google Drive connection for build storage</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription className="mt-1">
                    {userData?.driveConnected
                      ? 'Your Google Drive is connected'
                      : 'Connect your Google Drive to store builds'}
                  </CardDescription>
                </div>
                {userData?.driveConnected ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {userData?.driveConnected ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <Cloud className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{userData.driveEmail}</p>
                        <p className="text-sm text-gray-600">
                          Connected {formatDateTime(userData.driveConnectedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Total Files</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{stats.filesCount}</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm">Total Size</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {formatBytes(stats.totalSize)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    onClick={handleDisconnect}
                    isLoading={disconnecting}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect Google Drive
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Why connect Google Drive?</AlertTitle>
                    <AlertDescription>
                      Connecting Google Drive allows you to store your app builds securely in the
                      cloud. All uploaded builds will be automatically organized in folders.
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    isLoading={connecting}
                    className="w-full"
                  >
                    <Cloud className="mr-2 h-4 w-4" />
                    Connect Google Drive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {userData?.driveConnected && folders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Folders in Drive</CardTitle>
                <CardDescription>Build folders created in your Google Drive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{folder.name}</p>
                          <p className="text-xs text-gray-600">
                            Created {folder.createdTime ? formatDateTime(new Date(folder.createdTime)) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {folder.webViewLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(folder.webViewLink!, '_blank')}
                        >
                          Open
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Create folders</p>
                    <p className="text-gray-600">Organize builds by app and channel</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Upload files</p>
                    <p className="text-gray-600">Store your build files securely</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">List and manage</p>
                    <p className="text-gray-600">View and delete your uploaded files</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  We only request the minimum permissions needed to manage files created by this
                  app.
                </p>
                <p>
                  Your files are stored in your own Google Drive and are never shared with third
                  parties.
                </p>
                <p>You can disconnect at any time without losing your Drive data.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

export default GoogleDrivePage;
