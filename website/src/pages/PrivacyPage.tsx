import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'December 27, 2025';
  const effectiveDate = 'December 27, 2025';

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
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
          <p className="text-gray-600">Effective date: {effectiveDate}</p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to Native Update (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your
              personal data and respecting your privacy rights. This Privacy Policy explains how we collect,
              use, store, and protect your information when you use our service at native-update.web.app and
              related mobile applications.
            </p>
            <p className="mt-4 text-gray-700">
              This policy complies with the General Data Protection Regulation (GDPR), California Consumer
              Privacy Act (CCPA), and other applicable data protection laws.
            </p>
          </section>

          {/* Data Controller */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Data Controller</h2>
            <p className="text-gray-700">The data controller responsible for your personal data is:</p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li><strong>Name:</strong> Ahsan Mahmood</li>
              <li><strong>Email:</strong> aoneahsan@gmail.com</li>
              <li><strong>Phone/WhatsApp:</strong> +923046619706</li>
              <li><strong>Website:</strong> <a href="https://aoneahsan.com" className="text-brand-600 hover:underline">aoneahsan.com</a></li>
              <li><strong>Address:</strong> <a href="https://zaions.com/address" className="text-brand-600 hover:underline">View Address</a></li>
            </ul>
          </section>

          {/* Data We Collect */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. Data We Collect</h2>
            <p className="mb-4 text-gray-700">We collect and process the following categories of personal data:</p>

            <h3 className="mb-2 text-xl font-medium">3.1 Account Information</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Email address (required for account creation)</li>
              <li>Display name (optional)</li>
              <li>Profile photo (if using Google Sign-In)</li>
              <li>Account creation date</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-medium">3.2 Authentication Data</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Encrypted passwords (for email/password authentication)</li>
              <li>Authentication tokens</li>
              <li>Session identifiers</li>
              <li>Login timestamps and IP addresses</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-medium">3.3 App and Build Data</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>App names and bundle identifiers</li>
              <li>Build versions and metadata</li>
              <li>Configuration settings</li>
              <li>Upload timestamps</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-medium">3.4 Google Drive Data (When Connected)</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>OAuth access and refresh tokens</li>
              <li>File metadata for uploaded builds</li>
              <li>Folder structure for Native Update files only</li>
            </ul>
            <p className="mt-2 text-gray-700">
              We do NOT access, read, or process any other files in your Google Drive. We only manage
              files within the Native Update folder that you create.
            </p>

            <h3 className="mb-2 mt-4 text-xl font-medium">3.5 Usage Data</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Pages visited and features used</li>
              <li>Upload and download activity</li>
              <li>Error logs (anonymized)</li>
            </ul>
          </section>

          {/* Legal Basis for Processing (GDPR) */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Legal Basis for Processing (GDPR)</h2>
            <p className="mb-4 text-gray-700">We process your personal data under the following legal bases:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Contract Performance (Article 6(1)(b)):</strong> Processing necessary to provide
                our service, including account management, build storage, and OTA update delivery.
              </li>
              <li>
                <strong>Legitimate Interests (Article 6(1)(f)):</strong> Processing for security, fraud
                prevention, and service improvement.
              </li>
              <li>
                <strong>Consent (Article 6(1)(a)):</strong> When you explicitly consent to specific
                processing, such as connecting your Google Drive or receiving marketing communications.
              </li>
              <li>
                <strong>Legal Obligation (Article 6(1)(c)):</strong> When required by law, such as
                responding to legal requests.
              </li>
            </ul>
          </section>

          {/* How We Use Your Data */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. How We Use Your Data</h2>
            <p className="mb-4 text-gray-700">We use your personal data to:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Create and manage your account</li>
              <li>Authenticate your access to the service</li>
              <li>Store, manage, and deliver your app builds</li>
              <li>Process OTA updates for your applications</li>
              <li>Send essential service notifications (password resets, security alerts)</li>
              <li>Improve our service and develop new features</li>
              <li>Prevent fraud and ensure service security</li>
              <li>Comply with legal obligations</li>
              <li>Respond to your support requests</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Data Retention</h2>
            <p className="mb-4 text-gray-700">We retain your data according to the following policies:</p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Account Data:</strong> Retained while your account is active. Deleted within
                30 days of account deletion request.
              </li>
              <li>
                <strong>Build Files:</strong> Stored in your connected Google Drive. We do not retain
                copies after you delete them or disconnect your Drive.
              </li>
              <li>
                <strong>Authentication Tokens:</strong> Automatically expired and deleted after logout
                or session timeout.
              </li>
              <li>
                <strong>Usage Logs:</strong> Anonymized after 90 days, fully deleted after 1 year.
              </li>
              <li>
                <strong>Backup Data:</strong> Removed from backups within 30 days of primary deletion.
              </li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Data Storage and Security</h2>
            <p className="text-gray-700">
              Your data is stored securely using industry-standard measures:
            </p>
            <ul className="ml-6 mt-4 list-disc space-y-2 text-gray-700">
              <li>Data encrypted at rest using AES-256 encryption</li>
              <li>Data encrypted in transit using TLS 1.3</li>
              <li>Authentication via Firebase Auth with secure token handling</li>
              <li>Database hosted on Google Cloud Platform (Firebase Firestore)</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and audit logging for administrative access</li>
            </ul>
            <p className="mt-4 text-gray-700">
              For detailed security information, please see our{' '}
              <Link to="/security" className="text-brand-600 hover:underline">Data Security page</Link>.
            </p>
          </section>

          {/* Data Sharing and Third Parties */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Data Sharing and Third Parties</h2>
            <p className="mb-4 text-gray-700">
              We do NOT sell, rent, or trade your personal data. We share data only with:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Firebase (Google Cloud):</strong> For authentication, database storage, and
                hosting. Firebase processes data under Google&apos;s privacy policies and is GDPR compliant.
              </li>
              <li>
                <strong>Google Drive API:</strong> Only when you explicitly connect your Google Drive.
                We access only the files and folders you authorize.
              </li>
              <li>
                <strong>Legal Authorities:</strong> When required by law, court order, or to protect
                our legal rights.
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              All third-party processors are bound by data processing agreements and comply with
              applicable data protection regulations.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your data may be transferred to and processed in countries outside your country of
              residence, including the United States (where Google Cloud services are hosted).
            </p>
            <p className="mt-4 text-gray-700">
              For transfers outside the EEA, we rely on:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-2 text-gray-700">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Data Processing Agreements with certified processors</li>
              <li>Adequacy decisions where applicable</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Your Rights</h2>
            <p className="mb-4 text-gray-700">
              Under GDPR and other privacy laws, you have the following rights:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Right of Access (Article 15):</strong> Request a copy of your personal data.
              </li>
              <li>
                <strong>Right to Rectification (Article 16):</strong> Correct inaccurate or incomplete data.
              </li>
              <li>
                <strong>Right to Erasure (Article 17):</strong> Request deletion of your data
                (&quot;Right to be Forgotten&quot;). See our{' '}
                <Link to="/data-deletion" className="text-brand-600 hover:underline">Data Deletion page</Link>.
              </li>
              <li>
                <strong>Right to Restrict Processing (Article 18):</strong> Limit how we use your data.
              </li>
              <li>
                <strong>Right to Data Portability (Article 20):</strong> Export your data in a
                machine-readable format.
              </li>
              <li>
                <strong>Right to Object (Article 21):</strong> Object to processing based on legitimate
                interests.
              </li>
              <li>
                <strong>Right to Withdraw Consent (Article 7):</strong> Withdraw consent at any time
                where consent is the legal basis.
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> File a complaint with your local data
                protection authority.
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">
                aoneahsan@gmail.com
              </a>. We will respond within 30 days.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">11. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use minimal, essential cookies for authentication and session management. We do NOT
              use third-party tracking cookies, advertising cookies, or analytics tracking tools.
            </p>
            <p className="mt-4 text-gray-700">
              For detailed information, see our{' '}
              <Link to="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">12. Children&apos;s Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for children under 16 years of age. We do not knowingly
              collect personal data from children under 16. If we discover we have collected data
              from a child under 16, we will delete it immediately. If you believe your child has
              provided us with personal data, please contact us.
            </p>
          </section>

          {/* Automated Decision Making */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">13. Automated Decision Making</h2>
            <p className="text-gray-700">
              We do NOT use automated decision-making or profiling that produces legal effects or
              similarly significant effects on you. All significant decisions are made with human
              oversight.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">14. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-2 text-gray-700">
              <li>Posting the updated policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date at the top</li>
              <li>Sending an email notification for significant changes</li>
            </ul>
            <p className="mt-4 text-gray-700">
              Your continued use of the service after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">15. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy or want to exercise your rights,
              please contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li><strong>Name:</strong> Ahsan Mahmood</li>
              <li><strong>Email:</strong> <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">aoneahsan@gmail.com</a></li>
              <li><strong>Phone/WhatsApp:</strong> +923046619706</li>
              <li><strong>Website:</strong> <a href="https://aoneahsan.com" className="text-brand-600 hover:underline">aoneahsan.com</a></li>
              <li><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/aoneahsan" className="text-brand-600 hover:underline">linkedin.com/in/aoneahsan</a></li>
            </ul>
          </section>

          {/* Quick Links */}
          <section className="mt-12 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-4 text-xl font-semibold">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
              <Link to="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>
              <Link to="/security" className="text-brand-600 hover:underline">Data Security</Link>
              <Link to="/data-deletion" className="text-brand-600 hover:underline">Data Deletion</Link>
            </div>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
