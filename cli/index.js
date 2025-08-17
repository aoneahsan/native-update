#!/usr/bin/env node

/**
 * Native Update CLI
 * 
 * Provides command-line tools for managing Capacitor Native Update plugin
 * Can be used with npx, global install, or local install
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

const program = new Command();

program
  .name('native-update')
  .description('CLI tools for Capacitor Native Update plugin')
  .version(packageJson.version);

// Bundle Management Commands
program
  .command('bundle')
  .description('Bundle management commands')
  .command('create <webDir>')
  .alias('create-bundle')
  .description('Create an update bundle from your web directory')
  .option('-o, --output <path>', 'Output directory for the bundle', './update-bundles')
  .option('-v, --version <version>', 'Bundle version (defaults to package.json version)')
  .option('-c, --channel <channel>', 'Release channel', 'production')
  .option('-m, --metadata <json>', 'Additional metadata as JSON string')
  .action(async (webDir, options) => {
    const { createBundle } = await import('./commands/bundle-create.js');
    await createBundle(webDir, options);
  });

program
  .command('bundle')
  .command('sign <bundlePath>')
  .alias('sign-bundle')
  .description('Sign an update bundle with your private key')
  .requiredOption('-k, --key <path>', 'Path to private key file')
  .option('-o, --output <path>', 'Output path for signed bundle')
  .action(async (bundlePath, options) => {
    const { signBundle } = await import('./commands/bundle-sign.js');
    await signBundle(bundlePath, options);
  });

program
  .command('bundle')
  .command('verify <bundlePath>')
  .alias('verify-bundle')
  .description('Verify a signed bundle with public key')
  .requiredOption('-k, --key <path>', 'Path to public key file')
  .action(async (bundlePath, options) => {
    const { verifyBundle } = await import('./commands/bundle-verify.js');
    await verifyBundle(bundlePath, options);
  });

// Key Management Commands
program
  .command('keys')
  .description('Key management commands')
  .command('generate')
  .alias('generate-keys')
  .description('Generate a new key pair for bundle signing')
  .option('-o, --output <dir>', 'Output directory for keys', './keys')
  .option('-t, --type <type>', 'Key type (rsa or ec)', 'rsa')
  .option('-s, --size <size>', 'Key size (RSA: 2048/4096, EC: 256/384)', '2048')
  .action(async (options) => {
    const { generateKeys } = await import('./commands/keys-generate.js');
    await generateKeys(options);
  });

// Server Commands
program
  .command('server')
  .description('Development server commands')
  .command('start')
  .alias('start-server')
  .description('Start a local update server for testing')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-d, --dir <dir>', 'Directory containing update bundles', './update-bundles')
  .option('--cors', 'Enable CORS for testing', true)
  .action(async (options) => {
    const { startServer } = await import('./commands/server-start.js');
    await startServer(options);
  });

// Init Commands
program
  .command('init')
  .description('Initialize native-update in your project')
  .option('--example', 'Include example configuration')
  .option('--backend <type>', 'Backend type (firebase, express, custom)', 'custom')
  .action(async (options) => {
    const { init } = await import('./commands/init.js');
    await init(options);
  });

// Backend Commands
program
  .command('backend')
  .description('Backend template commands')
  .command('create <type>')
  .alias('create-backend')
  .description('Create a backend template (express, firebase, vercel)')
  .option('-o, --output <dir>', 'Output directory', './native-update-backend')
  .option('--with-monitoring', 'Include monitoring setup', false)
  .option('--with-admin', 'Include admin dashboard', false)
  .action(async (type, options) => {
    const { createBackend } = await import('./commands/backend-create.js');
    await createBackend(type, options);
  });

// Config Commands
program
  .command('config')
  .description('Configuration commands')
  .command('check')
  .description('Validate your native-update configuration')
  .action(async () => {
    const { checkConfig } = await import('./commands/config-check.js');
    await checkConfig();
  });

// Migration Commands
program
  .command('migrate')
  .description('Migrate from other OTA solutions')
  .option('--from <solution>', 'Source solution (codepush, appflow)', 'codepush')
  .action(async (options) => {
    const { migrate } = await import('./commands/migrate.js');
    await migrate(options);
  });

// Monitoring Commands
program
  .command('monitor')
  .description('Monitor update deployments')
  .option('-s, --server <url>', 'Backend server URL')
  .option('-k, --key <key>', 'API key for authentication')
  .action(async (options) => {
    const { monitor } = await import('./commands/monitor.js');
    await monitor(options);
  });

// Add helpful examples
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('');
  console.log('  Quick Start:');
  console.log('    $ npx native-update init --example');
  console.log('    $ npx native-update backend create express --with-admin');
  console.log('');
  console.log('  Bundle Management:');
  console.log('    $ npx native-update bundle create ./www');
  console.log('    $ npx native-update bundle sign ./bundle.zip --key ./keys/private.pem');
  console.log('    $ npx native-update bundle verify ./bundle.zip --key ./keys/public.pem');
  console.log('');
  console.log('  Key Management:');
  console.log('    $ npx native-update keys generate --type rsa --size 4096');
  console.log('');
  console.log('  Development:');
  console.log('    $ npx native-update server start --port 3000');
  console.log('    $ npx native-update monitor --server http://localhost:3000');
  console.log('');
  console.log('  Backend Templates:');
  console.log('    $ npx native-update backend create express');
  console.log('    $ npx native-update backend create firebase --with-monitoring');
  console.log('    $ npx native-update backend create vercel --with-admin');
});

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error.code === 'commander.missingArgument') {
    console.error(chalk.red(`Error: ${error.message}`));
  } else if (error.code === 'commander.unknownCommand') {
    console.error(chalk.red(`Error: Unknown command`));
    program.outputHelp();
  } else {
    console.error(chalk.red(`Error: ${error.message}`));
  }
  process.exit(1);
}