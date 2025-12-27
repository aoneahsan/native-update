import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { LinkedInLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600">
                <span className="text-lg font-bold text-white">NU</span>
              </div>
              <span className="text-xl font-bold">Native Update</span>
            </Link>
            <p className="text-sm text-gray-600">
              The complete update solution for Capacitor apps. OTA updates, native app updates, and in-app reviews - all in one.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.npmjs.com/package/native-update"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-600 transition-colors"
                title="NPM Package"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/aoneahsan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-600 transition-colors"
              >
                <LinkedInLogoIcon className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/aoneahsan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-600 transition-colors"
              >
                <TwitterLogoIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/docs" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/native-update?activeTab=versions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Data Security
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Data Deletion
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Native Update. Built with ❤️ by{' '}
            <a
              href="https://aoneahsan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Ahsan Mahmood
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
