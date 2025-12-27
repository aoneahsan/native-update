import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Setup file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Check for updates
app.get('/api/updates/check', async (req, res) => {
  try {
    const { version, channel = 'production' } = req.query;

    // Get latest bundle for channel
    const snapshot = await db
      .collection('bundles')
      .where('channel', '==', channel)
      .where('active', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        available: false,
        message: 'No updates available',
      });
    }

    const latestBundle = snapshot.docs[0].data();
    const updateAvailable = latestBundle.version !== version;

    res.json({
      available: updateAvailable,
      latestVersion: latestBundle.version,
      downloadUrl: latestBundle.downloadUrl,
      size: latestBundle.size,
      releaseNotes: latestBundle.releaseNotes || 'Bug fixes and improvements',
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ error: 'Failed to check for updates' });
  }
});

// Upload bundle
app.post('/api/bundles/upload', upload.single('bundle'), async (req, res) => {
  try {
    const { version, channel = 'production', releaseNotes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bundleId = `bundle-${Date.now()}`;
    const filePath = `bundles/${channel}/${bundleId}.zip`;

    // Upload to Firebase Storage
    const file = storage.file(filePath);
    await file.save(req.file.buffer, {
      metadata: {
        contentType: 'application/zip',
      },
    });

    // Make file public
    await file.makePublic();

    // Get download URL
    const downloadUrl = `https://storage.googleapis.com/${storage.name}/${filePath}`;

    // Save metadata to Firestore
    const bundleData = {
      id: bundleId,
      version,
      channel,
      downloadUrl,
      size: req.file.size,
      releaseNotes,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    };

    await db.collection('bundles').doc(bundleId).set(bundleData);

    res.json({
      success: true,
      bundle: bundleData,
      message: 'Bundle uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading bundle:', error);
    res.status(500).json({ error: 'Failed to upload bundle' });
  }
});

// List all bundles
app.get('/api/bundles', async (req, res) => {
  try {
    const snapshot = await db
      .collection('bundles')
      .orderBy('timestamp', 'desc')
      .get();

    const bundles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(bundles);
  } catch (error) {
    console.error('Error listing bundles:', error);
    res.status(500).json({ error: 'Failed to list bundles' });
  }
});

// Export the Cloud Function
export const api = functions.https.onRequest(app);
