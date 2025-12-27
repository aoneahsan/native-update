import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { GitHubLogoIcon } from '@radix-ui/react-icons';

export function Header() {
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
              <Link to="/features" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                Features
              </Link>
              <Link to="/docs" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                Docs
              </Link>
              <Link to="/examples" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                Examples
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aoneahsan/native-update"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm">
                <GitHubLogoIcon className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
