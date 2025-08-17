import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createBundle(webDir, options) {
  console.log(chalk.blue('🔨 Creating update bundle...'));

  try {
    // Validate input directory
    const stats = await fs.stat(webDir);
    if (!stats.isDirectory()) {
      throw new Error(`${webDir} is not a directory`);
    }

    // Check for index.html
    const indexPath = path.join(webDir, 'index.html');
    try {
      await fs.access(indexPath);
    } catch {
      throw new Error(`No index.html found in ${webDir}. Is this a valid web build directory?`);
    }

    // Create output directory
    const outputDir = path.resolve(options.output);
    await fs.mkdir(outputDir, { recursive: true });

    // Get version
    let version = options.version;
    if (!version) {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        version = packageJson.version;
      } catch {
        version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      }
    }

    // Create bundle metadata
    const metadata = {
      version,
      channel: options.channel,
      created: new Date().toISOString(),
      platform: 'web',
      ...(options.metadata ? JSON.parse(options.metadata) : {})
    };

    const bundleId = `${version}-${Date.now()}`;
    const bundleFileName = `bundle-${bundleId}.zip`;
    const bundlePath = path.join(outputDir, bundleFileName);
    const metadataPath = path.join(outputDir, `bundle-${bundleId}.json`);

    console.log(chalk.gray(`  Version: ${version}`));
    console.log(chalk.gray(`  Channel: ${options.channel}`));
    console.log(chalk.gray(`  Output: ${bundlePath}`));

    // Create zip archive
    const output = createWriteStream(bundlePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    archive.pipe(output);

    // Add all files from web directory
    archive.directory(webDir, false);

    await archive.finalize();
    await archivePromise;

    // Calculate checksum
    const fileBuffer = await fs.readFile(bundlePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Update metadata with file info
    metadata.checksum = checksum;
    metadata.size = fileBuffer.length;
    metadata.filename = bundleFileName;

    // Save metadata
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(chalk.green('✅ Bundle created successfully!'));
    console.log('');
    console.log(chalk.bold('Bundle Details:'));
    console.log(chalk.gray(`  File: ${bundlePath}`));
    console.log(chalk.gray(`  Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`));
    console.log(chalk.gray(`  Checksum: ${checksum}`));
    console.log(chalk.gray(`  Metadata: ${metadataPath}`));
    console.log('');
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('  1. Sign the bundle:'));
    console.log(chalk.cyan(`     npx native-update bundle sign ${bundlePath} --key ./keys/private.pem`));
    console.log(chalk.gray('  2. Upload to your update server'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to create bundle:'), error.message);
    process.exit(1);
  }
}