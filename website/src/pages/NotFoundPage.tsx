import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center">
      <Container className="text-center">
        <h1 className="text-9xl font-bold text-brand-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold">Page Not Found</h2>
        <p className="mt-4 text-lg text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button size="lg" variant="primary">
              Go Back Home
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
