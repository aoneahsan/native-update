#!/usr/bin/env node

import { generateKeyPairSync, createSign, createVerify } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const args = process.argv.slice(2);
const command = args[0];

console.log('Bundle Signer for Capacitor Native Update');
console.log('========================================\n');

function generateKeys() {
  console.log('Generating RSA key pair...');

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  writeFileSync('private-key.pem', privateKey);
  writeFileSync('public-key.pem', publicKey);

  console.log('Keys generated successfully!');
  console.log('- Private key: private-key.pem');
  console.log('- Public key: public-key.pem');
  console.log('\n⚠️  Keep private-key.pem secure and never commit it!');
}

function signBundle(bundlePath, privateKeyPath) {
  if (!existsSync(bundlePath)) {
    console.error(`Bundle not found: ${bundlePath}`);
    process.exit(1);
  }

  if (!existsSync(privateKeyPath)) {
    console.error(`Private key not found: ${privateKeyPath}`);
    process.exit(1);
  }

  const bundleData = readFileSync(bundlePath);
  const privateKey = readFileSync(privateKeyPath, 'utf8');

  const sign = createSign('SHA256');
  sign.update(bundleData);
  sign.end();

  const signature = sign.sign(privateKey, 'base64');

  const signatureFile = `${bundlePath}.sig`;
  writeFileSync(signatureFile, signature);

  console.log('Bundle signed successfully!');
  console.log(`Signature: ${signatureFile}`);
}

function verifyBundle(bundlePath, signaturePath, publicKeyPath) {
  const bundleData = readFileSync(bundlePath);
  const signature = readFileSync(signaturePath, 'utf8');
  const publicKey = readFileSync(publicKeyPath, 'utf8');

  const verify = createVerify('SHA256');
  verify.update(bundleData);
  verify.end();

  const isValid = verify.verify(publicKey, signature, 'base64');

  console.log(`Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
  process.exit(isValid ? 0 : 1);
}

function showHelp() {
  console.log('Usage: bundle-signer <command> [options]\n');
  console.log('Commands:');
  console.log('  generate-keys                     Generate RSA key pair');
  console.log('  sign <bundle> <private-key>       Sign a bundle');
  console.log('  verify <bundle> <sig> <pub-key>   Verify bundle signature');
  console.log('\nExamples:');
  console.log('  bundle-signer generate-keys');
  console.log('  bundle-signer sign bundle.zip private-key.pem');
  console.log(
    '  bundle-signer verify bundle.zip bundle.zip.sig public-key.pem'
  );
}

// Handle commands
switch (command) {
  case 'generate-keys':
    generateKeys();
    break;

  case 'sign':
    const bundle = args[1];
    const privateKey = args[2];
    if (!bundle || !privateKey) {
      console.error('Missing arguments');
      showHelp();
      process.exit(1);
    }
    signBundle(bundle, privateKey);
    break;

  case 'verify':
    const bundleToVerify = args[1];
    const signature = args[2];
    const publicKey = args[3];
    if (!bundleToVerify || !signature || !publicKey) {
      console.error('Missing arguments');
      showHelp();
      process.exit(1);
    }
    verifyBundle(bundleToVerify, signature, publicKey);
    break;

  default:
    showHelp();
}
