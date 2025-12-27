import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup file upload
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'bundles'),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `bundle-${timestamp}.zip`);
  },
});
const upload = multer({ storage });

// Ensure bundles directory exists
const bundlesDir = path.join(__dirname, 'bundles');
await fs.mkdir(bundlesDir, { recursive: true });

// Metadata file for tracking bundles
const metadataFile = path.join(__dirname, 'metadata.json');

// Initialize metadata file if it doesn't exist
try {
  await fs.access(metadataFile);
} catch {
  await fs.writeFile(metadataFile, JSON.stringify({ bundles: [] }, null, 2));
}

// Helper to read/write metadata
async function getMetadata() {
  const data = await fs.readFile(metadataFile, 'utf-8');
  return JSON.parse(data);
}

async function saveMetadata(data) {
  await fs.writeFile(metadataFile, JSON.stringify(data, null, 2));
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check for updates
app.get('/api/updates/check', async (req, res) => {
  try {
    const { version, channel = 'production' } = req.query;
    const metadata = await getMetadata();

    // Get latest bundle for channel
    const latestBundle = metadata.bundles
      .filter((b) => b.channel === channel && b.active)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!latestBundle) {
      return res.json({
        available: false,
        message: 'No updates available',
      });
    }

    // Simple version comparison
    const updateAvailable = latestBundle.version !== version;

    res.json({
      available: updateAvailable,
      latestVersion: latestBundle.version,
      downloadUrl: `http://localhost:${PORT}/api/updates/download/${latestBundle.id}`,
      size: latestBundle.size,
      releaseNotes: latestBundle.releaseNotes || 'Bug fixes and improvements',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download bundle
app.get('/api/updates/download/:id', async (req, res) => {
  try {
    const metadata = await getMetadata();
    const bundle = metadata.bundles.find((b) => b.id === req.params.id);

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    const filePath = path.join(bundlesDir, bundle.filename);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new bundle (for testing)
app.post('/api/bundles/upload', upload.single('bundle'), async (req, res) => {
  try {
    const { version, channel = 'production', releaseNotes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const metadata = await getMetadata();
    const bundleId = `bundle-${Date.now()}`;

    const newBundle = {
      id: bundleId,
      version,
      channel,
      filename: req.file.filename,
      size: req.file.size,
      releaseNotes,
      timestamp: Date.now(),
      active: true,
    };

    metadata.bundles.push(newBundle);
    await saveMetadata(metadata);

    res.json({
      success: true,
      bundle: newBundle,
      message: 'Bundle uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all bundles
app.get('/api/bundles', async (req, res) => {
  try {
    const metadata = await getMetadata();
    res.json(metadata.bundles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Update server running on http://localhost:${PORT}`);
  console.log(`📦 Bundles directory: ${bundlesDir}`);
  console.log(`📝 Metadata file: ${metadataFile}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/updates/check?version=1.0.0&channel=production`);
  console.log(`  GET  /api/updates/download/:id`);
  console.log(`  POST /api/bundles/upload`);
  console.log(`  GET  /api/bundles`);
});
