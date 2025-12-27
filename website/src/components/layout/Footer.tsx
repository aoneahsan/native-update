import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { GitHubLogoIcon, LinkedInLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';

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
                href="https://github.com/aoneahsan/native-update"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-600 transition-colors"
              >
                <GitHubLogoIcon className="h-5 w-5" />
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
                <Link to="/examples" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  Examples
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
                <a
                  href="https://github.com/aoneahsan/native-update/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aoneahsan/native-update/blob/main/CHANGELOG.md"
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
                <a
                  href="https://aoneahsan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  Portfolio
                </a>
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
