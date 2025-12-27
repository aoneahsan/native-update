import { Router } from 'express';
import * as admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { adminOnly, AuthRequest } from '../middleware/auth';
import { validateBundle } from '../utils/validation';
import crypto from 'crypto';

const router = Router();
const db = admin.firestore();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Create new bundle
router.post('/', adminOnly, upload.single('bundle'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Bundle file required' });
    }
    
    const { version, channel = 'production', releaseNotes, mandatoryUpdate = false, minAppVersion } = req.body;
    
    if (!version) {
      return res.status(400).json({ error: 'Version required' });
    }
    
    // Validate bundle
    const validation = await validateBundle(req.file.buffer);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid bundle', 
        details: validation.errors 
      });
    }
    
    // Calculate checksum
    const checksum = crypto.createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');
    
    const bundleId = uuidv4();
    const uploadId = uuidv4();
    
    // Create upload record
    await db.collection('uploads').doc(uploadId).set({
      bundleId,
      channel,
      version,
      createdBy: req.user!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Upload to temporary storage
    const bucket = admin.storage().bucket();
    const tempPath = `temp/${uploadId}/bundle.zip`;
    const file = bucket.file(tempPath);
    
    await file.save(req.file.buffer, {
      metadata: {
        contentType: 'application/zip',
        metadata: {
          bundleId,
          version,
          channel
        }
      }
    });
    
    // Create bundle document
    await db.collection('bundles').doc(bundleId).set({
      bundleId,
      version,
      channel,
      releaseNotes,
      mandatoryUpdate,
      minAppVersion,
      checksum,
      size: req.file.size,
      status: 'processing',
      createdBy: req.user!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ 
      bundleId,
      status: 'processing',
      message: 'Bundle uploaded successfully' 
    });
  } catch (error) {
    console.error('Bundle upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List bundles
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { channel, limit = 20, offset = 0 } = req.query;
    
    let query = db.collection('bundles')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));
    
    if (channel) {
      query = query.where('channel', '==', channel);
    }
    
    const snapshot = await query.get();
    
    const bundles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ bundles });
  } catch (error) {
    console.error('List bundles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bundle status
router.patch('/:bundleId/status', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { bundleId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'deprecated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.collection('bundles').doc(bundleId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user!.uid
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete bundle
router.delete('/:bundleId', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { bundleId } = req.params;
    
    const bundleDoc = await db.collection('bundles').doc(bundleId).get();
    
    if (!bundleDoc.exists) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    const bundle = bundleDoc.data()!;
    
    // Delete from storage
    if (bundle.storageUrl) {
      const bucket = admin.storage().bucket();
      await bucket.file(bundle.storageUrl).delete();
    }
    
    // Delete from Firestore
    await bundleDoc.ref.delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bundle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign bundle
router.post('/:bundleId/sign', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { bundleId } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required' });
    }
    
    const bundleDoc = await db.collection('bundles').doc(bundleId).get();
    
    if (!bundleDoc.exists) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    const bundle = bundleDoc.data()!;
    
    // Get bundle file
    const bucket = admin.storage().bucket();
    const file = bucket.file(bundle.storageUrl);
    const [buffer] = await file.download();
    
    // Create signature
    const sign = crypto.createSign('SHA256');
    sign.update(buffer);
    sign.end();
    
    const signature = sign.sign(privateKey, 'base64');
    
    // Update bundle with signature
    await bundleDoc.ref.update({
      signature,
      signedAt: admin.firestore.FieldValue.serverTimestamp(),
      signedBy: req.user!.uid
    });
    
    res.json({ signature });
  } catch (error) {
    console.error('Sign bundle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const bundleRoutes = router;