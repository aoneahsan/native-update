import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircledIcon, GitHubLogoIcon } from '@radix-ui/react-icons';

export default function PricingPage() {
  return (
    <div className="min-h-screen py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="mb-6 font-display text-6xl font-bold">
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              Free & Open Source
            </span>
          </h1>
          <p className="mb-12 text-xl text-gray-600">
            Native Update is completely free to use with no hidden costs or limitations.
          </p>

          <Card className="text-left">
            <CardHeader>
              <CardTitle className="text-3xl">Community Edition</CardTitle>
              <p className="text-4xl font-bold text-brand-600">$0</p>
              <p className="text-gray-600">Forever free</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>Unlimited OTA updates</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>Native app update checking</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>In-app review prompts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>Full TypeScript support</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>Complete documentation</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>Community support</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircledIcon className="mt-1 h-5 w-5 text-green-600" />
                <span>MIT License</span>
              </div>

              <div className="pt-6">
                <Link to="/docs">
                  <Button size="lg" variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
                <a
                  href="https://github.com/aoneahsan/native-update"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block"
                >
                  <Button size="lg" variant="outline" className="w-full">
                    <GitHubLogoIcon className="mr-2 h-5 w-5" />
                    View on GitHub
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
