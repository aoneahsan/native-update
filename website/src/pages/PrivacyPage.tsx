import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-brand-600"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-gray-600">Last updated: December 27, 2025</p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to Native Update. We respect your privacy and are committed to protecting your
              personal data. This privacy policy will inform you about how we handle your personal
              data when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Data We Collect</h2>
            <p className="mb-4 text-gray-700">We collect the following types of information:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Account Information:</strong> Email address, display name, and profile photo
                (if provided)
              </li>
              <li>
                <strong>Authentication Data:</strong> Login credentials and authentication tokens
              </li>
              <li>
                <strong>App Data:</strong> Information about your apps, builds, and configurations
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our service, including upload
                history and settings
              </li>
              <li>
                <strong>Google Drive Data:</strong> If you connect Google Drive, we store access
                tokens to manage your files
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Data</h2>
            <p className="mb-4 text-gray-700">We use your data to:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Provide and maintain our service</li>
              <li>Manage your account and authenticate your access</li>
              <li>Store and deliver your app builds</li>
              <li>Send you service-related notifications</li>
              <li>Improve our service and develop new features</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Data Storage and Security</h2>
            <p className="text-gray-700">
              Your data is stored securely using industry-standard encryption. We use Firebase for
              authentication and data storage, and Google Drive (when connected) for file storage.
              All data transmission is encrypted using HTTPS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Data Sharing</h2>
            <p className="text-gray-700">
              We do not sell your personal data. We only share your data with:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Service Providers:</strong> Firebase (Google) for hosting and
                authentication
              </li>
              <li>
                <strong>Google Drive:</strong> When you choose to connect your Google Drive account
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Your Rights</h2>
            <p className="mb-4 text-gray-700">You have the right to:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Disconnect third-party services like Google Drive</li>
              <li>Delete your account at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use essential cookies for authentication and session management. We do not use
              third-party tracking cookies or analytics tools.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for children under 13. We do not knowingly collect data
              from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this privacy policy, please contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li>Email: aoneahsan@gmail.com</li>
              <li>Phone/WhatsApp: +923046619706</li>
              <li>Website: aoneahsan.com</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
