#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  await fs.writeFile('private.key', privateKey);
  await fs.writeFile('public.key', publicKey);
  
  // Also create base64 version for easy inclusion in app config
  const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
  await fs.writeFile('public.key.b64', publicKeyBase64);
  
  console.log('Key pair generated successfully!');
  console.log('- private.key: Keep this secure on your server');
  console.log('- public.key: Include this in your app');
  console.log('- public.key.b64: Base64 version for app config');
}

async function signBundle(bundlePath, privateKeyPath) {
  try {
    // Read the bundle file
    const bundleData = await fs.readFile(bundlePath);
    
    // Read the private key
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    
    // Create signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(bundleData);
    const signature = sign.sign(privateKey, 'base64');
    
    // Save signature to file
    const signaturePath = bundlePath + '.sig';
    await fs.writeFile(signaturePath, signature);
    
    console.log('Bundle signed successfully!');
    console.log(`Signature saved to: ${signaturePath}`);
    console.log(`Signature (base64): ${signature}`);
    
    // Also calculate checksum
    const checksum = crypto.createHash('sha256').update(bundleData).digest('hex');
    console.log(`SHA-256 checksum: ${checksum}`);
    
  } catch (error) {
    console.error('Failed to sign bundle:', error.message);
    process.exit(1);
  }
}

async function verifyBundle(bundlePath, signaturePath, publicKeyPath) {
  try {
    // Read files
    const bundleData = await fs.readFile(bundlePath);
    const signature = await fs.readFile(signaturePath, 'utf8');
    const publicKey = await fs.readFile(publicKeyPath, 'utf8');
    
    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(bundleData);
    const isValid = verify.verify(publicKey, signature, 'base64');
    
    console.log(`Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
    
    // Also verify checksum
    const checksum = crypto.createHash('sha256').update(bundleData).digest('hex');
    console.log(`SHA-256 checksum: ${checksum}`);
    
  } catch (error) {
    console.error('Failed to verify bundle:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'generate-keys':
    await generateKeyPair();
    break;
    
  case 'sign':
    const bundlePath = process.argv[3];
    const privateKeyPath = process.argv[4] || 'private.key';
    
    if (!bundlePath) {
      console.error('Usage: bundle-signer.js sign <bundle-path> [private-key-path]');
      process.exit(1);
    }
    
    await signBundle(bundlePath, privateKeyPath);
    break;
    
  case 'verify':
    const verifyBundlePath = process.argv[3];
    const signaturePath = process.argv[4];
    const publicKeyPath = process.argv[5] || 'public.key';
    
    if (!verifyBundlePath || !signaturePath) {
      console.error('Usage: bundle-signer.js verify <bundle-path> <signature-path> [public-key-path]');
      process.exit(1);
    }
    
    await verifyBundle(verifyBundlePath, signaturePath, publicKeyPath);
    break;
    
  default:
    console.log('Capacitor Native Update - Bundle Signer');
    console.log('');
    console.log('Commands:');
    console.log('  generate-keys              Generate RSA key pair');
    console.log('  sign <bundle> [key]       Sign a bundle file');
    console.log('  verify <bundle> <sig> [key]  Verify bundle signature');
    console.log('');
    console.log('Examples:');
    console.log('  node bundle-signer.js generate-keys');
    console.log('  node bundle-signer.js sign bundle-1.0.0.zip');
    console.log('  node bundle-signer.js verify bundle-1.0.0.zip bundle-1.0.0.zip.sig');
}