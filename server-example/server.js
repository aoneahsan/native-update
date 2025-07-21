import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// In-memory database (use real database in production)
const bundles = new Map();
const channels = new Map([
  ['production', []],
  ['staging', []],
  ['development', []],
]);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check for updates
app.get('/api/v1/check', (req, res) => {
  const { channel = 'production', version, appId } = req.query;

  if (!version || !appId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Get bundles for channel
  const channelBundles = channels.get(channel) || [];

  // Find latest bundle
  const latestBundle = channelBundles
    .filter((b) => compareVersions(b.version, version) > 0)
    .sort((a, b) => compareVersions(b.version, a.version))[0];

  if (!latestBundle) {
    return res.json({ available: false });
  }

  res.json({
    available: true,
    version: latestBundle.version,
    url: `${getBaseUrl(req)}/api/v1/bundles/${latestBundle.id}/download`,
    mandatory: latestBundle.mandatory || false,
    notes: latestBundle.notes || '',
    size: latestBundle.size,
    checksum: latestBundle.checksum,
    signature: latestBundle.signature,
    minNativeVersion: latestBundle.minNativeVersion,
  });
});

// Upload bundle
app.post('/api/v1/bundles', upload.single('file'), async (req, res) => {
  // Check authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const {
    version,
    channel = 'production',
    notes,
    mandatory,
    minNativeVersion,
  } = req.body;

  if (!version) {
    return res.status(400).json({ error: 'Version is required' });
  }

  try {
    // Calculate checksum
    const fileBuffer = await fs.readFile(req.file.path);
    const checksum = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Generate signature if private key is available
    let signature = '';
    if (process.env.SIGNING_PRIVATE_KEY_PATH) {
      try {
        const privateKey = await fs.readFile(
          process.env.SIGNING_PRIVATE_KEY_PATH,
          'utf8'
        );
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(fileBuffer);
        signature = sign.sign(privateKey, 'base64');
      } catch (err) {
        console.error('Failed to sign bundle:', err);
      }
    }

    // Create bundle record
    const bundle = {
      id: `bundle-${Date.now()}`,
      version,
      channel,
      notes,
      mandatory: mandatory === 'true',
      minNativeVersion,
      checksum: `sha256:${checksum}`,
      signature,
      size: req.file.size,
      filename: req.file.filename,
      uploadedAt: new Date().toISOString(),
      downloadCount: 0,
    };

    // Store bundle
    bundles.set(bundle.id, bundle);

    // Add to channel
    const channelBundles = channels.get(channel) || [];
    channelBundles.push(bundle);
    channels.set(channel, channelBundles);

    res.json({
      id: bundle.id,
      version: bundle.version,
      checksum: bundle.checksum,
      signature: bundle.signature,
      size: bundle.size,
    });
  } catch (error) {
    console.error('Failed to process bundle:', error);
    res.status(500).json({ error: 'Failed to process bundle' });
  }
});

// Download bundle
app.get('/api/v1/bundles/:bundleId/download', async (req, res) => {
  const bundle = bundles.get(req.params.bundleId);

  if (!bundle) {
    return res.status(404).json({ error: 'Bundle not found' });
  }

  // Increment download count
  bundle.downloadCount++;

  const filePath = path.join(__dirname, 'uploads', bundle.filename);

  try {
    await fs.access(filePath);
    res.download(filePath, `bundle-${bundle.version}.zip`);
  } catch (error) {
    res.status(404).json({ error: 'Bundle file not found' });
  }
});

// Get bundle info
app.get('/api/v1/bundles/:bundleId', (req, res) => {
  const bundle = bundles.get(req.params.bundleId);

  if (!bundle) {
    return res.status(404).json({ error: 'Bundle not found' });
  }

  res.json(bundle);
});

// Get statistics
app.get('/api/v1/stats', (req, res) => {
  const stats = {
    totalBundles: bundles.size,
    bundlesByChannel: {},
    downloadsByVersion: {},
    activeVersions: [],
    totalDownloads: 0,
  };

  // Calculate statistics
  for (const [channel, channelBundles] of channels) {
    stats.bundlesByChannel[channel] = channelBundles.length;
  }

  for (const bundle of bundles.values()) {
    stats.downloadsByVersion[bundle.version] = bundle.downloadCount;
    stats.totalDownloads += bundle.downloadCount;
    if (bundle.downloadCount > 0) {
      stats.activeVersions.push(bundle.version);
    }
  }

  res.json(stats);
});

// Utility functions
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

function getBaseUrl(req) {
  if (process.env.CDN_URL) {
    return process.env.CDN_URL;
  }
  return `${req.protocol}://${req.get('host')}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`Update server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});
