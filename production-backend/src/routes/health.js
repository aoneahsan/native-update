import express from 'express';
import os from 'os';
import fs from 'fs/promises';
import { db } from '../database/init.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'capacitor-update-server',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * Detailed health check
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      },
      loadAverage: os.loadavg(),
    },
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
    checks: {},
  };

  // Check database connection
  try {
    const dbCheck = db.prepare('SELECT 1 as ok').get();
    checks.checks.database = {
      status: 'healthy',
      connected: true,
    };

    // Get database stats
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM updates) as updates_count,
        (SELECT COUNT(*) FROM bundles) as bundles_count,
        (SELECT COUNT(*) FROM events WHERE created_at > datetime('now', '-1 hour')) as recent_events
    `).get();

    checks.checks.database.stats = stats;
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      connected: false,
      error: error.message,
    };
    logger.error('Database health check failed', error);
  }

  // Check storage
  try {
    const storagePath = process.env.STORAGE_PATH || './storage/bundles';
    const storageStats = await fs.stat(storagePath);
    
    checks.checks.storage = {
      status: 'healthy',
      accessible: true,
      path: storagePath,
    };

    // Count bundle files
    const files = await fs.readdir(storagePath);
    checks.checks.storage.bundleCount = files.length;
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.storage = {
      status: 'unhealthy',
      accessible: false,
      error: error.message,
    };
    logger.error('Storage health check failed', error);
  }

  // Check logs directory
  try {
    const logPath = process.env.LOG_FILE ? 
      require('path').dirname(process.env.LOG_FILE) : './logs';
    await fs.access(logPath, fs.constants.W_OK);
    
    checks.checks.logging = {
      status: 'healthy',
      writable: true,
      path: logPath,
    };
  } catch (error) {
    checks.checks.logging = {
      status: 'degraded',
      writable: false,
      error: error.message,
    };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

/**
 * Prometheus-compatible metrics endpoint
 * GET /metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = [];

    // System metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP process_memory_heap_used_bytes Process heap memory used`);
    metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
    metrics.push(`process_memory_heap_used_bytes ${memUsage.heapUsed}`);

    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    metrics.push(`# TYPE process_uptime_seconds counter`);
    metrics.push(`process_uptime_seconds ${process.uptime()}`);

    // Database metrics
    const dbStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM updates) as updates_total,
        (SELECT COUNT(*) FROM bundles) as bundles_total,
        (SELECT COUNT(*) FROM events) as events_total,
        (SELECT COUNT(*) FROM download_stats) as downloads_total,
        (SELECT COUNT(*) FROM download_stats WHERE success = 1) as downloads_success
    `).get();

    metrics.push(`# HELP updates_total Total number of updates`);
    metrics.push(`# TYPE updates_total gauge`);
    metrics.push(`updates_total ${dbStats.updates_total}`);

    metrics.push(`# HELP bundles_total Total number of bundles`);
    metrics.push(`# TYPE bundles_total gauge`);
    metrics.push(`bundles_total ${dbStats.bundles_total}`);

    metrics.push(`# HELP events_total Total number of events`);
    metrics.push(`# TYPE events_total counter`);
    metrics.push(`events_total ${dbStats.events_total}`);

    metrics.push(`# HELP downloads_total Total number of downloads`);
    metrics.push(`# TYPE downloads_total counter`);
    metrics.push(`downloads_total ${dbStats.downloads_total}`);

    metrics.push(`# HELP downloads_success_total Total number of successful downloads`);
    metrics.push(`# TYPE downloads_success_total counter`);
    metrics.push(`downloads_success_total ${dbStats.downloads_success}`);

    // Recent activity metrics
    const recentActivity = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM events WHERE created_at > datetime('now', '-1 hour')) as events_hour,
        (SELECT COUNT(*) FROM download_stats WHERE downloaded_at > datetime('now', '-1 hour')) as downloads_hour
    `).get();

    metrics.push(`# HELP events_last_hour Events in the last hour`);
    metrics.push(`# TYPE events_last_hour gauge`);
    metrics.push(`events_last_hour ${recentActivity.events_hour}`);

    metrics.push(`# HELP downloads_last_hour Downloads in the last hour`);
    metrics.push(`# TYPE downloads_last_hour gauge`);
    metrics.push(`downloads_last_hour ${recentActivity.downloads_hour}`);

    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n'));
  } catch (error) {
    logger.error('Metrics generation failed', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

export default router;