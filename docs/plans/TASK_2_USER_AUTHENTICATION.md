# Task 2: User Authentication Plan

**Created:** 2025-12-27
**Status:** 📝 Planning
**Auth Provider:** Firebase Authentication

---

## 🎯 Objectives

Implement a complete authentication system with:
- Email/password signup and login
- Google OAuth integration
- Email verification
- Password reset flow
- Protected routes
- Auth state management

---

## 🔐 Authentication Methods

### Method 1: Email/Password
- Traditional signup with email + password
- Password requirements: min 8 chars, 1 uppercase, 1 number, 1 special
- Email verification required before full access
- Password reset via email link

### Method 2: Google OAuth
- One-click sign-in with Google account
- Auto-verified (no email verification needed)
- Profile picture and display name from Google
- Can connect Google Drive easily (same account)

---

## 🏗️ Architecture

### Firebase Authentication Setup

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use emulator in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### Auth Service

```typescript
// src/services/auth-service.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const authService = {
  // Signup with email/password
  async signup(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Send verification email
    await sendEmailVerification(user);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      provider: 'email',
      emailVerified: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      driveConnected: false,
      driveEmail: null,
      driveConnectedAt: null,
      plan: 'free',
      planStartDate: null,
      planEndDate: null,
      appsCount: 0,
      buildsCount: 0,
      storageUsed: 0,
      preferences: {
        emailNotifications: true,
        updateNotifications: true,
        theme: 'auto',
        language: 'en'
      },
      updatedAt: serverTimestamp()
    });

    return user;
  },

  // Login with email/password
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return user;
  },

  // Login with Google
  async loginWithGoogle() {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if user doc exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // First time login - create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google.com',
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        driveConnected: false,
        driveEmail: null,
        driveConnectedAt: null,
        plan: 'free',
        planStartDate: null,
        planEndDate: null,
        appsCount: 0,
        buildsCount: 0,
        storageUsed: 0,
        preferences: {
          emailNotifications: true,
          updateNotifications: true,
          theme: 'auto',
          language: 'en'
        },
        updatedAt: serverTimestamp()
      });
    } else {
      // Existing user - update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return user;
  },

  // Logout
  async logout() {
    await signOut(auth);
  },

  // Send verification email
  async sendVerificationEmail(user: User) {
    await sendEmailVerification(user);
  },

  // Send password reset email
  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  // Check if email is verified
  isEmailVerified(user: User | null): boolean {
    return user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';
  }
};
```

### Auth Context

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  emailVerified: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const emailVerified = user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 🎨 UI Pages

### Page 1: Login Page

**Route:** `/login`
**File:** `src/pages/auth/LoginPage.tsx`

**Features:**
- Email + password form
- Google sign-in button
- "Forgot password?" link
- "Don't have an account? Sign up" link
- Form validation
- Loading states
- Error messages

**UI Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│    [Logo] Native Update             │
│                                     │
│    Welcome Back                     │
│    Login to your account            │
│                                     │
│    ┌───────────────────────────┐   │
│    │ Email                     │   │
│    └───────────────────────────┘   │
│                                     │
│    ┌───────────────────────────┐   │
│    │ Password                  │   │
│    └───────────────────────────┘   │
│                                     │
│    [Forgot password?]               │
│                                     │
│    ┌───────────────────────────┐   │
│    │      Login                │   │
│    └───────────────────────────┘   │
│                                     │
│    ──────── OR ────────             │
│                                     │
│    ┌───────────────────────────┐   │
│    │  🔵  Sign in with Google  │   │
│    └───────────────────────────┘   │
│                                     │
│    Don't have an account? [Sign up]│
│                                     │
└─────────────────────────────────────┘
```

**Component Code:**
```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/auth-service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container size="sm">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Login
              </Button>
            </form>

            <div className="my-4 text-center text-gray-500">OR</div>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              loading={loading}
              className="w-full"
            >
              🔵 Sign in with Google
            </Button>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
```

### Page 2: Signup Page

**Route:** `/signup`
**File:** `src/pages/auth/SignupPage.tsx`

**Features:**
- Name, email, password, confirm password fields
- Google sign-up button
- Password strength indicator
- Terms & privacy policy checkbox
- "Already have an account? Login" link
- Email verification notice after signup

**Similar structure to login page with additional fields**

### Page 3: Email Verification Page

**Route:** `/verify-email`
**File:** `src/pages/auth/VerifyEmailPage.tsx`

**Features:**
- Message: "Please verify your email"
- Email sent confirmation
- "Resend verification email" button
- "Refresh" button to check if verified
- Auto-redirect to dashboard when verified

### Page 4: Forgot Password Page

**Route:** `/forgot-password`
**File:** `src/pages/auth/ForgotPasswordPage.tsx`

**Features:**
- Email input field
- "Send reset link" button
- Success message
- Back to login link

---

## 🔒 Protected Routes

### ProtectedRoute Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export function ProtectedRoute({
  children,
  requireEmailVerification = true
}: ProtectedRouteProps) {
  const { user, loading, emailVerified } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireEmailVerification && !emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}
```

### Router Configuration

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Public pages
import HomePage from '@/pages/HomePage';
import FeaturesPage from '@/pages/FeaturesPage';
// ... other public pages

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Dashboard pages
import DashboardLayout from '@/pages/dashboard/DashboardLayout';
import OverviewPage from '@/pages/dashboard/OverviewPage';
// ... other dashboard pages

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <HomePage /> },
  { path: '/features', element: <FeaturesPage /> },
  // ...

  // Auth routes
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // Protected routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      // ... other dashboard routes
    ]
  }
]);
```

---

## ✅ Implementation Checklist

### Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Email/Password auth provider
- [ ] Enable Google auth provider
- [ ] Configure authorized domains
- [ ] Setup email templates (verification, password reset)
- [ ] Add Firebase config to .env

### Code Implementation
- [ ] Create auth service (`src/services/auth-service.ts`)
- [ ] Create auth context (`src/context/AuthContext.tsx`)
- [ ] Create ProtectedRoute component
- [ ] Build LoginPage
- [ ] Build SignupPage
- [ ] Build VerifyEmailPage
- [ ] Build ForgotPasswordPage
- [ ] Update router with protected routes
- [ ] Add auth error handling
- [ ] Add loading states

### Testing
- [ ] Test email/password signup
- [ ] Test email verification flow
- [ ] Test email/password login
- [ ] Test Google OAuth signup
- [ ] Test Google OAuth login
- [ ] Test forgot password flow
- [ ] Test protected route redirection
- [ ] Test logout functionality
- [ ] Test error scenarios

### Documentation
- [ ] Document auth flow in README
- [ ] Add troubleshooting guide
- [ ] Document Firebase setup steps

---

**Plan Status:** ✅ Complete and ready for implementation
**Dependencies:** Firebase project, Firestore database
**Estimated Time:** 8-12 hours
