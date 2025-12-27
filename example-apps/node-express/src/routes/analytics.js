import express from 'express';
import { db, statements } from '../database/init.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Record an analytics event
 * POST /api/analytics/event
 */
router.post('/event', async (req, res, next) => {
  try {
    const {
      appId,
      eventType,
      version,
      platform,
      deviceId,
      sessionId,
      metadata,
    } = req.body;

    // Validate required fields
    if (!appId || !eventType) {
      return res.status(400).json({ 
        error: 'Missing required fields: appId and eventType' 
      });
    }

    // Record event
    statements.recordEvent.run({
      app_id: appId,
      event_type: eventType,
      version: version || null,
      platform: platform || null,
      device_id: deviceId || null,
      session_id: sessionId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    res.json({ success: true });

    // Log significant events
    if (['update_failed', 'rollback', 'crash'].includes(eventType)) {
      logger.warn('Significant analytics event', {
        appId,
        eventType,
        version,
        metadata,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Get analytics dashboard data
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const { appId, days = 7 } = req.query;

    // Overall statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'update_check' THEN 1 END) as update_checks,
        COUNT(CASE WHEN event_type = 'update_downloaded' THEN 1 END) as downloads,
        COUNT(CASE WHEN event_type = 'update_installed' THEN 1 END) as installs,
        COUNT(CASE WHEN event_type = 'update_failed' THEN 1 END) as failures
      FROM events
      WHERE created_at > datetime('now', '-' || ? || ' days')
      ${appId ? 'AND app_id = ?' : ''}
    `).get(days, ...(appId ? [appId] : []));

    // Daily breakdown
    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT device_id) as devices,
        COUNT(CASE WHEN event_type = 'update_check' THEN 1 END) as checks,
        COUNT(CASE WHEN event_type = 'update_downloaded' THEN 1 END) as downloads,
        COUNT(CASE WHEN event_type = 'update_installed' THEN 1 END) as installs
      FROM events
      WHERE created_at > datetime('now', '-' || ? || ' days')
      ${appId ? 'AND app_id = ?' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all(days, ...(appId ? [appId] : []));

    // Version adoption
    const versionStats = db.prepare(`
      SELECT 
        version,
        COUNT(DISTINCT device_id) as devices,
        COUNT(*) as events
      FROM events
      WHERE version IS NOT NULL
        AND created_at > datetime('now', '-' || ? || ' days')
        ${appId ? 'AND app_id = ?' : ''}
      GROUP BY version
      ORDER BY version DESC
    `).all(days, ...(appId ? [appId] : []));

    // Platform breakdown
    const platformStats = db.prepare(`
      SELECT 
        platform,
        COUNT(DISTINCT device_id) as devices,
        COUNT(*) as events
      FROM events
      WHERE platform IS NOT NULL
        AND created_at > datetime('now', '-' || ? || ' days')
        ${appId ? 'AND app_id = ?' : ''}
      GROUP BY platform
    `).all(days, ...(appId ? [appId] : []));

    // Recent errors
    const recentErrors = db.prepare(`
      SELECT 
        created_at,
        app_id,
        version,
        platform,
        metadata
      FROM events
      WHERE event_type IN ('update_failed', 'rollback', 'error')
        AND created_at > datetime('now', '-1 days')
        ${appId ? 'AND app_id = ?' : ''}
      ORDER BY created_at DESC
      LIMIT 50
    `).all(...(appId ? [appId] : []));

    // Update success rate
    const successRate = stats.installs && stats.downloads
      ? Math.round((stats.installs / stats.downloads) * 100)
      : 0;

    res.json({
      period: `${days} days`,
      stats: {
        ...stats,
        successRate,
      },
      dailyStats,
      versionStats,
      platformStats,
      recentErrors: recentErrors.map(e => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get event stream for real-time monitoring
 * GET /api/analytics/stream
 */
router.get('/stream', authenticate, async (req, res, next) => {
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection
  res.write('data: {"type":"connected"}\n\n');

  // Poll for new events
  let lastEventId = 0;
  const interval = setInterval(() => {
    try {
      const newEvents = db.prepare(`
        SELECT * FROM events 
        WHERE id > ? 
        ORDER BY id ASC 
        LIMIT 10
      `).all(lastEventId);

      if (newEvents.length > 0) {
        lastEventId = newEvents[newEvents.length - 1].id;
        
        newEvents.forEach(event => {
          const data = {
            type: 'event',
            data: {
              ...event,
              metadata: event.metadata ? JSON.parse(event.metadata) : null,
            },
          };
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        });
      }
    } catch (error) {
      logger.error('Analytics stream error', error);
    }
  }, 1000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * Export analytics data
 * GET /api/analytics/export
 */
router.get('/export', authenticate, async (req, res, next) => {
  try {
    const { appId, startDate, endDate, format = 'json' } = req.query;

    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (appId) {
      query += ' AND app_id = ?';
      params.push(appId);
    }
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC';

    const events = db.prepare(query).all(...params);

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        'timestamp,app_id,event_type,version,platform,device_id,session_id,metadata',
        ...events.map(e => 
          `"${e.created_at}","${e.app_id}","${e.event_type}","${e.version || ''}","${e.platform || ''}","${e.device_id || ''}","${e.session_id || ''}","${e.metadata || ''}"`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
      res.send(csv);
    } else {
      // JSON format
      res.json({
        exportDate: new Date().toISOString(),
        count: events.length,
        events: events.map(e => ({
          ...e,
          metadata: e.metadata ? JSON.parse(e.metadata) : null,
        })),
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;