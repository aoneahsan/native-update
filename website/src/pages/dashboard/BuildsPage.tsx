import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, limit as fbLimit, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { formatBytes, formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Build, App } from '@/types';
import { Download, Trash2, Upload, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export function BuildsPage() {
  const { user } = useAuth();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; build: Build | null }>({
    open: false,
    build: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    appId: '',
    channel: '',
    platform: '',
    status: '',
    search: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    lastDoc: null as QueryDocumentSnapshot | null,
  });

  useEffect(() => {
    loadApps();
  }, [user]);

  useEffect(() => {
    loadBuilds();
  }, [user, filters, pagination.page]);

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
    }
  }

  async function loadBuilds() {
    if (!user) return;

    setLoading(true);
    try {
      const buildsRef = collection(db, 'builds');
      let buildsQuery = query(
        buildsRef,
        where('userId', '==', user.uid),
        orderBy('uploadedAt', 'desc'),
        fbLimit(PAGE_SIZE + 1)
      );

      if (filters.appId) {
        buildsQuery = query(buildsQuery, where('appId', '==', filters.appId));
      }
      if (filters.channel) {
        buildsQuery = query(buildsQuery, where('channel', '==', filters.channel));
      }
      if (filters.platform) {
        buildsQuery = query(buildsQuery, where('platform', '==', filters.platform));
      }
      if (filters.status) {
        buildsQuery = query(buildsQuery, where('status', '==', filters.status));
      }

      if (pagination.page > 1 && pagination.lastDoc) {
        buildsQuery = query(buildsQuery, startAfter(pagination.lastDoc));
      }

      const buildsSnapshot = await getDocs(buildsQuery);
      const buildsData = buildsSnapshot.docs.slice(0, PAGE_SIZE).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Build[];

      const hasMore = buildsSnapshot.docs.length > PAGE_SIZE;
      const lastDoc = buildsSnapshot.docs[PAGE_SIZE - 1] || null;

      setBuilds(buildsData);
      setPagination((prev) => ({ ...prev, hasMore, lastDoc }));
    } catch (error) {
      console.error('Error loading builds:', error);
      toast.error('Failed to load builds', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.build) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'builds', deleteDialog.build.id));
      setBuilds(builds.filter((build) => build.id !== deleteDialog.build!.id));
      toast.success('Build deleted', 'The build has been successfully deleted');
      setDeleteDialog({ open: false, build: null });
    } catch (error) {
      console.error('Error deleting build:', error);
      toast.error('Failed to delete build', 'Please try again later');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(build: Build) {
    try {
      window.open(build.driveFileUrl, '_blank');
      toast.success('Download started', 'Opening file in Google Drive');
    } catch (error) {
      console.error('Error downloading build:', error);
      toast.error('Failed to download build', 'Please try again later');
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
      case 'uploading':
        return <Badge variant="info">Uploading</Badge>;
      case 'archived':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  function getAppName(appId: string) {
    const app = apps.find((a) => a.id === appId);
    return app?.name || 'Unknown';
  }

  const filteredBuilds = builds.filter((build) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        build.version.toLowerCase().includes(searchLower) ||
        getAppName(build.appId).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Builds</h1>
        <p className="mt-2 text-gray-600">View and manage all your builds</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by version or app..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              options={[
                { value: '', label: 'All Apps' },
                ...apps.map((app) => ({ value: app.id, label: app.name })),
              ]}
              value={filters.appId}
              onChange={(e) => setFilters({ ...filters, appId: e.target.value })}
            />

            <Select
              options={[
                { value: '', label: 'All Channels' },
                { value: 'production', label: 'Production' },
                { value: 'staging', label: 'Staging' },
                { value: 'development', label: 'Development' },
              ]}
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
            />

            <Select
              options={[
                { value: '', label: 'All Platforms' },
                { value: 'ios', label: 'iOS' },
                { value: 'android', label: 'Android' },
                { value: 'web', label: 'Web' },
              ]}
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
            />

            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'processing', label: 'Processing' },
                { value: 'uploading', label: 'Uploading' },
                { value: 'failed', label: 'Failed' },
                { value: 'archived', label: 'Archived' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
          ) : filteredBuilds.length === 0 ? (
            <div className="py-16 text-center">
              <Upload className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No builds found</h3>
              <p className="mt-2 text-gray-600">Try adjusting your filters or upload a new build</p>
              <Button
                variant="primary"
                className="mt-6"
                onClick={() => window.location.href = '/dashboard/upload'}
              >
                Upload Build
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuilds.map((build) => (
                    <TableRow key={build.id}>
                      <TableCell className="font-medium">{build.version}</TableCell>
                      <TableCell>{getAppName(build.appId)}</TableCell>
                      <TableCell className="capitalize">{build.channel}</TableCell>
                      <TableCell className="uppercase">{build.platform}</TableCell>
                      <TableCell>{getStatusBadge(build.status)}</TableCell>
                      <TableCell>{formatBytes(build.fileSize)}</TableCell>
                      <TableCell>{formatDateTime(build.uploadedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(build)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, build })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {(pagination.page > 1 || pagination.hasMore) && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={!pagination.hasMore}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, build: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Build</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete build version {deleteDialog.build?.version}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, build: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Delete Build
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default BuildsPage;
