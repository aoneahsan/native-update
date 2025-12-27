import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Shield, Lock, Server, Key, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
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
          <CardTitle className="text-3xl">Data Security</CardTitle>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
          <p className="mt-2 text-gray-700">
            How we protect your data and ensure the security of the Native Update platform.
          </p>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {/* Security Overview */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Security Overview</h2>
            <p className="text-gray-700">
              At Native Update, security is not an afterthought—it&apos;s built into every layer of our
              platform. We implement industry-standard security practices to protect your data,
              your apps, and your users.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <Shield className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <h3 className="font-semibold text-green-800">SOC 2 Compliant Infrastructure</h3>
                <p className="text-sm text-green-700">Google Cloud Platform</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <Lock className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <h3 className="font-semibold text-green-800">End-to-End Encryption</h3>
                <p className="text-sm text-green-700">TLS 1.3 + AES-256</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <Eye className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <h3 className="font-semibold text-green-800">GDPR Compliant</h3>
                <p className="text-sm text-green-700">Full data rights</p>
              </div>
            </div>
          </section>

          {/* Data Encryption */}
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <Lock className="h-6 w-6 text-brand-600" />
              Data Encryption
            </h2>

            <h3 className="mb-2 text-xl font-medium">Encryption in Transit</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>All connections use TLS 1.3 (the latest security standard)</li>
              <li>HTTPS enforced on all endpoints with HSTS headers</li>
              <li>Certificate transparency and pinning for critical connections</li>
              <li>Forward secrecy ensures past communications remain secure</li>
            </ul>

            <h3 className="mb-2 mt-6 text-xl font-medium">Encryption at Rest</h3>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>All database data encrypted with AES-256</li>
              <li>Automatic key rotation managed by Google Cloud</li>
              <li>Encrypted backups stored in geographically separate locations</li>
              <li>Passwords hashed using bcrypt with salt (never stored in plaintext)</li>
            </ul>
          </section>

          {/* Authentication Security */}
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <Key className="h-6 w-6 text-brand-600" />
              Authentication Security
            </h2>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Firebase Authentication:</strong> Industry-standard auth with automatic
                security updates
              </li>
              <li>
                <strong>Secure Token Handling:</strong> Short-lived access tokens with automatic refresh
              </li>
              <li>
                <strong>OAuth 2.0:</strong> Google Sign-In uses OAuth 2.0 with PKCE for mobile apps
              </li>
              <li>
                <strong>Session Management:</strong> Automatic session invalidation on password change
              </li>
              <li>
                <strong>Brute Force Protection:</strong> Rate limiting and account lockout after failed attempts
              </li>
              <li>
                <strong>Email Verification:</strong> Required for all new accounts
              </li>
            </ul>
          </section>

          {/* Infrastructure Security */}
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <Server className="h-6 w-6 text-brand-600" />
              Infrastructure Security
            </h2>
            <p className="mb-4 text-gray-700">
              Native Update is hosted on Google Cloud Platform (Firebase), which provides:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>SOC 1, SOC 2, SOC 3 Certified:</strong> Independently audited security controls
              </li>
              <li>
                <strong>ISO 27001 Certified:</strong> Information security management
              </li>
              <li>
                <strong>GDPR Compliant:</strong> EU data protection compliance
              </li>
              <li>
                <strong>99.95% Uptime SLA:</strong> High availability architecture
              </li>
              <li>
                <strong>DDoS Protection:</strong> Automatic attack mitigation
              </li>
              <li>
                <strong>Geographic Redundancy:</strong> Data replicated across multiple regions
              </li>
            </ul>
          </section>

          {/* OTA Update Security */}
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <Shield className="h-6 w-6 text-brand-600" />
              OTA Update Security
            </h2>
            <p className="mb-4 text-gray-700">
              Your app updates are protected with multiple security layers:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Bundle Signing:</strong> All update bundles are cryptographically signed
              </li>
              <li>
                <strong>Signature Verification:</strong> Apps verify signatures before applying updates
              </li>
              <li>
                <strong>Checksum Validation:</strong> SHA-256 checksums ensure bundle integrity
              </li>
              <li>
                <strong>Secure Delivery:</strong> Updates delivered over HTTPS only
              </li>
              <li>
                <strong>Rollback Protection:</strong> Automatic rollback if updates fail verification
              </li>
              <li>
                <strong>Version Pinning:</strong> Prevent downgrade attacks with version enforcement
              </li>
            </ul>

            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">How Update Signing Works</h3>
              <ol className="ml-6 list-decimal space-y-1 text-blue-800">
                <li>You generate a key pair (public/private) for your app</li>
                <li>Private key stays with you—we never see it</li>
                <li>Bundles are signed with your private key before upload</li>
                <li>Your app contains the public key to verify authenticity</li>
                <li>Invalid or tampered updates are automatically rejected</li>
              </ol>
            </div>
          </section>

          {/* Google Drive Security */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Google Drive Integration Security</h2>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>OAuth 2.0:</strong> We use Google&apos;s secure OAuth flow—we never see your Google password
              </li>
              <li>
                <strong>Minimal Scopes:</strong> We only request access to files WE create, not your entire Drive
              </li>
              <li>
                <strong>Token Security:</strong> Access tokens are encrypted and stored securely
              </li>
              <li>
                <strong>Revocable Access:</strong> You can disconnect at any time from dashboard or Google settings
              </li>
              <li>
                <strong>Your Data, Your Control:</strong> Files stay in YOUR Drive, not our servers
              </li>
            </ul>
          </section>

          {/* Access Controls */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Access Controls</h2>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>
                <strong>Principle of Least Privilege:</strong> Staff access only what&apos;s necessary
              </li>
              <li>
                <strong>Audit Logging:</strong> All administrative actions are logged
              </li>
              <li>
                <strong>No Shared Accounts:</strong> Individual accounts for all personnel
              </li>
              <li>
                <strong>Regular Access Reviews:</strong> Quarterly review of all access permissions
              </li>
            </ul>
          </section>

          {/* Security Practices */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Our Security Practices</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Regular Audits
                </h3>
                <p className="text-gray-700">
                  We perform regular security reviews and vulnerability assessments of our codebase
                  and infrastructure.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Dependency Updates
                </h3>
                <p className="text-gray-700">
                  Dependencies are regularly updated and scanned for known vulnerabilities using
                  automated tools.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Secure Development
                </h3>
                <p className="text-gray-700">
                  Code reviews, static analysis, and security testing are part of our development
                  process.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Incident Response
                </h3>
                <p className="text-gray-700">
                  We have documented procedures for responding to security incidents and will notify
                  affected users promptly.
                </p>
              </div>
            </div>
          </section>

          {/* Reporting Vulnerabilities */}
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Reporting Security Vulnerabilities
            </h2>
            <p className="mb-4 text-gray-700">
              We take security vulnerabilities seriously. If you discover a security issue, please
              report it responsibly:
            </p>
            <div className="rounded-lg bg-yellow-50 p-6">
              <ul className="space-y-2 text-yellow-800">
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:aoneahsan@gmail.com" className="underline">
                    aoneahsan@gmail.com
                  </a>
                </li>
                <li><strong>Subject:</strong> &quot;Security Vulnerability Report&quot;</li>
                <li><strong>Include:</strong> Description, steps to reproduce, potential impact</li>
                <li><strong>Response Time:</strong> We will acknowledge within 48 hours</li>
              </ul>
              <p className="mt-4 text-yellow-800">
                Please give us reasonable time to address the issue before public disclosure. We
                appreciate responsible disclosure and will credit researchers who help improve our
                security.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Your Security Responsibilities</h2>
            <p className="mb-4 text-gray-700">
              While we do everything possible to protect your data, security is a shared responsibility:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-gray-700">
              <li>Use a strong, unique password for your account</li>
              <li>Keep your signing keys secure and private</li>
              <li>Review and revoke access tokens you no longer need</li>
              <li>Report any suspicious activity immediately</li>
              <li>Keep your apps updated to the latest Native Update SDK version</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Security Questions?</h2>
            <p className="text-gray-700">
              For security-related inquiries, contact us:
            </p>
            <ul className="ml-6 mt-4 list-none space-y-2 text-gray-700">
              <li><strong>Email:</strong> <a href="mailto:aoneahsan@gmail.com" className="text-brand-600 hover:underline">aoneahsan@gmail.com</a></li>
              <li><strong>Subject:</strong> Please use &quot;Security Inquiry - Native Update&quot; in the subject line</li>
            </ul>
          </section>

          {/* Related Links */}
          <section className="mt-12 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-4 text-xl font-semibold">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
              <Link to="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>
              <Link to="/data-deletion" className="text-brand-600 hover:underline">Data Deletion</Link>
            </div>
          </section>
        </CardContent>
      </Card>
    </Container>
  );
}
