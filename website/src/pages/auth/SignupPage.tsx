import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Shield, Zap, Check, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-up was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups for this site.');
      } else {
        setError(error.message || 'Failed to sign up with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Instant OTA updates for your apps',
    'Manage native app store updates',
    'Collect in-app reviews',
    'Free dashboard with no limits',
    'Store builds in your Google Drive',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/"
            className="mb-8 inline-flex items-center text-sm text-gray-600 hover:text-brand-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600">
              <span className="text-2xl font-bold text-white">NU</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Get Started Free</h1>
            <p className="text-gray-600">Create your account in seconds</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Sign up with your Google account to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full h-12 text-base"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </Button>

              <div className="mt-8 space-y-3">
                <p className="text-sm font-medium text-gray-900">What you get:</p>
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Secure authentication via Google</span>
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>No password to remember</span>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-600 hover:underline font-medium">
                  Sign in
                </Link>
              </div>

              <div className="mt-4 text-center text-xs text-gray-500">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="text-brand-600 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
