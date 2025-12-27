import { Router } from 'express';
import * as admin from 'firebase-admin';
import { compareVersions } from '../utils/version';

const router = Router();
const db = admin.firestore();

// Check for updates
router.get('/check', async (req, res) => {
  try {
    const { channel = 'production', version, platform } = req.query;
    
    if (!version) {
      return res.status(400).json({ error: 'Version parameter required' });
    }
    
    // Get latest bundle for channel
    const bundlesSnapshot = await db.collection('bundles')
      .where('channel', '==', channel)
      .where('status', '==', 'active')
      .orderBy('version', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (bundlesSnapshot.empty) {
      return res.json({ 
        available: false,
        reason: 'No active bundles found' 
      });
    }
    
    const latestBundle = bundlesSnapshot.docs[0].data();
    const comparison = compareVersions(version as string, latestBundle.version);
    
    if (comparison < 0) {
      // Update available
      const bucket = admin.storage().bucket();
      const file = bucket.file(latestBundle.storageUrl);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600 * 1000 // 1 hour
      });
      
      res.json({
        available: true,
        version: latestBundle.version,
        url: url,
        checksum: latestBundle.checksum,
        signature: latestBundle.signature,
        notes: latestBundle.releaseNotes || '',
        size: latestBundle.size,
        mandatoryUpdate: latestBundle.mandatoryUpdate || false,
        minAppVersion: latestBundle.minAppVersion
      });
      
      // Log update check
      await db.collection('updateLogs').add({
        type: 'check',
        channel,
        currentVersion: version,
        availableVersion: latestBundle.version,
        platform,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      res.json({ 
        available: false,
        currentVersion: version,
        latestVersion: latestBundle.version
      });
    }
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific bundle info
router.get('/bundle/:bundleId', async (req, res) => {
  try {
    const { bundleId } = req.params;
    
    const bundleDoc = await db.collection('bundles').doc(bundleId).get();
    
    if (!bundleDoc.exists) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    const bundle = bundleDoc.data()!;
    
    // Generate signed URL
    const bucket = admin.storage().bucket();
    const file = bucket.file(bundle.storageUrl);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600 * 1000
    });
    
    res.json({
      bundleId: bundleDoc.id,
      version: bundle.version,
      url: url,
      checksum: bundle.checksum,
      signature: bundle.signature,
      size: bundle.size,
      createdAt: bundle.createdAt
    });
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report update result
router.post('/report', async (req, res) => {
  try {
    const { bundleId, status, error, downloadTime, platform } = req.body;
    
    await db.collection('updateLogs').add({
      type: 'update',
      bundleId,
      status,
      error,
      downloadTime,
      platform,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update bundle statistics
    if (status === 'success') {
      await db.collection('bundles').doc(bundleId).update({
        downloadCount: admin.firestore.FieldValue.increment(1),
        lastDownloadAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get app store version info
router.get('/app-version/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    
    const versionDoc = await db.collection('appVersions').doc(platform).get();
    
    if (!versionDoc.exists) {
      return res.status(404).json({ error: 'Version info not found' });
    }
    
    const versionInfo = versionDoc.data()!;
    
    res.json({
      currentVersion: versionInfo.currentVersion,
      minimumVersion: versionInfo.minimumVersion,
      storeUrl: versionInfo.storeUrl,
      updatePriority: versionInfo.updatePriority || 'normal'
    });
  } catch (error) {
    console.error('App version error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const updateRoutes = router;