import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import type { App } from '@/types';
import { Plus, Package, Edit, Trash2, Calendar, Code } from 'lucide-react';

export function AppsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; app: App | null }>({
    open: false,
    app: null,
  });
  const [deleting, setDeleting] = useState(false);

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
    } catch (error) {
      console.error('Error loading apps:', error);
      toast.error('Failed to load apps', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.app) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'apps', deleteDialog.app.id));
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
        <Button variant="primary" onClick={() => toast.info('Create App', 'This feature will be implemented soon')}>
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
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => toast.info('Create App', 'This feature will be implemented soon')}
            >
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
                    onClick={() => toast.info('Edit App', 'This feature will be implemented soon')}
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
