import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import prompts from 'prompts';

export async function init(options) {
  console.log(chalk.blue('🚀 Initializing Native Update in your project...'));

  try {
    // Check if already initialized
    try {
      await fs.access('./native-update.config.js');
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Config file already exists. Overwrite?',
        initial: false
      });
      
      if (!overwrite) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    } catch {
      // File doesn't exist, good
    }

    // Prompt for configuration
    const config = await prompts([
      {
        type: 'text',
        name: 'appId',
        message: 'App ID (e.g., com.example.app):',
        validate: value => value.length > 0
      },
      {
        type: 'text',
        name: 'serverUrl',
        message: 'Update server URL:',
        initial: 'https://your-update-server.com'
      },
      {
        type: 'select',
        name: 'channel',
        message: 'Default update channel:',
        choices: [
          { title: 'Production', value: 'production' },
          { title: 'Staging', value: 'staging' },
          { title: 'Development', value: 'development' }
        ]
      },
      {
        type: 'confirm',
        name: 'autoUpdate',
        message: 'Enable automatic updates?',
        initial: true
      }
    ]);

    // Create config file
    const configContent = `export default {
  appId: '${config.appId}',
  serverUrl: '${config.serverUrl}',
  channel: '${config.channel}',
  autoUpdate: ${config.autoUpdate},
  
  // Security
  publicKey: \`-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----\`,
  
  // Update behavior
  updateStrategy: 'immediate', // immediate, on-app-start, on-app-resume
  checkInterval: 60 * 60 * 1000, // 1 hour
  
  // Optional callbacks
  onUpdateAvailable: (update) => {
    console.log('Update available:', update.version);
  },
  
  onUpdateDownloaded: (update) => {
    console.log('Update downloaded:', update.version);
  },
  
  onUpdateFailed: (error) => {
    console.error('Update failed:', error);
  }
};
`;

    await fs.writeFile('./native-update.config.js', configContent);

    // Create example integration if requested
    if (options.example) {
      const exampleCode = `import { NativeUpdate } from 'native-update';
import config from './native-update.config.js';

// Initialize on app start
export async function initializeUpdates() {
  try {
    // Configure the plugin
    await NativeUpdate.configure(config);
    
    // Check for updates
    const update = await NativeUpdate.checkForUpdate();
    
    if (update.available) {
      console.log(\`Update available: \${update.version}\`);
      
      // Download in background
      await NativeUpdate.downloadUpdate();
      
      // Apply on next restart
      await NativeUpdate.installOnNextRestart();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

// Call this in your app initialization
initializeUpdates();
`;

      await fs.writeFile('./native-update-example.js', exampleCode);
      console.log(chalk.gray('  Created: native-update-example.js'));
    }

    console.log(chalk.green('✅ Native Update initialized successfully!'));
    console.log('');
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('  1. Generate signing keys:'));
    console.log(chalk.cyan('     npx native-update keys generate'));
    console.log(chalk.gray('  2. Add public key to native-update.config.js'));
    console.log(chalk.gray('  3. Import and use the config in your app'));
    
    if (options.backend !== 'custom') {
      console.log(chalk.gray(`  4. Create ${options.backend} backend:`));
      console.log(chalk.cyan(`     npx native-update backend create ${options.backend}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error.message);
    process.exit(1);
  }
}