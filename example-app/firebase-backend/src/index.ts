import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { updateRoutes } from './routes/updates';
import { bundleRoutes } from './routes/bundles';
import { analyticsRoutes } from './routes/analytics';
import { authMiddleware } from './middleware/auth';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1/updates', updateRoutes);
app.use('/api/v1/bundles', authMiddleware, bundleRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Export the API
export const api = functions.https.onRequest(app);

// Scheduled function to clean old bundles
export const cleanupOldBundles = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    
    // Delete bundles older than 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const oldBundles = await db.collection('bundles')
      .where('createdAt', '<', cutoffDate)
      .where('status', '!=', 'active')
      .get();
    
    for (const doc of oldBundles.docs) {
      const bundle = doc.data();
      
      // Delete from storage
      try {
        await storage.bucket()
          .file(`bundles/${bundle.channel}/${bundle.bundleId}/bundle.zip`)
          .delete();
      } catch (error) {
        console.error(`Failed to delete bundle file: ${error}`);
      }
      
      // Delete from Firestore
      await doc.ref.delete();
    }
    
    console.log(`Cleaned up ${oldBundles.size} old bundles`);
  });

// Function to process bundle after upload
export const processBundleUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name?.startsWith('temp/')) {
      return;
    }
    
    const db = admin.firestore();
    const uploadId = object.name.split('/')[1];
    
    // Get upload metadata
    const uploadDoc = await db.collection('uploads').doc(uploadId).get();
    if (!uploadDoc.exists) {
      console.error(`Upload document not found: ${uploadId}`);
      return;
    }
    
    const uploadData = uploadDoc.data()!;
    
    // Move file to permanent location
    const bucket = admin.storage().bucket();
    const tempFile = bucket.file(object.name);
    const permanentPath = `bundles/${uploadData.channel}/${uploadData.bundleId}/bundle.zip`;
    
    await tempFile.move(permanentPath);
    
    // Update bundle document
    await db.collection('bundles').doc(uploadData.bundleId).update({
      status: 'ready',
      storageUrl: permanentPath,
      size: object.size,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Clean up upload document
    await uploadDoc.ref.delete();
    
    console.log(`Processed bundle: ${uploadData.bundleId}`);
  });