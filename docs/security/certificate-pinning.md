# Certificate Pinning

Certificate pinning provides an additional layer of security by ensuring that your app only communicates with servers that have specific SSL certificates. This prevents man-in-the-middle attacks even if a certificate authority is compromised.

## Configuration

Certificate pinning is configured through the security configuration:

```typescript
import { NativeUpdate } from 'capacitor-native-update';

await NativeUpdate.configure({
  config: {
    security: {
      certificatePinning: {
        enabled: true,
        pins: [
          {
            hostname: 'api.example.com',
            sha256: [
              'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
              'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=' // Backup pin
            ]
          },
          {
            hostname: 'cdn.example.com',
            sha256: [
              'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC='
            ]
          }
        ]
      }
    }
  }
});
```

## Generating Certificate Pins

To generate SHA-256 pins for your certificates:

### Using OpenSSL (Recommended)

```bash
# For a live server
openssl s_client -servername example.com -connect example.com:443 | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64

# For a certificate file
openssl x509 -in certificate.crt -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

### Using the Plugin Utility

```typescript
import { CertificatePinning } from 'capacitor-native-update/certificate-pinning';

// Generate pin from PEM certificate
const pin = await CertificatePinning.generateFingerprint(certificatePem);
console.log(pin); // sha256/base64hash...
```

## Best Practices

1. **Always Include Backup Pins**: Include at least one backup pin for certificate rotation
2. **Pin to Intermediate CA**: Consider pinning to intermediate CA certificates for flexibility
3. **Test Thoroughly**: Test certificate rotation scenarios before production
4. **Monitor Failures**: Implement logging for pin validation failures
5. **Plan for Updates**: Have a strategy for updating pins when certificates change

## Platform Differences

- **iOS**: Uses URLSession delegate for certificate validation
- **Android**: Uses OkHttp's CertificatePinner
- **Web**: Certificate pinning is not available in web browsers

## Error Handling

Certificate pinning failures will result in network errors:

```typescript
try {
  await NativeUpdate.sync();
} catch (error) {
  if (error.code === 'CERTIFICATE_PIN_FAILURE') {
    // Handle certificate pinning failure
    console.error('Certificate validation failed:', error.message);
  }
}
```

## Disabling for Development

For development environments, you may want to disable certificate pinning:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

await NativeUpdate.configure({
  config: {
    security: {
      certificatePinning: {
        enabled: !isDevelopment,
        pins: [...]
      }
    }
  }
});
```

## Security Considerations

- Certificate pins are included in your app bundle and can be extracted
- Use certificate pinning as one layer of defense, not the only security measure
- Regularly review and update pins as certificates are renewed
- Consider implementing a pin update mechanism through your update system