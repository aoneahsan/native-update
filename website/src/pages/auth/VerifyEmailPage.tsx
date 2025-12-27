import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendEmailVerification, reload } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { authService } from '@/services/auth-service';
import { toast } from '@/lib/toast';
import { Mail, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, emailVerified } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResendEmail = async () => {
    if (!user) return;

    setSending(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent', 'Please check your inbox');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error('Failed to send email', 'Please try again later');
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    setChecking(true);
    try {
      await reload(user);

      if (user.emailVerified) {
        toast.success('Email verified', 'Your email has been verified successfully');
        navigate('/dashboard');
      } else {
        toast.error('Email not verified yet', 'Please check your inbox and click the verification link');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast.error('Failed to check verification', 'Please try again later');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (emailVerified) {
    navigate('/dashboard');
    return null;
  }

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <Mail className="h-8 w-8 text-brand-600" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification email to <strong>{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              Click the link in the email to verify your account. If you don't see the email, check
              your spam folder.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCheckVerification}
              isLoading={checking}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I've Verified My Email
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              isLoading={sending}
            >
              <Mail className="mr-2 h-4 w-4" />
              Resend Verification Email
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Wrong email address?{' '}
              <Link to="/signup" className="font-medium text-brand-600 hover:underline">
                Sign up again
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
