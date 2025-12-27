import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  EnvelopeClosedIcon,
  ChatBubbleIcon,
} from '@radix-ui/react-icons';
import { Phone, Globe, MapPin, Clock, MessageCircle, Bug, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 font-display text-5xl font-bold">Get in Touch</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Have questions, feedback, or need support? We&apos;re here to help. Choose the best way
            to reach us below.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Email */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <EnvelopeClosedIcon className="mx-auto h-12 w-12 text-brand-600" />
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                For general inquiries, support requests, or business matters.
              </p>
              <a
                href="mailto:aoneahsan@gmail.com"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                aoneahsan@gmail.com
              </a>
              <p className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Response within 24-48 hours
              </p>
            </CardContent>
          </Card>

          {/* GitHub */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <GitHubLogoIcon className="mx-auto h-12 w-12 text-gray-800" />
              <CardTitle>GitHub</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                Report bugs, request features, or contribute to the project.
              </p>
              <a
                href="https://github.com/aoneahsan/native-update"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                View Repository
              </a>
              <div className="mt-4 flex justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://github.com/aoneahsan/native-update/issues/new?template=bug_report.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Bug className="mr-1 h-4 w-4" />
                    Report Bug
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://github.com/aoneahsan/native-update/issues/new?template=feature_request.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" />
                    Request Feature
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle>WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                Quick questions or urgent support needs.
              </p>
              <a
                href="https://wa.me/923046619706"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                +92 304 661 9706
              </a>
              <p className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Available 9 AM - 6 PM PKT
              </p>
            </CardContent>
          </Card>

          {/* LinkedIn */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <LinkedInLogoIcon className="mx-auto h-12 w-12 text-blue-600" />
              <CardTitle>LinkedIn</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                Professional inquiries, partnerships, or just to connect.
              </p>
              <a
                href="https://linkedin.com/in/aoneahsan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                Connect on LinkedIn
              </a>
            </CardContent>
          </Card>

          {/* Website */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <Globe className="mx-auto h-12 w-12 text-purple-600" />
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                Learn more about me and my other projects.
              </p>
              <a
                href="https://aoneahsan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                aoneahsan.com
              </a>
            </CardContent>
          </Card>

          {/* Discussion */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <ChatBubbleIcon className="mx-auto h-12 w-12 text-orange-600" />
              <CardTitle>Community</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-gray-600">
                Join discussions, share tips, and connect with other users.
              </p>
              <a
                href="https://github.com/aoneahsan/native-update/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-brand-600 hover:underline"
              >
                GitHub Discussions
              </a>
            </CardContent>
          </Card>
        </motion.div>

        {/* Developer Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <h2 className="mb-6 text-2xl font-bold">Developer Contact</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                        <EnvelopeClosedIcon className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">
                          aoneahsan@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                        <Phone className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Phone / WhatsApp</p>
                        <a href="tel:+923046619706" className="text-brand-600 hover:underline">
                          +92 304 661 9706
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                        <Globe className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Portfolio</p>
                        <a
                          href="https://aoneahsan.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          aoneahsan.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                        <MapPin className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Address</p>
                        <a
                          href="https://zaions.com/address"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          View on Map
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-brand-600 to-accent-600 p-8 text-white md:p-12">
                  <h3 className="mb-4 text-2xl font-bold">Support Hours</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Monday - Friday: 9:00 AM - 6:00 PM PKT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Saturday: 10:00 AM - 2:00 PM PKT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Sunday: Closed (Email monitored)</span>
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg bg-white/10 p-4">
                    <p className="text-sm text-white/90">
                      <strong>PKT</strong> = Pakistan Standard Time (UTC+5)
                    </p>
                    <p className="mt-1 text-sm text-white/90">
                      Email responses typically within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mx-auto max-w-3xl space-y-4">
            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">How quickly can I expect a response?</h3>
              <p className="text-gray-600">
                We typically respond to emails within 24-48 hours during business days. For urgent
                matters, WhatsApp is the fastest way to reach us during support hours.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Where should I report bugs?</h3>
              <p className="text-gray-600">
                Please report bugs on our{' '}
                <a
                  href="https://github.com/aoneahsan/native-update/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  GitHub Issues page
                </a>
                . Include steps to reproduce, expected behavior, and your environment details.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Is there a community forum?</h3>
              <p className="text-gray-600">
                Yes! We use{' '}
                <a
                  href="https://github.com/aoneahsan/native-update/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  GitHub Discussions
                </a>{' '}
                for community conversations, feature discussions, and sharing tips.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Do you offer paid support or consulting?</h3>
              <p className="text-gray-600">
                Yes, we offer consulting services for custom implementations, integrations, and
                priority support. Contact us via email to discuss your needs.
              </p>
            </Card>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Card className="bg-gray-50 p-8">
            <h2 className="mb-4 text-2xl font-bold">Need More Help?</h2>
            <p className="mb-6 text-gray-600">
              Check out our documentation for guides, API references, and examples.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/docs">View Documentation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">About Native Update</Link>
              </Button>
            </div>
          </Card>
        </motion.section>
      </Container>
    </div>
  );
}
