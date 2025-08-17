import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { generateKeyPairSync } from 'crypto';

export async function generateKeys(options) {
  console.log(chalk.blue('🔑 Generating key pair...'));

  try {
    // Create output directory
    const outputDir = path.resolve(options.output);
    await fs.mkdir(outputDir, { recursive: true });

    let publicKey, privateKey;

    if (options.type === 'rsa') {
      // Generate RSA key pair
      const keySize = parseInt(options.size);
      if (![2048, 4096].includes(keySize)) {
        throw new Error('RSA key size must be 2048 or 4096');
      }

      ({ publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }));
    } else if (options.type === 'ec') {
      // Generate EC key pair
      const curveMap = {
        '256': 'prime256v1',
        '384': 'secp384r1'
      };
      const namedCurve = curveMap[options.size];
      if (!namedCurve) {
        throw new Error('EC key size must be 256 or 384');
      }

      ({ publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }));
    } else {
      throw new Error('Key type must be "rsa" or "ec"');
    }

    // Save keys
    const timestamp = Date.now();
    const privateKeyPath = path.join(outputDir, `private-${timestamp}.pem`);
    const publicKeyPath = path.join(outputDir, `public-${timestamp}.pem`);

    await fs.writeFile(privateKeyPath, privateKey);
    await fs.writeFile(publicKeyPath, publicKey);

    // Set proper permissions on private key
    await fs.chmod(privateKeyPath, 0o600);

    console.log(chalk.green('✅ Key pair generated successfully!'));
    console.log('');
    console.log(chalk.bold('Key Files:'));
    console.log(chalk.gray(`  Private Key: ${privateKeyPath}`));
    console.log(chalk.gray(`  Public Key: ${publicKeyPath}`));
    console.log('');
    console.log(chalk.yellow('⚠️  Security Notes:'));
    console.log(chalk.red('  • Keep your private key secure and never commit it to version control'));
    console.log(chalk.gray('  • Add the public key to your app configuration'));
    console.log(chalk.gray('  • Use the private key for signing bundles on your CI/CD server'));
    console.log('');
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('  1. Add to .gitignore:'));
    console.log(chalk.cyan(`     echo "${path.basename(privateKeyPath)}" >> .gitignore`));
    console.log(chalk.gray('  2. Configure your app with the public key'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to generate keys:'), error.message);
    process.exit(1);
  }
}