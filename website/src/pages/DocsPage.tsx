import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DocsPage() {
  return (
    <div className="min-h-screen py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-6 font-display text-5xl font-bold text-center">Documentation</h1>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Complete documentation for Native Update plugin
          </p>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg">
                <h3>Installation</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>npm install native-update</code>
                </pre>

                <h3>Basic Usage</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{`import { NativeUpdate } from 'native-update';

await NativeUpdate.configure({
  serverUrl: 'https://your-api.com',
  autoCheck: true,
  channel: 'production'
});`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <p>
                  Full API documentation is available on the{' '}
                  <a
                    href="https://www.npmjs.com/package/native-update"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    NPM package page
                  </a>
                  . For questions, please{' '}
                  <a
                    href="mailto:aoneahsan@gmail.com"
                    className="text-brand-600 hover:underline"
                  >
                    contact us
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Apps</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <p>
                  Check out our complete example applications in the{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">example-apps/</code> directory.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
