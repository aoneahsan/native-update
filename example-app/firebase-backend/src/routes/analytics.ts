import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Track event
router.post('/track', async (req, res) => {
  try {
    const { eventName, properties = {}, appId, platform, version } = req.body;
    
    if (!eventName) {
      return res.status(400).json({ error: 'Event name required' });
    }
    
    await db.collection('analytics').add({
      eventName,
      properties,
      appId,
      platform,
      version,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, appId } = req.query;
    
    let query = db.collection('analytics').orderBy('timestamp', 'desc');
    
    if (appId) {
      query = query.where('appId', '==', appId);
    }
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate as string));
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate as string));
    }
    
    const snapshot = await query.limit(1000).get();
    
    // Calculate summary
    const summary = {
      totalEvents: snapshot.size,
      eventCounts: {} as Record<string, number>,
      platformBreakdown: {} as Record<string, number>,
      updateMetrics: {
        checks: 0,
        downloads: 0,
        successes: 0,
        failures: 0
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Event counts
      summary.eventCounts[data.eventName] = (summary.eventCounts[data.eventName] || 0) + 1;
      
      // Platform breakdown
      if (data.platform) {
        summary.platformBreakdown[data.platform] = (summary.platformBreakdown[data.platform] || 0) + 1;
      }
      
      // Update metrics
      switch (data.eventName) {
        case 'update_check':
          summary.updateMetrics.checks++;
          break;
        case 'update_download':
          summary.updateMetrics.downloads++;
          break;
        case 'update_success':
          summary.updateMetrics.successes++;
          break;
        case 'update_failure':
          summary.updateMetrics.failures++;
          break;
      }
    });
    
    res.json(summary);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get update performance metrics
router.get('/performance', async (req, res) => {
  try {
    const logsSnapshot = await db.collection('updateLogs')
      .where('type', '==', 'update')
      .where('status', '==', 'success')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    let totalDownloadTime = 0;
    let count = 0;
    
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.downloadTime) {
        totalDownloadTime += data.downloadTime;
        count++;
      }
    });
    
    const averageDownloadTime = count > 0 ? totalDownloadTime / count : 0;
    
    // Get bundle statistics
    const bundlesSnapshot = await db.collection('bundles')
      .where('status', '==', 'active')
      .get();
    
    const bundleStats = {
      totalBundles: bundlesSnapshot.size,
      totalDownloads: 0,
      averageSize: 0
    };
    
    let totalSize = 0;
    bundlesSnapshot.forEach(doc => {
      const data = doc.data();
      bundleStats.totalDownloads += data.downloadCount || 0;
      totalSize += data.size || 0;
    });
    
    bundleStats.averageSize = bundlesSnapshot.size > 0 ? totalSize / bundlesSnapshot.size : 0;
    
    res.json({
      averageDownloadTime,
      bundleStats,
      successRate: count > 0 ? (count / logsSnapshot.size) * 100 : 0
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const snapshot = await db.collection('analytics')
      .orderBy('timestamp', 'desc')
      .limit(10000)
      .get();
    
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } else {
      res.json({ analytics: data });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');
  
  return csv;
}

export const analyticsRoutes = router;