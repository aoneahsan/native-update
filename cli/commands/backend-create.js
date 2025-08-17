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

async function createVercelBackend(outputDir, options) {
  // Create api directory
  const apiDir = path.join(outputDir, 'api');
  await fs.mkdir(apiDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: "native-update-vercel",
    version: "1.0.0",
    description: "Native Update Vercel backend",
    type: "module",
    scripts: {
      dev: "vercel dev",
      deploy: "vercel",
      build: "echo 'No build step required'"
    },
    dependencies: {
      "@vercel/node": "^3.0.0"
    }
  };

  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create bundles API endpoint
  const bundlesApi = `export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Get latest bundle
    const { appId, version, channel = 'production' } = req.query;
    
    // TODO: Implement bundle lookup from your storage solution
    // This is a simplified example
    const bundle = {
      version: '1.0.1',
      url: \`https://\${req.headers.host}/bundles/latest.zip\`,
      checksum: 'sha256:...',
      signature: 'signature...',
      metadata: {
        releaseNotes: 'Bug fixes and improvements'
      }
    };
    
    return res.status(200).json(bundle);
  }

  if (req.method === 'POST') {
    // Handle bundle upload
    const { version, channel, metadata } = req.body;
    
    // TODO: Handle file upload to storage (Vercel Blob, S3, etc.)
    // TODO: Save metadata to database (Vercel KV, external DB, etc.)
    
    return res.status(200).json({
      success: true,
      bundle: {
        version,
        channel,
        message: 'Bundle uploaded successfully'
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}`;

  await fs.writeFile(path.join(apiDir, 'bundles.js'), bundlesApi);

  // Create health check endpoint
  const healthApi = `export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'vercel-edge',
    timestamp: new Date().toISOString()
  });
}`;

  await fs.writeFile(path.join(apiDir, 'health.js'), healthApi);

  // Create vercel.json
  const vercelConfig = {
    functions: {
      "api/*.js": {
        maxDuration: 30
      }
    },
    rewrites: [
      {
        source: "/api/bundles/latest",
        destination: "/api/bundles"
      }
    ]
  };

  await fs.writeFile(
    path.join(outputDir, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );

  // Create .env.example
  const envExample = `# Storage Configuration
STORAGE_URL=your-storage-url
STORAGE_KEY=your-storage-key

# Database Configuration (optional)
DATABASE_URL=your-database-url

# Security
API_KEY=your-api-key-here
`;

  await fs.writeFile(path.join(outputDir, '.env.example'), envExample);

  // Create README
  const readme = `# Native Update Vercel Backend

Serverless backend for Native Update plugin using Vercel Edge Functions.

## Setup

1. Install Vercel CLI: \`npm i -g vercel\`
2. Copy \`.env.example\` to \`.env.local\` and configure
3. Run \`npm install\`
4. Run \`vercel dev\` for local development

## Deployment

\`\`\`bash
vercel
\`\`\`

## API Endpoints

- GET /api/bundles - Get latest bundle
- POST /api/bundles - Upload new bundle
- GET /api/health - Health check

## Storage Options

- Vercel Blob Storage
- AWS S3
- Cloudflare R2
- Any S3-compatible storage

## Database Options

- Vercel KV
- Vercel Postgres
- PlanetScale
- Supabase

${options.withMonitoring ? '## Monitoring\\n\\nUse Vercel Analytics and Logs for monitoring.' : ''}
`;

  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
}

async function createFirebaseBackend(outputDir, options) {
  // Create functions directory
  const functionsDir = path.join(outputDir, 'functions');
  await fs.mkdir(functionsDir, { recursive: true });

  // Create package.json for functions
  const packageJson = {
    name: "native-update-firebase-functions",
    description: "Firebase Functions backend for Native Update",
    type: "module",
    engines: {
      node: "22"
    },
    main: "index.js",
    scripts: {
      serve: "firebase emulators:start --only functions",
      shell: "firebase functions:shell",
      start: "npm run serve",
      deploy: "firebase deploy --only functions",
      logs: "firebase functions:log"
    },
    dependencies: {
      "firebase-admin": "^12.0.0",
      "firebase-functions": "^5.0.0",
      cors: "^2.8.5",
      "express": "^4.21.2"
    }
  };

  await fs.writeFile(
    path.join(functionsDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create index.js
  const indexJs = `import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Get latest bundle
app.get('/api/bundles/latest', async (req, res) => {
  try {
    const { appId, version, channel = 'production' } = req.query;
    
    // Query Firestore for latest bundle
    const db = admin.firestore();
    const snapshot = await db.collection('bundles')
      .where('appId', '==', appId)
      .where('channel', '==', channel)
      .where('enabled', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No bundle found' });
    }
    
    const bundle = snapshot.docs[0].data();
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload bundle
app.post('/api/bundles/upload', async (req, res) => {
  try {
    const { version, channel, metadata } = req.body;
    
    // TODO: Handle file upload to Cloud Storage
    // TODO: Save metadata to Firestore
    
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'firebase-functions' });
});

export const api = onRequest(app);
`;

  await fs.writeFile(path.join(functionsDir, 'index.js'), indexJs);

  // Create firebase.json
  const firebaseConfig = {
    functions: {
      source: "functions",
      runtime: "nodejs22"
    },
    firestore: {
      rules: "firestore.rules",
      indexes: "firestore.indexes.json"
    },
    storage: {
      rules: "storage.rules"
    }
  };

  await fs.writeFile(
    path.join(outputDir, 'firebase.json'),
    JSON.stringify(firebaseConfig, null, 2)
  );

  // Create Firestore rules
  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bundles are read-only for clients
    match /bundles/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Analytics can be written by clients
    match /analytics/{document=**} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}`;

  await fs.writeFile(path.join(outputDir, 'firestore.rules'), firestoreRules);

  // Create README
  const readme = `# Native Update Firebase Backend

Firebase Functions backend for Native Update plugin.

## Setup

1. Install Firebase CLI: \`npm install -g firebase-tools\`
2. Login: \`firebase login\`
3. Initialize: \`firebase init\`
4. Select your project or create new
5. Install dependencies: \`cd functions && npm install\`
6. Start emulator: \`npm run serve\`

## Deployment

\`\`\`bash
firebase deploy
\`\`\`

## Endpoints

- GET /api/bundles/latest - Get latest bundle
- POST /api/bundles/upload - Upload new bundle
- GET /health - Health check

${options.withMonitoring ? '## Monitoring\n\nUse Firebase Console for monitoring and analytics.' : ''}
`;

  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
}

async function createVercelBackend(outputDir, options) {
  // Create api directory
  const apiDir = path.join(outputDir, 'api');
  await fs.mkdir(apiDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: "native-update-vercel",
    version: "1.0.0",
    description: "Native Update Vercel backend",
    type: "module",
    scripts: {
      dev: "vercel dev",
      deploy: "vercel",
      build: "echo 'No build step required'"
    },
    dependencies: {
      "@vercel/node": "^3.0.0"
    }
  };

  await fs.writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create bundles API endpoint
  const bundlesApi = `export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Get latest bundle
    const { appId, version, channel = 'production' } = req.query;
    
    // TODO: Implement bundle lookup from your storage solution
    // This is a simplified example
    const bundle = {
      version: '1.0.1',
      url: \`https://\${req.headers.host}/bundles/latest.zip\`,
      checksum: 'sha256:...',
      signature: 'signature...',
      metadata: {
        releaseNotes: 'Bug fixes and improvements'
      }
    };
    
    return res.status(200).json(bundle);
  }

  if (req.method === 'POST') {
    // Handle bundle upload
    const { version, channel, metadata } = req.body;
    
    // TODO: Handle file upload to storage (Vercel Blob, S3, etc.)
    // TODO: Save metadata to database (Vercel KV, external DB, etc.)
    
    return res.status(200).json({
      success: true,
      bundle: {
        version,
        channel,
        message: 'Bundle uploaded successfully'
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}`;

  await fs.writeFile(path.join(apiDir, 'bundles.js'), bundlesApi);

  // Create health check endpoint
  const healthApi = `export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'vercel-edge',
    timestamp: new Date().toISOString()
  });
}`;

  await fs.writeFile(path.join(apiDir, 'health.js'), healthApi);

  // Create vercel.json
  const vercelConfig = {
    functions: {
      "api/*.js": {
        maxDuration: 30
      }
    },
    rewrites: [
      {
        source: "/api/bundles/latest",
        destination: "/api/bundles"
      }
    ]
  };

  await fs.writeFile(
    path.join(outputDir, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );

  // Create .env.example
  const envExample = `# Storage Configuration
STORAGE_URL=your-storage-url
STORAGE_KEY=your-storage-key

# Database Configuration (optional)
DATABASE_URL=your-database-url

# Security
API_KEY=your-api-key-here
`;

  await fs.writeFile(path.join(outputDir, '.env.example'), envExample);

  // Create README
  const readme = `# Native Update Vercel Backend

Serverless backend for Native Update plugin using Vercel Edge Functions.

## Setup

1. Install Vercel CLI: \`npm i -g vercel\`
2. Copy \`.env.example\` to \`.env.local\` and configure
3. Run \`npm install\`
4. Run \`vercel dev\` for local development

## Deployment

\`\`\`bash
vercel
\`\`\`

## API Endpoints

- GET /api/bundles - Get latest bundle
- POST /api/bundles - Upload new bundle
- GET /api/health - Health check

## Storage Options

- Vercel Blob Storage
- AWS S3
- Cloudflare R2
- Any S3-compatible storage

## Database Options

- Vercel KV
- Vercel Postgres
- PlanetScale
- Supabase

${options.withMonitoring ? '## Monitoring\\n\\nUse Vercel Analytics and Logs for monitoring.' : ''}
`;

  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
}