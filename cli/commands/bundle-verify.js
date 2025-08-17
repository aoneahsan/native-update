import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function verifyBundle(bundlePath, options) {
  console.log(chalk.blue('🔍 Verifying bundle signature...'));

  try {
    // Check if bundle exists
    await fs.access(bundlePath);

    // Look for signature file
    const sigPath = bundlePath.replace('.zip', '.sig');
    let signatureData;
    
    try {
      const sigContent = await fs.readFile(sigPath, 'utf-8');
      signatureData = JSON.parse(sigContent);
    } catch {
      throw new Error(`No signature file found at ${sigPath}`);
    }

    // Read public key
    const publicKeyPem = await fs.readFile(options.key, 'utf-8');
    
    // Read bundle
    const bundleData = await fs.readFile(bundlePath);
    
    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(bundleData);
    const isValid = verify.verify(publicKeyPem, signatureData.signature, 'base64');

    if (isValid) {
      console.log(chalk.green('✅ Bundle signature is VALID'));
      console.log('');
      console.log(chalk.bold('Bundle Details:'));
      console.log(chalk.gray(`  Signed at: ${signatureData.signedAt}`));
      console.log(chalk.gray(`  Algorithm: ${signatureData.algorithm}`));
      console.log('');
      console.log(chalk.green('This bundle can be trusted and deployed safely.'));
    } else {
      console.log(chalk.red('❌ Bundle signature is INVALID'));
      console.log('');
      console.log(chalk.red('WARNING: This bundle may have been tampered with!'));
      console.log(chalk.red('Do not deploy this bundle.'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to verify bundle:'), error.message);
    process.exit(1);
  }
}