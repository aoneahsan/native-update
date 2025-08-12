import React, { useState } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { useUpdateContext } from '../context/UpdateContext';

export default function SecurityDemo() {
  const { addLog } = useUpdateContext();
  const [publicKey, setPublicKey] = useState('');
  const [certificateHashes, setCertificateHashes] = useState<string[]>([]);
  const [newCertHash, setNewCertHash] = useState('');

  const generateKeyPair = async () => {
    try {
      // In a real app, this would be done server-side
      addLog('info', 'Generating RSA key pair...');
      
      // Simulate key generation
      const mockPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...';
      setPublicKey(mockPublicKey);
      
      addLog('success', 'Key pair generated (mock)');
      addLog('warning', 'In production, generate keys server-side and never expose private keys');
    } catch (error) {
      addLog('error', `Failed to generate keys: ${error.message}`);
    }
  };

  const updateSecurityConfig = async () => {
    try {
      await CapacitorNativeUpdate.configure({
        security: {
          enforceHttps: true,
          validateSignatures: true,
          pinCertificates: certificateHashes.length > 0,
          certificateHashes: certificateHashes,
          publicKey: publicKey
        }
      });
      
      addLog('success', 'Security configuration updated');
    } catch (error) {
      addLog('error', `Failed to update security config: ${error.message}`);
    }
  };

  const addCertificateHash = () => {
    if (newCertHash && !certificateHashes.includes(newCertHash)) {
      setCertificateHashes([...certificateHashes, newCertHash]);
      setNewCertHash('');
      addLog('info', 'Certificate hash added');
    }
  };

  const removeCertificateHash = (hash: string) => {
    setCertificateHashes(certificateHashes.filter(h => h !== hash));
    addLog('info', 'Certificate hash removed');
  };

  const verifyBundleSignature = async () => {
    try {
      const current = await CapacitorNativeUpdate.getCurrentBundle();
      
      if (current.signature) {
        addLog('info', 'Verifying bundle signature...');
        
        const result = await CapacitorNativeUpdate.verifySignature({
          bundleId: current.bundleId,
          signature: current.signature
        });
        
        if (result.isValid) {
          addLog('success', 'Bundle signature is valid');
        } else {
          addLog('error', 'Bundle signature verification failed');
        }
      } else {
        addLog('warning', 'Current bundle has no signature');
      }
    } catch (error) {
      addLog('error', `Signature verification error: ${error.message}`);
    }
  };

  const checkSecurityStatus = async () => {
    try {
      const status = await CapacitorNativeUpdate.getSecurityStatus();
      
      addLog('info', `HTTPS enforced: ${status.httpsEnforced ? 'Yes' : 'No'}`);
      addLog('info', `Signature validation: ${status.signatureValidation ? 'Enabled' : 'Disabled'}`);
      addLog('info', `Certificate pinning: ${status.certificatePinning ? 'Enabled' : 'Disabled'}`);
      addLog('info', `Public key configured: ${status.publicKeyConfigured ? 'Yes' : 'No'}`);
      
      if (status.lastSecurityCheck) {
        addLog('info', `Last security check: ${new Date(status.lastSecurityCheck).toLocaleString()}`);
      }
    } catch (error) {
      addLog('error', `Failed to check security status: ${error.message}`);
    }
  };

  const testInsecureUrl = async () => {
    try {
      addLog('warning', 'Testing insecure URL rejection...');
      
      await CapacitorNativeUpdate.setUpdateUrl('http://insecure-server.com/updates');
      
      addLog('error', 'Insecure URL was accepted! Security may be disabled.');
    } catch (error) {
      addLog('success', `Insecure URL rejected as expected: ${error.message}`);
    }
  };

  const enableStrictMode = async () => {
    try {
      await CapacitorNativeUpdate.configure({
        security: {
          enforceHttps: true,
          validateSignatures: true,
          pinCertificates: true,
          strictMode: true,
          allowSelfSignedCerts: false,
          minTlsVersion: '1.3'
        }
      });
      
      addLog('success', 'Strict security mode enabled');
    } catch (error) {
      addLog('error', `Failed to enable strict mode: ${error.message}`);
    }
  };

  const checkBundleIntegrity = async () => {
    try {
      const bundles = await CapacitorNativeUpdate.getBundles();
      
      addLog('info', `Checking integrity of ${bundles.bundles.length} bundles...`);
      
      for (const bundle of bundles.bundles) {
        const result = await CapacitorNativeUpdate.validateUpdate({
          bundlePath: bundle.path,
          checksum: bundle.checksum
        });
        
        if (result.isValid) {
          addLog('success', `Bundle ${bundle.version}: Valid`);
        } else {
          addLog('error', `Bundle ${bundle.version}: Invalid!`);
        }
      }
    } catch (error) {
      addLog('error', `Integrity check failed: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>🔒 Security Features</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>RSA Public Key</h3>
          <textarea 
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="Paste your base64-encoded public key here"
            style={{ 
              width: '100%', 
              height: '80px', 
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
          <button 
            className="button secondary" 
            onClick={generateKeyPair}
            style={{ marginTop: '10px' }}
          >
            Generate Mock Keys
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Certificate Pinning</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input 
              type="text"
              value={newCertHash}
              onChange={(e) => setNewCertHash(e.target.value)}
              placeholder="SHA-256 certificate hash"
              style={{ 
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            <button className="button secondary" onClick={addCertificateHash}>
              Add Hash
            </button>
          </div>
          
          {certificateHashes.length > 0 && (
            <div style={{ 
              background: '#f7fafc', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {certificateHashes.map((hash, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <code>{hash}</code>
                  <button 
                    onClick={() => removeCertificateHash(hash)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#e53e3e',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="button" 
          onClick={updateSecurityConfig}
        >
          Apply Security Configuration
        </button>
      </div>

      <div className="card">
        <h2>🛡️ Security Validation</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button className="button secondary" onClick={checkSecurityStatus}>
            Check Security Status
          </button>
          
          <button className="button secondary" onClick={verifyBundleSignature}>
            Verify Bundle Signature
          </button>
          
          <button className="button secondary" onClick={checkBundleIntegrity}>
            Check All Bundle Integrity
          </button>
          
          <button className="button danger" onClick={testInsecureUrl}>
            Test Insecure URL
          </button>
          
          <button className="button" onClick={enableStrictMode}>
            Enable Strict Mode
          </button>
        </div>
      </div>

      <div className="card">
        <h2>📋 Security Best Practices</h2>
        
        <div className="status info">
          <ul style={{ marginLeft: '20px' }}>
            <li>Always use HTTPS for update servers</li>
            <li>Implement RSA signature verification for all bundles</li>
            <li>Use certificate pinning for critical applications</li>
            <li>Validate checksums before applying updates</li>
            <li>Never embed private keys in client code</li>
            <li>Rotate signing keys periodically</li>
            <li>Monitor failed validation attempts</li>
            <li>Implement rollback for failed updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}