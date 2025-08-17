import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function signBundle(bundlePath, options) {
  console.log(chalk.blue('🔏 Signing bundle...'));

  try {
    // Validate bundle exists
    await fs.access(bundlePath);

    // Read private key
    const privateKeyPem = await fs.readFile(options.key, 'utf-8');
    
    // Read bundle
    const bundleData = await fs.readFile(bundlePath);
    
    // Create signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(bundleData);
    const signature = sign.sign(privateKeyPem, 'base64');

    // Determine output path
    const outputPath = options.output || bundlePath.replace('.zip', '.signed.zip');
    
    // Create signed bundle metadata
    const signedMetadata = {
      originalBundle: path.basename(bundlePath),
      signature,
      signedAt: new Date().toISOString(),
      algorithm: 'RSA-SHA256'
    };

    // Save signature file
    const sigPath = outputPath.replace('.zip', '.sig');
    await fs.writeFile(sigPath, JSON.stringify(signedMetadata, null, 2));

    // Copy bundle to output path if different
    if (outputPath !== bundlePath) {
      await fs.copyFile(bundlePath, outputPath);
    }

    console.log(chalk.green('✅ Bundle signed successfully!'));
    console.log('');
    console.log(chalk.bold('Signed Bundle:'));
    console.log(chalk.gray(`  Bundle: ${outputPath}`));
    console.log(chalk.gray(`  Signature: ${sigPath}`));
    console.log('');
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('  1. Upload both files to your update server'));
    console.log(chalk.gray('  2. Update your server to serve the signature'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to sign bundle:'), error.message);
    process.exit(1);
  }
}