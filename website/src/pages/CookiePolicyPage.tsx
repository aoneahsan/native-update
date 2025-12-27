import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Cookie, Shield, Settings, Info } from 'lucide-react';

export default function CookiePolicyPage() {
  const lastUpdated = 'December 27, 2025';

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
          <CardTitle className="text-3xl">Cookie Policy</CardTitle>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-gray-700">
              This Cookie Policy explains how Native Update (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies
              and similar technologies when you visit our website at nativeupdate.dev. This policy
              is designed to help you understand what cookies are, how we use them, and your choices
              regarding their use.
            </p>
          </section>

          {/* What Are Cookies */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. What Are Cookies?</h2>
            <p className="text-gray-700">
              Cookies are small text files that are stored on your device (computer, tablet, or
              mobile phone) when you visit a website. They are widely used to make websites work
              more efficiently and to provide information to website owners.
            </p>
            <p className="mt-4 text-gray-700">
              Similar technologies include:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-2 text-gray-700">
              <li><strong>Local Storage:</strong> Data stored in your browser that persists until cleared</li>
              <li><strong>Session Storage:</strong> Data stored for the duration of a browser session</li>
              <li><strong>Pixels/Web Beacons:</strong> Small images used to track page views (we don&apos;t use these)</li>
            </ul>
          </section>

          {/* Our Cookie Usage */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Cookies</h2>
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 shrink-0 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Privacy-First Approach</h3>
                  <p className="text-green-800">
                    We use ONLY strictly necessary cookies. We do NOT use tracking cookies,
                    advertising cookies, or third-party analytics cookies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Cookies */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Cookies We Use</h2>

            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Cookie className="h-6 w-6 text-brand-600" />
                  Essential Cookies (Strictly Necessary)
                </h3>
                <p className="mb-4 text-gray-700">
                  These cookies are required for the website to function. They cannot be disabled.
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Cookie Name</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Purpose</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Duration</th>
                        <th className="py-2 text-left font-semibold text-gray-900">Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">firebase-auth-token</td>
                        <td className="py-3 pr-4 text-gray-700">Authentication session</td>
                        <td className="py-3 pr-4 text-gray-700">Session / 14 days</td>
                        <td className="py-3 text-gray-700">Firebase</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">__session</td>
                        <td className="py-3 pr-4 text-gray-700">Session management</td>
                        <td className="py-3 pr-4 text-gray-700">Session</td>
                        <td className="py-3 text-gray-700">Native Update</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">csrf_token</td>
                        <td className="py-3 pr-4 text-gray-700">Security (CSRF protection)</td>
                        <td className="py-3 pr-4 text-gray-700">Session</td>
                        <td className="py-3 text-gray-700">Native Update</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Settings className="h-6 w-6 text-brand-600" />
                  Functional Cookies
                </h3>
                <p className="mb-4 text-gray-700">
                  These cookies enable personalized features and remember your preferences.
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Cookie Name</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Purpose</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-900">Duration</th>
                        <th className="py-2 text-left font-semibold text-gray-900">Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">theme</td>
                        <td className="py-3 pr-4 text-gray-700">Dark/light mode preference</td>
                        <td className="py-3 pr-4 text-gray-700">1 year</td>
                        <td className="py-3 text-gray-700">Native Update</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">sidebar_collapsed</td>
                        <td className="py-3 pr-4 text-gray-700">Dashboard sidebar state</td>
                        <td className="py-3 pr-4 text-gray-700">1 year</td>
                        <td className="py-3 text-gray-700">Native Update</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* What We Don't Use */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-red-800">
                  <Info className="h-6 w-6" />
                  Cookies We Do NOT Use
                </h3>
                <ul className="ml-6 list-disc space-y-2 text-red-800">
                  <li><strong>Analytics Cookies:</strong> We do not use Google Analytics, Mixpanel, or similar</li>
                  <li><strong>Advertising Cookies:</strong> We do not use ad tracking or retargeting</li>
                  <li><strong>Social Media Cookies:</strong> We do not embed social media trackers</li>
                  <li><strong>Third-Party Tracking:</strong> We do not share data with data brokers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Local Storage */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Local Storage Usage</h2>
            <p className="mb-4 text-gray-700">
              We use browser local storage for the following purposes:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-lg border border-gray-200">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 pl-4 pr-4 text-left font-semibold text-gray-900">Key</th>
                    <th className="py-3 pr-4 text-left font-semibold text-gray-900">Purpose</th>
                    <th className="py-3 pr-4 text-left font-semibold text-gray-900">Data Stored</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pl-4 pr-4 text-gray-700">user_preferences</td>
                    <td className="py-3 pr-4 text-gray-700">UI preferences</td>
                    <td className="py-3 pr-4 text-gray-700">Theme, layout settings</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pl-4 pr-4 text-gray-700">draft_config</td>
                    <td className="py-3 pr-4 text-gray-700">Unsaved form data</td>
                    <td className="py-3 pr-4 text-gray-700">Configuration drafts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Managing Your Cookie Preferences</h2>
            <p className="mb-4 text-gray-700">
              Since we only use essential cookies, there is no cookie consent banner. However, you
              can still control cookies through your browser:
            </p>

            <h3 className="mb-2 text-xl font-medium">Browser Settings</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data
              </li>
              <li>
                <strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </li>
              <li>
                <strong>Edge:</strong> Settings → Privacy, search, and services → Cookies
              </li>
            </ul>

            <div className="mt-4 rounded-lg bg-yellow-50 p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Blocking essential cookies may prevent you from logging in or
                using the dashboard. The marketing pages will continue to work normally.
              </p>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Third-Party Cookies</h2>
            <p className="text-gray-700">
              The only third-party service that may set cookies is Firebase Authentication (Google).
              Firebase cookies are strictly for authentication purposes and are covered by{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Google&apos;s Privacy Policy
              </a>.
            </p>
          </section>

          {/* Updates to Policy */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about our use of cookies, please contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li><strong>Email:</strong> <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">aoneahsan@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://aoneahsan.com" className="text-brand-600 hover:underline">aoneahsan.com</a></li>
            </ul>
          </section>

          {/* Related Links */}
          <section className="mt-12 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-4 text-xl font-semibold">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
              <Link to="/security" className="text-brand-600 hover:underline">Data Security</Link>
              <Link to="/data-deletion" className="text-brand-600 hover:underline">Data Deletion</Link>
            </div>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
