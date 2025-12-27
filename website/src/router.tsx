import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Marketing Pages
import HomePage from '@/pages/HomePage';
import FeaturesPage from '@/pages/FeaturesPage';
import PricingPage from '@/pages/PricingPage';
import DocsPage from '@/pages/DocsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';

// Dashboard Pages
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardOverview from '@/pages/dashboard/DashboardOverview';
import AppsPage from '@/pages/dashboard/AppsPage';
import BuildsPage from '@/pages/dashboard/BuildsPage';
import UploadPage from '@/pages/dashboard/UploadPage';
import GoogleDrivePage from '@/pages/dashboard/GoogleDrivePage';
import ConfigPage from '@/pages/dashboard/ConfigPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';

export const router = createBrowserRouter([
  // Marketing Pages with Header/Footer
  {
    element: <MarketingLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/features',
        element: <FeaturesPage />,
      },
      {
        path: '/pricing',
        element: <PricingPage />,
      },
      {
        path: '/docs',
        element: <DocsPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/contact',
        element: <ContactPage />,
      },
      {
        path: '/privacy',
        element: <PrivacyPage />,
      },
      {
        path: '/terms',
        element: <TermsPage />,
      },
    ],
  },

  // Auth Pages (no header/footer)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Dashboard (Protected Routes)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardOverview />,
      },
      {
        path: 'apps',
        element: <AppsPage />,
      },
      {
        path: 'builds',
        element: <BuildsPage />,
      },
      {
        path: 'upload',
        element: <UploadPage />,
      },
      {
        path: 'drive',
        element: <GoogleDrivePage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
