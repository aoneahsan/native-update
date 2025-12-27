import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { App, ChannelConfig } from '@/types';
import { Plus, Package, Edit, Trash2, Calendar, Code, Smartphone, Globe, Apple } from 'lucide-react';

const defaultChannelConfig: ChannelConfig = {
  enabled: true,
  autoUpdate: false,
  updateStrategy: 'background',
  requireUserConsent: true,
  minVersion: null,
};

interface AppFormData {
  name: string;
  packageId: string;
  description: string;
  platforms: ('ios' | 'android' | 'web')[];
}

const initialFormData: AppFormData = {
  name: '',
  packageId: '',
  description: '',
  platforms: ['android'],
};

export function AppsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; app: App | null }>({
    open: false,
    app: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Create/Edit dialog state
  const [formDialog, setFormDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; app: App | null }>({
    open: false,
    mode: 'create',
    app: null,
  });
  const [formData, setFormData] = useState<AppFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error) {
      console.error('Error loading apps:', error);
      toast.error('Failed to load apps', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setFormData(initialFormData);
    setFormErrors({});
    setFormDialog({ open: true, mode: 'create', app: null });
  }

  function openEditDialog(app: App) {
    setFormData({
      name: app.name,
      packageId: app.packageId,
      description: app.description || '',
      platforms: app.platforms,
    });
    setFormErrors({});
    setFormDialog({ open: true, mode: 'edit', app });
  }

  function closeFormDialog() {
    setFormDialog({ open: false, mode: 'create', app: null });
    setFormData(initialFormData);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'App name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'App name must be at least 2 characters';
    }

    if (!formData.packageId.trim()) {
      errors.packageId = 'Package ID is required';
    } else if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(formData.packageId)) {
      errors.packageId = 'Invalid package ID format (e.g., com.example.app)';
    }

    if (formData.platforms.length === 0) {
      errors.platforms = 'Select at least one platform';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveApp() {
    if (!user || !validateForm()) return;

    setSaving(true);
    try {
      if (formDialog.mode === 'create') {
        // Create new app
        const appData = {
          userId: user.uid,
          name: formData.name.trim(),
          packageId: formData.packageId.trim().toLowerCase(),
          icon: null,
          description: formData.description.trim(),
          platforms: formData.platforms,
          channels: {
            production: { ...defaultChannelConfig },
            staging: { ...defaultChannelConfig },
            development: { ...defaultChannelConfig, autoUpdate: true },
          },
          totalBuilds: 0,
          activeUsers: 0,
          lastBuildDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'apps'), appData);

        // Update user's appsCount
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          await updateDoc(userDocRef, {
            appsCount: (userSnapshot.data().appsCount || 0) + 1,
            updatedAt: serverTimestamp(),
          });
        }

        // Add to local state
        setApps([...apps, { id: docRef.id, ...appData } as unknown as App]);
        toast.success('App created', `${formData.name} has been created successfully`);
      } else if (formDialog.app) {
        // Update existing app
        const appRef = doc(db, 'apps', formDialog.app.id);
        await updateDoc(appRef, {
          name: formData.name.trim(),
          packageId: formData.packageId.trim().toLowerCase(),
          description: formData.description.trim(),
          platforms: formData.platforms,
          updatedAt: serverTimestamp(),
        });

        // Update local state
        setApps(apps.map((app) =>
          app.id === formDialog.app!.id
            ? {
                ...app,
                name: formData.name.trim(),
                packageId: formData.packageId.trim().toLowerCase(),
                description: formData.description.trim(),
                platforms: formData.platforms,
              }
            : app
        ));
        toast.success('App updated', `${formData.name} has been updated successfully`);
      }

      closeFormDialog();
    } catch (error) {
      console.error('Error saving app:', error);
      toast.error('Failed to save app', 'Please try again later');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.app || !user) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'apps', deleteDialog.app.id));

      // Update user's appsCount
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        const currentCount = userSnapshot.data().appsCount || 0;
        await updateDoc(userDocRef, {
          appsCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        });
      }

      setApps(apps.filter((app) => app.id !== deleteDialog.app!.id));
      toast.success('App deleted', 'The app has been successfully deleted');
      setDeleteDialog({ open: false, app: null });
    } catch (error) {
      console.error('Error deleting app:', error);
      toast.error('Failed to delete app', 'Please try again later');
    } finally {
      setDeleting(false);
    }
  }

  function togglePlatform(platform: 'ios' | 'android' | 'web') {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  function getPlatformBadges(platforms: string[]) {
    return platforms.map((platform) => (
      <Badge key={platform} variant="primary" className="uppercase">
        {platform}
      </Badge>
    ));
  }

  function getActiveChannels(app: App) {
    const activeChannels = [];
    if (app.channels.production.enabled) activeChannels.push('production');
    if (app.channels.staging.enabled) activeChannels.push('staging');
    if (app.channels.development.enabled) activeChannels.push('development');
    return activeChannels;
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
          <p className="mt-2 text-gray-600">Manage your applications</p>
        </div>
        <Button variant="primary" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create App
        </Button>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No apps yet</h3>
            <p className="mt-2 text-gray-600">Get started by creating your first app</p>
            <Button variant="primary" className="mt-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1">{app.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Code className="h-3 w-3" />
                      <span className="font-mono text-xs">{app.packageId}</span>
                    </div>
                  </div>
                  {app.icon && (
                    <img
                      src={app.icon}
                      alt={app.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                  {app.description || 'No description'}
                </p>

                <div className="mb-3 flex flex-wrap gap-2">
                  {getPlatformBadges(app.platforms)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Channels:</span>
                    <span className="font-medium">{getActiveChannels(app).length} active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Builds:</span>
                    <span className="font-medium">{app.totalBuilds}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">Created {formatDate(app.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(app)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, app })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit App Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? 'Create New App' : 'Edit App'}
            </DialogTitle>
            <DialogDescription>
              {formDialog.mode === 'create'
                ? 'Set up a new app for OTA updates'
                : 'Update your app details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              label="App Name"
              placeholder="My Awesome App"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />

            <Input
              label="Package ID"
              placeholder="com.example.myapp"
              value={formData.packageId}
              onChange={(e) => setFormData({ ...formData, packageId: e.target.value.toLowerCase() })}
              error={formErrors.packageId}
              helperText="Bundle identifier (e.g., com.company.app)"
              required
            />

            <Textarea
              label="Description"
              placeholder="A brief description of your app"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Platforms <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePlatform('android')}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                    formData.platforms.includes('android')
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => togglePlatform('ios')}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                    formData.platforms.includes('ios')
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Apple className="h-4 w-4" />
                  iOS
                </button>
                <button
                  type="button"
                  onClick={() => togglePlatform('web')}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                    formData.platforms.includes('web')
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  Web
                </button>
              </div>
              {formErrors.platforms && (
                <p className="mt-1 text-sm text-red-600">{formErrors.platforms}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeFormDialog} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveApp} isLoading={saving}>
              {formDialog.mode === 'create' ? 'Create App' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, app: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.app?.name}"? This action cannot be
              undone and will delete all associated builds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, app: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Delete App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default AppsPage;
