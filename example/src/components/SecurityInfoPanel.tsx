import React, { useState, useEffect } from 'react';
import type { UpdateService } from '../services/update-service';

interface SecurityInfoPanelProps {
  updateService: UpdateService;
}

export const SecurityInfoPanel: React.FC<SecurityInfoPanelProps> = ({
  updateService,
}) => {
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const [testUrl, setTestUrl] = useState('https://example.com/update.zip');
  const [testChecksum, setTestChecksum] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      const info = await updateService.getSecurityInfo();
      setSecurityInfo(info);
    } catch (error) {
      console.error('Failed to load security info:', error);
    }
  };

  const testUrlValidation = () => {
    try {
      // Simple URL validation for demo
      const url = new URL(testUrl);
      const isHttps = url.protocol === 'https:';

      if (securityInfo?.enforceHttps && !isHttps) {
        setValidationResult({
          isValid: false,
          message: 'URL must use HTTPS protocol',
        });
      } else {
        setValidationResult({
          isValid: true,
          message: 'URL is valid',
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'Invalid URL format',
      });
    }
  };

  const generateTestChecksum = async () => {
    // Generate a fake checksum for demo purposes
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const checksum = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setTestChecksum(checksum);
  };

  return (
    <div className='panel'>
      <h2>Security Information</h2>

      <div className='panel-section'>
        <h3>Current Security Configuration</h3>
        {securityInfo ? (
          <>
            <div className='info-group'>
              <span className='info-label'>HTTPS Enforcement:</span>
              <span
                className={`status-badge ${securityInfo.enforceHttps ? 'active' : 'failed'}`}
              >
                {securityInfo.enforceHttps ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className='info-group'>
              <span className='info-label'>Certificate Pinning:</span>
              <span
                className={`status-badge ${securityInfo.certificatePinning?.enabled ? 'active' : 'failed'}`}
              >
                {securityInfo.certificatePinning?.enabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>

            <div className='info-group'>
              <span className='info-label'>Input Validation:</span>
              <span
                className={`status-badge ${securityInfo.validateInputs ? 'active' : 'failed'}`}
              >
                {securityInfo.validateInputs ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className='info-group'>
              <span className='info-label'>Secure Storage:</span>
              <span
                className={`status-badge ${securityInfo.secureStorage ? 'active' : 'failed'}`}
              >
                {securityInfo.secureStorage ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {securityInfo.certificatePinning?.certificates?.length > 0 && (
              <div className='info-group'>
                <span className='info-label'>Pinned Certificates:</span>
                <span className='info-value'>
                  {securityInfo.certificatePinning.certificates.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <p>Loading security information...</p>
        )}
      </div>

      <div className='panel-section'>
        <h3>Security Features</h3>
        <div className='alert info'>
          <h4>Implemented Security Measures:</h4>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>
              <strong>Checksum Validation:</strong> SHA-256/512 verification for
              all downloads
            </li>
            <li>
              <strong>Signature Verification:</strong> RSA public key signature
              support
            </li>
            <li>
              <strong>HTTPS Enforcement:</strong> Secure connections required by
              default
            </li>
            <li>
              <strong>Path Traversal Prevention:</strong> Input sanitization and
              validation
            </li>
            <li>
              <strong>Secure Storage:</strong> Platform keychain/keystore
              integration
            </li>
            <li>
              <strong>Certificate Pinning:</strong> Optional SSL certificate
              validation
            </li>
            <li>
              <strong>Size Limits:</strong> Maximum bundle size enforcement
            </li>
            <li>
              <strong>Version Control:</strong> Downgrade attack prevention
            </li>
          </ul>
        </div>
      </div>

      <div className='panel-section'>
        <h3>URL Validation Test</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type='text'
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder='Enter URL to test'
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              marginBottom: '0.5rem',
            }}
          />
          <button
            className='primary'
            onClick={testUrlValidation}
          >
            Validate URL
          </button>
        </div>

        {validationResult && (
          <div
            className={`alert ${validationResult.isValid ? 'success' : 'error'}`}
          >
            {validationResult.message}
          </div>
        )}
      </div>

      <div className='panel-section'>
        <h3>Checksum Generator</h3>
        <p>Generate a test SHA-256 checksum for demo purposes:</p>
        <div style={{ marginTop: '0.5rem' }}>
          <button
            className='secondary'
            onClick={generateTestChecksum}
          >
            Generate Checksum
          </button>
          {testChecksum && (
            <div style={{ marginTop: '1rem' }}>
              <code
                style={{
                  display: 'block',
                  padding: '0.5rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  fontSize: '0.875rem',
                }}
              >
                {testChecksum}
              </code>
            </div>
          )}
        </div>
      </div>

      <div className='panel-section'>
        <h3>Security Best Practices</h3>
        <div className='alert info'>
          <ol style={{ marginLeft: '1.5rem' }}>
            <li>Always use HTTPS for update servers</li>
            <li>Implement bundle signing with private keys</li>
            <li>Store public keys securely in the app</li>
            <li>Validate all inputs from untrusted sources</li>
            <li>Use platform-specific secure storage</li>
            <li>Implement certificate pinning for critical connections</li>
            <li>Monitor and log security events</li>
            <li>Regular security audits and updates</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
