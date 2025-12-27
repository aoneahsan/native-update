import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CodeIcon, RocketIcon } from '@radix-ui/react-icons';

export default function ExamplesPage() {
  const examples = [
    {
      title: 'React + Capacitor',
      description: 'Frontend example demonstrating OTA updates with React and Capacitor',
      path: '/example-apps/react-capacitor',
      icon: RocketIcon,
    },
    {
      title: 'Node.js + Express',
      description: 'Self-hosted backend with file-based bundle storage',
      path: '/example-apps/node-express',
      icon: CodeIcon,
    },
    {
      title: 'Firebase Backend',
      description: 'Serverless backend using Firebase Cloud Functions and Storage',
      path: '/example-apps/firebase-backend',
      icon: RocketIcon,
    },
  ];

  return (
    <div className="min-h-screen py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="mb-6 font-display text-5xl font-bold">Example Apps</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete working examples to help you get started with Native Update
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {examples.map((example) => (
            <Card key={example.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <example.icon className="h-6 w-6" />
                </div>
                <CardTitle>{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {example.description}
                </CardDescription>
                <p className="mt-4 text-sm text-gray-500 font-mono">
                  {example.path}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
