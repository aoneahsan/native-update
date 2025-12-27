import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Trash2, Mail, Clock, Shield, AlertTriangle } from 'lucide-react';

export default function DataDeletionPage() {
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
          <CardTitle className="text-3xl">Account &amp; Data Deletion</CardTitle>
          <p className="text-gray-600">
            Your right to delete your data under GDPR Article 17 (&quot;Right to Erasure&quot;)
          </p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {/* Overview */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Overview</h2>
            <p className="text-gray-700">
              At Native Update, we respect your right to control your personal data. You can request
              deletion of your account and all associated data at any time. This page explains what
              data will be deleted, the process, and what to expect.
            </p>
          </section>

          {/* What Gets Deleted */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">What Gets Deleted</h2>
            <p className="mb-4 text-gray-700">
              When you request account deletion, the following data will be permanently removed:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Account Information
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-gray-700">
                  <li>Email address</li>
                  <li>Display name</li>
                  <li>Profile photo</li>
                  <li>Account preferences</li>
                  <li>Authentication credentials</li>
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  App &amp; Build Data
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-gray-700">
                  <li>App configurations</li>
                  <li>Build metadata</li>
                  <li>Version history</li>
                  <li>Upload records</li>
                  <li>Activity logs</li>
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Integration Data
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-gray-700">
                  <li>Google Drive access tokens</li>
                  <li>OAuth connection data</li>
                  <li>API keys (revoked)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Usage Data
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-gray-700">
                  <li>Session history</li>
                  <li>Feature usage logs</li>
                  <li>Error reports</li>
                </ul>
              </div>
            </div>
          </section>

          {/* What Remains in Your Google Drive */}
          <section className="mb-8">
            <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Important: Google Drive Files
              </h3>
              <p className="text-yellow-800">
                Build files stored in your connected Google Drive are NOT automatically deleted when
                you delete your Native Update account. These files remain in YOUR Google Drive under
                your control. You must manually delete them from your Google Drive if you no longer
                need them. We recommend doing this before deleting your account.
              </p>
            </div>
          </section>

          {/* Deletion Timeline */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Deletion Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Immediate (0-24 hours)</h3>
                  <p className="text-gray-700">
                    Your account is deactivated. You can no longer log in. Active sessions are terminated.
                    API access is revoked.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Within 7 days</h3>
                  <p className="text-gray-700">
                    Primary database records are deleted. Your email confirmation is sent.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Within 30 days</h3>
                  <p className="text-gray-700">
                    Backup systems are purged. All data is permanently and irreversibly deleted.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Request Deletion */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">How to Request Deletion</h2>

            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">1</span>
                  Self-Service (Fastest)
                </h3>
                <p className="mb-4 text-gray-700">
                  If you have access to your account:
                </p>
                <ol className="ml-6 list-decimal space-y-2 text-gray-700">
                  <li>Log in to your Native Update dashboard</li>
                  <li>Go to Settings → Account</li>
                  <li>Click &quot;Delete My Account&quot;</li>
                  <li>Confirm by entering your password</li>
                  <li>Your account will be scheduled for deletion</li>
                </ol>
                <div className="mt-4">
                  <Button asChild>
                    <Link to="/login">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">2</span>
                  Email Request
                </h3>
                <p className="mb-4 text-gray-700">
                  If you cannot access your account or prefer email:
                </p>
                <ol className="ml-6 list-decimal space-y-2 text-gray-700">
                  <li>Send an email to <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">aoneahsan@gmail.com</a></li>
                  <li>Subject: &quot;Account Deletion Request&quot;</li>
                  <li>Include: Your registered email address</li>
                  <li>We will verify your identity and process the request</li>
                  <li>You will receive confirmation within 72 hours</li>
                </ol>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <a href="mailto:aoneahsan@gmail.com?subject=Account%20Deletion%20Request">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email Request
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention Exceptions */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Data Retention Exceptions</h2>
            <p className="mb-4 text-gray-700">
              In accordance with GDPR Article 17(3), we may retain certain data after deletion in
              these limited circumstances:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Legal Compliance:</strong> Data required for legal, tax, or audit purposes
                (typically anonymized transaction records kept for 7 years)
              </li>
              <li>
                <strong>Legal Claims:</strong> Data needed to establish, exercise, or defend legal claims
              </li>
              <li>
                <strong>Public Interest:</strong> Data necessary for public health or scientific research
                (extremely rare)
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              Any retained data is minimized, anonymized where possible, and securely stored.
            </p>
          </section>

          {/* After Deletion */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">After Deletion</h2>
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 shrink-0 text-green-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">What happens next?</h3>
                  <ul className="list-disc space-y-2 pl-6 text-gray-700">
                    <li>You will receive an email confirmation once deletion is complete</li>
                    <li>Your email address becomes available for new account registration</li>
                    <li>Any active OTA updates for your apps will stop working</li>
                    <li>Apps using Native Update will fall back to their bundled version</li>
                    <li>You can create a new account at any time with the same or different email</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Questions?</h2>
            <p className="text-gray-700">
              If you have questions about data deletion or need assistance, contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li><strong>Email:</strong> <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">aoneahsan@gmail.com</a></li>
              <li><strong>Phone/WhatsApp:</strong> +923046619706</li>
              <li><strong>Response Time:</strong> Within 72 hours</li>
            </ul>
          </section>

          {/* Related Links */}
          <section className="mt-12 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-4 text-xl font-semibold">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
              <Link to="/security" className="text-brand-600 hover:underline">Data Security</Link>
              <Link to="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>
            </div>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
