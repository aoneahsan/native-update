import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import multer from 'multer';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
if (!existsSync('./bundles')) mkdirSync('./bundles');
if (!existsSync('./data')) mkdirSync('./data');

// Middleware
app.use(cors());
app.use(express.json());

// Storage for bundles
const storage = multer.diskStorage({
  destination: './bundles',
  filename: (req, file, cb) => {
    const version = req.body.version || Date.now();
    cb(null, `bundle-${version}.zip`);
  }
});

const upload = multer({ storage });

// In-memory database (use real DB in production)
let versions = {};
const versionsFile = './data/versions.json';

// Load existing versions
if (existsSync(versionsFile)) {
  versions = JSON.parse(readFileSync(versionsFile, 'utf8'));
}

// Save versions
function saveVersions() {
  writeFileSync(versionsFile, JSON.stringify(versions, null, 2));
}

// Routes
app.get('/api/v1/check', (req, res) => {
  const { version, channel = 'production', appId } = req.query;
  
  const key = `${appId}-${channel}`;
  const latest = versions[key];
  
  if (!latest) {
    return res.json({ updateAvailable: false });
  }
  
  res.json({
    updateAvailable: latest.version !== version,
    version: latest.version,
    downloadUrl: `${req.protocol}://${req.get('host')}/api/v1/bundles/${latest.bundleId}`,
    checksum: latest.checksum,
    size: latest.size,
    mandatory: latest.mandatory || false,
    releaseNotes: latest.releaseNotes || 'Bug fixes and improvements'
  });
});

app.post('/api/v1/bundles', upload.single('bundle'), (req, res) => {
  const { version, channel = 'production', appId, mandatory, releaseNotes } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No bundle file provided' });
  }
  
  // Calculate checksum
  const bundleData = readFileSync(req.file.path);
  const checksum = crypto.createHash('sha256').update(bundleData).digest('hex');
  
  const bundleId = req.file.filename;
  const key = `${appId}-${channel}`;
  
  versions[key] = {
    version,
    bundleId,
    checksum,
    size: req.file.size,
    mandatory: mandatory === 'true',
    releaseNotes,
    uploadedAt: new Date().toISOString()
  };
  
  saveVersions();
  
  res.json({
    success: true,
    version,
    bundleId,
    checksum
  });
});

app.get('/api/v1/bundles/:bundleId', (req, res) => {
  const bundlePath = join('./bundles', req.params.bundleId);
  
  if (!existsSync(bundlePath)) {
    return res.status(404).json({ error: 'Bundle not found' });
  }
  
  res.sendFile(bundlePath, { root: '.' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Update server running on http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log(`- GET  /api/v1/check`);
  console.log(`- POST /api/v1/bundles`);
  console.log(`- GET  /api/v1/bundles/:bundleId`);
  console.log(`- GET  /health`);
});