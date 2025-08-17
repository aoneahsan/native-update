import chalk from 'chalk';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startServer(options) {
  console.log(chalk.blue('🚀 Starting development update server...'));

  const app = express();
  const port = parseInt(options.port);
  const bundleDir = path.resolve(options.dir);

  // Enable CORS if requested
  if (options.cors) {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  // Serve static files
  app.use('/bundles', express.static(bundleDir));

  // API endpoint to get latest bundle info
  app.get('/api/latest', async (req, res) => {
    try {
      const { channel = 'production' } = req.query;
      
      // Find all metadata files
      const files = await fs.readdir(bundleDir);
      const metadataFiles = files.filter(f => f.endsWith('.json') && f.startsWith('bundle-'));
      
      // Read and parse all metadata
      const bundles = await Promise.all(
        metadataFiles.map(async (file) => {
          const content = await fs.readFile(path.join(bundleDir, file), 'utf-8');
          return JSON.parse(content);
        })
      );

      // Filter by channel and sort by version
      const channelBundles = bundles.filter(b => b.channel === channel);
      const latest = channelBundles.sort((a, b) => 
        b.created.localeCompare(a.created)
      )[0];

      if (!latest) {
        return res.status(404).json({ error: 'No bundles found' });
      }

      // Add download URL
      latest.downloadUrl = `http://localhost:${port}/bundles/${latest.filename}`;
      
      res.json(latest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'native-update-dev' });
  });

  // List all bundles
  app.get('/api/bundles', async (req, res) => {
    try {
      const files = await fs.readdir(bundleDir);
      const bundles = files.filter(f => f.endsWith('.zip'));
      res.json({ bundles });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(port, () => {
    console.log(chalk.green(`✅ Server running at http://localhost:${port}`));
    console.log('');
    console.log(chalk.bold('Endpoints:'));
    console.log(chalk.gray(`  GET  /api/latest?channel=production - Get latest bundle`));
    console.log(chalk.gray(`  GET  /api/bundles - List all bundles`));
    console.log(chalk.gray(`  GET  /bundles/<filename> - Download bundle`));
    console.log(chalk.gray(`  GET  /health - Health check`));
    console.log('');
    console.log(chalk.yellow('Configure your app to use this server:'));
    console.log(chalk.cyan(`  serverUrl: 'http://localhost:${port}'`));
    console.log('');
    console.log(chalk.gray('Press Ctrl+C to stop'));
  });
}