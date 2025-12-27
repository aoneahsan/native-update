import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-gray-600">Last updated: December 27, 2025</p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Agreement to Terms</h2>
            <p className="text-gray-700">
              By accessing or using Native Update, you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Description of Service</h2>
            <p className="text-gray-700">
              Native Update provides a platform for managing over-the-air (OTA) updates and native
              app updates for Capacitor applications. The service includes:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Build management and distribution</li>
              <li>OTA update deployment</li>
              <li>App store update checking</li>
              <li>Integration with Google Drive for file storage</li>
              <li>Build analytics and tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="text-gray-700">
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Keep your account credentials secure</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Acceptable Use</h2>
            <p className="mb-4 text-gray-700">You agree not to:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Use the service to distribute spam or unwanted content</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Interfere with or disrupt the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Content Ownership</h2>
            <p className="text-gray-700">
              You retain all rights to the app builds and content you upload to Native Update. By
              uploading content, you grant us a license to store, process, and deliver your content
              as necessary to provide the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Service Availability</h2>
            <p className="text-gray-700">
              We strive to provide reliable service but do not guarantee uninterrupted access. We
              reserve the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Modify or discontinue the service at any time</li>
              <li>Perform maintenance and updates</li>
              <li>Suspend access for violations of these terms</li>
              <li>Implement usage limits and quotas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Payment and Fees</h2>
            <p className="text-gray-700">
              Currently, Native Update offers a free tier. If we introduce paid plans in the future:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Pricing will be clearly displayed</li>
              <li>You will be notified before being charged</li>
              <li>Refund policies will be communicated</li>
              <li>Subscription terms will be specified</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Data and Privacy</h2>
            <p className="text-gray-700">
              Your use of the service is also governed by our Privacy Policy. We collect and process
              data as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Third-Party Services</h2>
            <p className="text-gray-700">
              We integrate with third-party services including:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Firebase for authentication and data storage</li>
              <li>Google Drive for file storage (when connected)</li>
            </ul>
            <p className="mt-4 text-gray-700">
              Your use of these services is subject to their respective terms and policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, Native Update shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from your
              use or inability to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">11. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless Native Update from any claims, damages, or
              expenses arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">12. Termination</h2>
            <p className="text-gray-700">
              You may terminate your account at any time. We may terminate or suspend your access
              immediately, without prior notice, for violations of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">13. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. We will notify users of
              significant changes. Continued use of the service after changes constitutes acceptance
              of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">14. Governing Law</h2>
            <p className="text-gray-700">
              These terms shall be governed by and construed in accordance with the laws of Pakistan,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">15. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms of Service, please contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li>Name: Ahsan Mahmood</li>
              <li>Email: aoneahsan@gmail.com</li>
              <li>Phone/WhatsApp: +923046619706</li>
              <li>Website: aoneahsan.com</li>
              <li>LinkedIn: linkedin.com/in/aoneahsan</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
