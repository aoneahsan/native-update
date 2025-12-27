import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/features', label: 'Features' },
  { to: '/docs', label: 'Docs' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600">
                <span className="text-lg font-bold text-white">NU</span>
              </div>
              <span className="text-xl font-bold">Native Update</span>
            </Link>

            <nav className="hidden md:flex md:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.npmjs.com/package/native-update"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z" />
                </svg>
                NPM
              </Button>
            </a>

            {!loading && (
              <>
                {user ? (
                  <Link to="/dashboard">
                    <Button variant="primary" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="hidden sm:inline-flex">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button variant="primary" size="sm">
                        Sign Up Free
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <Cross1Icon className="h-5 w-5" />
              ) : (
                <HamburgerMenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {!loading && !user && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
