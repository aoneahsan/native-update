import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { googleDriveService } from '@/services/google-drive-service';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { App, Build } from '@/types';
import { Upload, FileUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function UploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apps, setApps] = useState<App[]>([]);
  const [recentUploads, setRecentUploads] = useState<Build[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    appId: '',
    channel: 'development' as 'production' | 'staging' | 'development',
    platform: 'android' as 'ios' | 'android' | 'web',
    version: '',
    buildNumber: 1,
    releaseNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
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

      const buildsRef = collection(db, 'builds');
      const buildsQuery = query(
        buildsRef,
        where('userId', '==', user.uid),
        where('uploadedBy', '==', user.uid)
      );
      const buildsSnapshot = await getDocs(buildsQuery);
      const buildsData = buildsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as Build)
        .sort((a, b) => {
          const aTime = a.uploadedAt instanceof Object && 'toMillis' in a.uploadedAt ? a.uploadedAt.toMillis() : 0;
          const bTime = b.uploadedAt instanceof Object && 'toMillis' in b.uploadedAt ? b.uploadedAt.toMillis() : 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      setRecentUploads(buildsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors({});
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setErrors({});
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.appId) newErrors.appId = 'Please select an app';
    if (!formData.version) newErrors.version = 'Version is required';
    if (!formData.buildNumber) newErrors.buildNumber = 'Build number is required';
    if (!selectedFile) newErrors.file = 'Please select a file to upload';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleUpload() {
    if (!user || !validateForm() || !selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(10);

      const driveResult = await googleDriveService.uploadFile(
        user.uid,
        selectedFile,
        formData.appId,
        formData.channel,
        {
          version: formData.version,
          buildNumber: formData.buildNumber,
          releaseNotes: formData.releaseNotes,
        }
      );

      setUploadProgress(70);

      const buildData = {
        userId: user.uid,
        appId: formData.appId,
        version: formData.version,
        buildNumber: formData.buildNumber,
        versionCode: formData.buildNumber,
        bundleVersion: formData.version,
        channel: formData.channel,
        platform: formData.platform,
        fileName: driveResult.fileName,
        fileSize: driveResult.size,
        fileType: selectedFile.name.endsWith('.zip') ? 'zip' : selectedFile.name.endsWith('.apk') ? 'apk' : 'ipa',
        mimeType: driveResult.mimeType,
        checksum: driveResult.checksum,
        signature: null,
        driveFileId: driveResult.fileId,
        driveFileUrl: driveResult.driveFileUrl,
        driveFolderId: driveResult.folderId,
        releaseNotes: formData.releaseNotes,
        releaseType: 'patch' as const,
        isPreRelease: formData.channel !== 'production',
        uploadedAt: serverTimestamp(),
        uploadedBy: user.uid,
        uploadDuration: 0,
        status: 'active' as const,
        error: null,
        downloads: 0,
        installs: 0,
        rollbacks: 0,
        errors: 0,
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'builds'), buildData);

      setUploadProgress(90);

      await updateDoc(doc(db, 'apps', formData.appId), {
        totalBuilds: (apps.find((a) => a.id === formData.appId)?.totalBuilds || 0) + 1,
        lastBuildDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        await updateDoc(userDocRef, {
          buildsCount: (userData.buildsCount || 0) + 1,
          storageUsed: (userData.storageUsed || 0) + driveResult.size,
          updatedAt: serverTimestamp(),
        });
      }

      setUploadProgress(100);

      toast.success('Upload successful', 'Your build has been uploaded successfully');

      setFormData({
        appId: '',
        channel: 'development',
        platform: 'android',
        version: '',
        buildNumber: 1,
        releaseNotes: '',
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      loadData();
    } catch (error) {
      console.error('Error uploading build:', error);
      toast.error('Upload failed', error instanceof Error ? error.message : 'Please try again later');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  if (apps.length === 0) {
    return (
      <Container className="py-8">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No apps found</AlertTitle>
          <AlertDescription>
            You need to create an app before you can upload builds.{' '}
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
        <h1 className="text-3xl font-bold text-gray-900">Upload Build</h1>
        <p className="mt-2 text-gray-600">Deploy a new version of your app</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Build Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-brand-500 hover:bg-brand-50'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".zip,.apk,.ipa"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                    <p className="mt-4 font-medium text-green-900">{selectedFile.name}</p>
                    <p className="mt-1 text-sm text-green-700">{formatBytes(selectedFile.size)}</p>
                  </>
                ) : (
                  <>
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 font-medium text-gray-900">
                      Drop your file here, or click to browse
                    </p>
                    <p className="mt-1 text-sm text-gray-600">ZIP, APK, or IPA files only</p>
                  </>
                )}
                {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="App"
                  required
                  options={[
                    { value: '', label: 'Select an app' },
                    ...apps.map((app) => ({ value: app.id, label: app.name })),
                  ]}
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                  error={errors.appId}
                />

                <Select
                  label="Channel"
                  required
                  options={[
                    { value: 'development', label: 'Development' },
                    { value: 'staging', label: 'Staging' },
                    { value: 'production', label: 'Production' },
                  ]}
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value as typeof formData.channel })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select
                  label="Platform"
                  required
                  options={[
                    { value: 'android', label: 'Android' },
                    { value: 'ios', label: 'iOS' },
                    { value: 'web', label: 'Web' },
                  ]}
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as typeof formData.platform })}
                />

                <Input
                  label="Version"
                  required
                  placeholder="1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  error={errors.version}
                  helperText="Semantic version (e.g., 1.0.0)"
                />

                <Input
                  label="Build Number"
                  required
                  type="number"
                  placeholder="1"
                  value={formData.buildNumber}
                  onChange={(e) => setFormData({ ...formData, buildNumber: parseInt(e.target.value) || 1 })}
                  error={errors.buildNumber}
                />
              </div>

              <Textarea
                label="Release Notes"
                placeholder="What's new in this version?"
                value={formData.releaseNotes}
                onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                helperText="Optional but recommended"
              />

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-medium text-brand-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleUpload}
                  isLoading={uploading}
                  disabled={!selectedFile}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Build
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      appId: '',
                      channel: 'development',
                      platform: 'android',
                      version: '',
                      buildNumber: 1,
                      releaseNotes: '',
                    });
                    setSelectedFile(null);
                    setErrors({});
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={uploading}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {recentUploads.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">No recent uploads</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUploads.map((build) => (
                    <div
                      key={build.id}
                      className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{build.version}</p>
                          <p className="text-xs text-gray-600 capitalize">
                            {build.channel} • {build.platform}
                          </p>
                        </div>
                        {getStatusBadge(build.status)}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatRelativeTime(build.uploadedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

export default UploadPage;
