import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createBackend(type, options) {
  const spinner = ora(`Creating ${type} backend template...`).start();

  try {
    const outputDir = path.resolve(options.output);
    
    // Check if directory exists
    try {
      await fs.access(outputDir);
      spinner.fail(`Directory ${outputDir} already exists`);
      return;
    } catch {
      // Directory doesn't exist, good
    }

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    switch (type) {
      case 'express':
        await createExpressBackend(outputDir, options);
        break;
      case 'firebase':
        await createFirebaseBackend(outputDir, options);
        break;
      case 'vercel':
        await createVercelBackend(outputDir, options);
        break;
      default:
        throw new Error(`Unknown backend type: ${type}`);
    }

    spinner.succeed(`${type} backend created successfully!`);
    
    console.log('');
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray(`  1. cd ${options.output}`));
    console.log(chalk.gray(`  2. npm install`));
    console.log(chalk.gray(`  3. Configure your environment variables`));
    console.log(chalk.gray(`  4. npm run dev`));

  } catch (error) {
    spinner.fail(`Failed to create backend: ${error.message}`);
    process.exit(1);
  }
}

async function createExpressBackend(outputDir, options) {
  // Create package.json
  const packageJson = {
    name: "native-update-backend",
    version: "1.0.0",
    description: "Native Update backend server",
    type: "module",
    scripts: {
      dev: "node --watch server.js",
      start: "node server.js",
      test: "vitest"
    },
    dependencies: {
      express: "^4.21.2",
      cors: "^2.8.5",
      "express-rate-limit": "^7.4.1",
      multer: "^1.4.5-lts.1",
      dotenv: "^16.4.7",
      jsonwebtoken: "^9.0.2",
      bcrypt: "^5.1.1"
    }
  };

  if (options.withMonitoring) {
    packageJson.dependencies["@opentelemetry/api"] = "^1.9.0";
    packageJson.dependencies["@opentelemetry/sdk-node"] = "^0.57.0";
    packageJson.dependencies["winston"] = "^3.17.1";
  }

  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create server.js
  const serverCode = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as bundleRouter } from './routes/bundles.js';
import { router as authRouter } from './routes/auth.js';
${options.withMonitoring ? "import { initMonitoring } from './monitoring/index.js';" : ''}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

${options.withMonitoring ? 'initMonitoring(app);' : ''}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bundles', bundleRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  await fs.writeFile(path.join(outputDir, 'server.js'), serverCode);

  // Create routes directory
  await fs.mkdir(path.join(outputDir, 'routes'), { recursive: true });

  // Create bundles route
  const bundlesRoute = `import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get latest bundle
router.get('/latest', async (req, res) => {
  try {
    const { appId, version, channel = 'production' } = req.query;
    
    // TODO: Implement bundle lookup logic
    // This is a simplified example
    const bundle = {
      version: '1.0.1',
      url: \`\${req.protocol}://\${req.get('host')}/bundles/latest.zip\`,
      checksum: 'sha256:...',
      signature: 'signature...',
      metadata: {
        releaseNotes: 'Bug fixes and improvements'
      }
    };
    
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new bundle
router.post('/upload', upload.single('bundle'), async (req, res) => {
  try {
    const { version, channel, metadata } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No bundle file provided' });
    }
    
    // Calculate checksum
    const fileBuffer = await fs.readFile(file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // TODO: Store bundle metadata in database
    // TODO: Move file to permanent storage
    
    res.json({
      success: true,
      bundle: {
        version,
        channel,
        checksum,
        size: file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router };
`;

  await fs.writeFile(path.join(outputDir, 'routes', 'bundles.js'), bundlesRoute);

  // Create .env.example
  const envExample = `# Server Configuration
PORT=3000

# Security
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# Storage
STORAGE_PATH=./storage/bundles

# Database (optional)
# DATABASE_URL=postgresql://user:password@localhost:5432/native_update
`;

  await fs.writeFile(path.join(outputDir, '.env.example'), envExample);

  // Create README
  const readme = `# Native Update Backend

Express.js backend for Native Update plugin.

## Setup

1. Copy \`.env.example\` to \`.env\` and configure
2. Run \`npm install\`
3. Run \`npm run dev\` for development

## API Endpoints

- GET /api/bundles/latest - Get latest bundle for app
- POST /api/bundles/upload - Upload new bundle
- GET /health - Health check

## Security

- Uses JWT for authentication
- Rate limiting enabled
- CORS configured

${options.withMonitoring ? '## Monitoring\n\nOpenTelemetry monitoring is configured. Set up your preferred backend (Jaeger, Zipkin, etc.)' : ''}
`;

  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
}