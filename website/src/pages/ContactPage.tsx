import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GitHubLogoIcon, LinkedInLogoIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';

export default function ContactPage() {
  return (
    <div className="min-h-screen py-24">
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="mb-6 font-display text-5xl font-bold">Get in Touch</h1>
          <p className="mb-12 text-xl text-gray-600">
            Have questions or feedback? Reach out through any of these channels.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <GitHubLogoIcon className="mx-auto h-12 w-12 text-gray-700" />
                <CardTitle>GitHub</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Report issues, request features, or contribute to the project
                </p>
                <a
                  href="https://github.com/aoneahsan/native-update"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  View Repository
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <EnvelopeClosedIcon className="mx-auto h-12 w-12 text-gray-700" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Send me an email for support or collaboration
                </p>
                <a
                  href="mailto:aoneahsan@gmail.com"
                  className="text-brand-600 hover:underline"
                >
                  aoneahsan@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <LinkedInLogoIcon className="mx-auto h-12 w-12 text-gray-700" />
                <CardTitle>LinkedIn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Connect with me on LinkedIn for professional inquiries
                </p>
                <a
                  href="https://linkedin.com/in/aoneahsan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  Connect
                </a>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
