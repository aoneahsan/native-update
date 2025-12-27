import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { User } from '@/types';
import {
  User as UserIcon,
  Bell,
  Palette,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Key,
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    updateNotifications: true,
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'en',
  });

  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  async function loadUserData() {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data() as User;
        setUserData(data);
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load settings', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreferences() {
    if (!user || !userData) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferences,
        updatedAt: serverTimestamp(),
      });

      setUserData({ ...userData, preferences });
      toast.success('Settings saved', 'Your preferences have been updated');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings', 'Please try again later');
    } finally {
      setSaving(false);
    }
  }

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword() {
    if (!user || !validatePasswordForm()) return;

    setChangingPassword(true);
    try {
      if (!user.email) {
        throw new Error('No email associated with account');
      }

      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, passwordForm.newPassword);

      toast.success('Password changed', 'Your password has been updated successfully');
      setPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      if (error instanceof Error) {
        if (error.message.includes('wrong-password')) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          toast.error('Failed to change password', error.message);
        }
      } else {
        toast.error('Failed to change password', 'Please try again later');
      }
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirmation !== 'DELETE') return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);

      toast.success('Account deleted', 'Your account has been permanently deleted');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(
        'Failed to delete account',
        'You may need to re-login before deleting your account'
      );
    } finally {
      setDeleting(false);
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

  const isEmailProvider = user?.providerData[0]?.providerId === 'password';

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2">
                  <UserIcon className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Display Name</label>
                  <p className="mt-1 text-base text-gray-900">{user?.displayName || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-base text-gray-900">{user?.email}</p>
                    {user?.emailVerified && (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Provider</label>
                  <p className="mt-1 text-base capitalize text-gray-900">
                    {user?.providerData[0]?.providerId.replace('.com', '') || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDateTime(userData?.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={preferences.emailNotifications}
                    onChange={(e) =>
                      setPreferences({ ...preferences, emailNotifications: e.target.checked })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div>
                  <p className="font-medium text-gray-900">Update Notifications</p>
                  <p className="text-sm text-gray-600">Get notified about new builds</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={preferences.updateNotifications}
                    onChange={(e) =>
                      setPreferences({ ...preferences, updateNotifications: e.target.checked })
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300"></div>
                </label>
              </div>

              <Button variant="primary" onClick={handleSavePreferences} isLoading={saving}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize your interface</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Theme"
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto (System)' },
                ]}
                value={preferences.theme}
                onChange={(e) =>
                  setPreferences({ ...preferences, theme: e.target.value as typeof preferences.theme })
                }
              />

              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                ]}
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              />

              <Button variant="primary" onClick={handleSavePreferences} isLoading={saving}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {isEmailProvider && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Key className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setPasswordDialog(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="danger" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account is permanent and cannot be undone. All your apps, builds,
                  and data will be permanently deleted.
                </AlertDescription>
              </Alert>
              <Button variant="danger" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Apps</span>
                <span className="font-semibold text-gray-900">{userData?.appsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Builds</span>
                <span className="font-semibold text-gray-900">{userData?.buildsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan</span>
                <Badge variant="primary" className="uppercase">
                  {userData?.plan || 'free'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Cloud className={userData?.driveConnected ? 'h-5 w-5 text-green-600' : 'h-5 w-5 text-gray-400'} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Google Drive</p>
                  <p className="text-xs text-gray-600">
                    {userData?.driveConnected ? userData.driveEmail : 'Not connected'}
                  </p>
                </div>
                {userData?.driveConnected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="default">Disconnected</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              label="Current Password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              error={passwordErrors.currentPassword}
            />
            <Input
              type="password"
              label="New Password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              error={passwordErrors.newPassword}
            />
            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              error={passwordErrors.confirmPassword}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePassword} isLoading={changingPassword}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all
              your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="danger">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Type <strong>DELETE</strong> to confirm account deletion
              </AlertDescription>
            </Alert>
            <Input
              className="mt-4"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={deleting}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default SettingsPage;
