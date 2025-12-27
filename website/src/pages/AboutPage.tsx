import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GitHubLogoIcon, LinkedInLogoIcon, GlobeIcon } from '@radix-ui/react-icons';
import { ArrowRight, Zap, Shield, Users, Code, Heart, Target, Package } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16">
      <Container>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-6 font-display text-5xl font-bold md:text-6xl">
            About <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">Native Update</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            The complete update solution for Capacitor applications. Deploy OTA updates instantly,
            manage app store updates seamlessly, and collect in-app reviews—all in one powerful,
            free, and open-source plugin.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-brand-600 to-accent-600 p-8 text-white md:p-12">
                  <Target className="mb-4 h-12 w-12" />
                  <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
                  <p className="text-lg text-white/90">
                    To empower mobile developers with a complete, free, and open-source update
                    solution that eliminates the complexity of managing app updates across platforms.
                  </p>
                </div>
                <div className="p-8 md:p-12">
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">Why We Built This</h3>
                  <p className="mb-4 text-gray-700">
                    As Capacitor developers ourselves, we experienced the pain of managing updates
                    across iOS and Android. Existing solutions were either expensive, complex, or
                    incomplete. We wanted something better.
                  </p>
                  <p className="text-gray-700">
                    Native Update was born from the belief that every developer deserves access to
                    powerful update tools—regardless of budget or team size.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="mb-8 text-center text-3xl font-bold">What Sets Us Apart</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <Zap className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Instant OTA Updates</h3>
              <p className="text-gray-600">
                Deploy JavaScript, HTML, and CSS changes immediately without waiting for app store
                approval. Fix bugs in minutes, not days.
              </p>
            </Card>

            <Card className="p-6">
              <Shield className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Security First</h3>
              <p className="text-gray-600">
                Cryptographic bundle signing, signature verification, and HTTPS-only delivery.
                Your updates are protected end-to-end.
              </p>
            </Card>

            <Card className="p-6">
              <Code className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Open Source</h3>
              <p className="text-gray-600">
                Fully open-source under MIT license. Audit the code, contribute improvements,
                or self-host if you prefer complete control.
              </p>
            </Card>

            <Card className="p-6">
              <Users className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Developer-Friendly</h3>
              <p className="text-gray-600">
                Simple API, comprehensive documentation, and TypeScript support. Integrate in
                minutes, not hours.
              </p>
            </Card>

            <Card className="p-6">
              <Heart className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Free Forever</h3>
              <p className="text-gray-600">
                No hidden fees, no usage limits on the core plugin. The free dashboard provides
                everything you need to manage updates.
              </p>
            </Card>

            <Card className="p-6">
              <GlobeIcon className="mb-4 h-10 w-10 text-brand-600" />
              <h3 className="mb-2 text-xl font-semibold">Your Data, Your Control</h3>
              <p className="text-gray-600">
                Store builds in YOUR Google Drive. We never touch your files—you maintain complete
                ownership and control.
              </p>
            </Card>
          </div>
        </motion.section>

        {/* Built By Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="mb-8 text-center text-3xl font-bold">Built By</h2>
          <Card className="mx-auto max-w-2xl p-8 text-center">
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-3xl font-bold text-white">
              AM
            </div>
            <h3 className="mb-2 text-2xl font-bold">Ahsan Mahmood</h3>
            <p className="mb-4 text-gray-600">Full-Stack Developer & Creator</p>
            <p className="mb-6 text-gray-700">
              A passionate developer with over 8 years of experience building mobile and web
              applications. I believe in creating tools that make developers&apos; lives easier and
              sharing them with the community.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://github.com/aoneahsan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                <GitHubLogoIcon className="h-5 w-5" />
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/aoneahsan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                <LinkedInLogoIcon className="h-5 w-5" />
                LinkedIn
              </a>
              <a
                href="https://aoneahsan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                <GlobeIcon className="h-5 w-5" />
                Portfolio
              </a>
            </div>
          </Card>
        </motion.section>

        {/* Open Source Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-gray-900 p-8 text-white md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <Package className="mx-auto mb-6 h-16 w-16" />
              <h2 className="mb-4 text-3xl font-bold">100% Open Source</h2>
              <p className="mb-8 text-lg text-gray-300">
                Native Update is released under the MIT License. Fork it, modify it, contribute
                to it, or just use it—no strings attached. We believe great tools should be
                accessible to everyone.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild variant="default" size="lg">
                  <a
                    href="https://www.npmjs.com/package/native-update"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z" />
                    </svg>
                    View on NPM
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
                  <Link to="/docs">
                    Read Documentation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-gray-600">
            Join developers who trust Native Update for their app update needs.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.section>
      </Container>
    </div>
  );
}
