import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import type { User, Build } from '@/types';
import {
  Package,
  Upload,
  HardDrive,
  Activity,
  Plus,
  Cloud,
  ArrowUpRight,
} from 'lucide-react';

export function DashboardOverview() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [recentBuilds, setRecentBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        // Direct document access - more efficient and works with security rules
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data() as User);
        }

        const buildsRef = collection(db, 'builds');
        const buildsQuery = query(
          buildsRef,
          where('userId', '==', user.uid),
          orderBy('uploadedAt', 'desc'),
          limit(5)
        );
        const buildsSnapshot = await getDocs(buildsQuery);
        const builds = buildsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Build[];

        setRecentBuilds(builds);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const stats = [
    {
      title: 'Total Apps',
      value: userData?.appsCount || 0,
      icon: Package,
      color: 'text-brand-600',
      bgColor: 'bg-brand-100',
    },
    {
      title: 'Total Builds',
      value: userData?.buildsCount || 0,
      icon: Upload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Storage Used',
      value: formatBytes(userData?.storageUsed || 0),
      icon: HardDrive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Channel',
      value: 'Production',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const getStatusBadge = (status: string) => {
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
  };

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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your apps today
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg" onClick={() => window.location.href = '/dashboard/upload'}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-brand-100 p-3">
              <Upload className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Upload Build</h3>
              <p className="text-sm text-gray-600">Deploy a new version</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => window.location.href = '/dashboard/apps'}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Create App</h3>
              <p className="text-sm text-gray-600">Add a new application</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => window.location.href = '/dashboard/google-drive'}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3">
              <Cloud className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Connect Drive</h3>
              <p className="text-sm text-gray-600">Link Google Drive</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Builds</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/dashboard/builds'}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentBuilds.length === 0 ? (
            <div className="py-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No builds yet</h3>
              <p className="mt-2 text-gray-600">
                Get started by uploading your first build
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => window.location.href = '/dashboard/upload'}
              >
                Upload Build
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBuilds.map((build) => (
                  <TableRow key={build.id}>
                    <TableCell className="font-medium">{build.version}</TableCell>
                    <TableCell className="capitalize">{build.channel}</TableCell>
                    <TableCell className="uppercase">{build.platform}</TableCell>
                    <TableCell>{getStatusBadge(build.status)}</TableCell>
                    <TableCell>{formatBytes(build.fileSize)}</TableCell>
                    <TableCell>{formatRelativeTime(build.uploadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default DashboardOverview;
