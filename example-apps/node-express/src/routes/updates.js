import express from 'express';
import { nanoid } from 'nanoid';
import semver from 'semver';
import { db, statements } from '../database/init.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUpdate } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Check for updates
 * GET /api/updates/check/:appId/:platform/:currentVersion
 */
router.get('/check/:appId/:platform/:currentVersion', async (req, res, next) => {
  try {
    const { appId, platform, currentVersion } = req.params;
    const { channel = 'production' } = req.query;

    // Validate version format
    if (!semver.valid(currentVersion)) {
      return res.status(400).json({ 
        error: 'Invalid version format',
        updateAvailable: false 
      });
    }

    // Get latest update
    const update = statements.getLatestUpdate.get({
      app_id: appId,
      platform: platform.toLowerCase(),
      channel,
      current_version: currentVersion,
    });

    if (!update) {
      return res.json({ 
        updateAvailable: false,
        currentVersion 
      });
    }

    // Check if update should be shown based on rollout percentage
    const deviceHash = req.get('X-Device-ID') || req.ip;
    const rolloutHash = hashCode(deviceHash + update.id) % 100;
    
    if (rolloutHash >= update.rollout_percentage) {
      return res.json({ 
        updateAvailable: false,
        currentVersion 
      });
    }

    // Check min/max app version constraints
    const appVersion = req.get('X-App-Version');
    if (appVersion) {
      if (update.min_app_version && semver.lt(appVersion, update.min_app_version)) {
        return res.json({ 
          updateAvailable: false,
          currentVersion,
          requiresAppUpdate: true 
        });
      }
      if (update.max_app_version && semver.gt(appVersion, update.max_app_version)) {
        return res.json({ 
          updateAvailable: false,
          currentVersion 
        });
      }
    }

    // Return update information
    res.json({
      updateAvailable: true,
      currentVersion,
      update: {
        version: update.version,
        description: update.description,
        releaseNotes: update.release_notes,
        mandatory: Boolean(update.mandatory),
        downloadUrl: update.download_url,
        checksum: update.checksum,
        signature: update.signature,
        size: update.file_size,
      },
    });

    // Log the check event
    logger.info('Update check', {
      appId,
      platform,
      currentVersion,
      updateAvailable: true,
      updateVersion: update.version,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new update
 * POST /api/updates/create
 */
router.post('/create', authenticate, authorize('write'), validateUpdate, async (req, res, next) => {
  try {
    const updateId = nanoid();
    const {
      appId,
      platform,
      version,
      channel = 'production',
      minAppVersion,
      maxAppVersion,
      description,
      releaseNotes,
      mandatory = false,
      rolloutPercentage = 100,
    } = req.body;

    // Check if update already exists
    const existing = db.prepare(
      'SELECT id FROM updates WHERE app_id = ? AND platform = ? AND version = ? AND channel = ?'
    ).get(appId, platform, version, channel);

    if (existing) {
      return res.status(409).json({ error: 'Update already exists' });
    }

    // Create update
    statements.createUpdate.run({
      id: updateId,
      app_id: appId,
      platform: platform.toLowerCase(),
      version,
      channel,
      min_app_version: minAppVersion,
      max_app_version: maxAppVersion,
      description,
      release_notes: releaseNotes,
      mandatory: mandatory ? 1 : 0,
      rollout_percentage: rolloutPercentage,
    });

    res.status(201).json({
      id: updateId,
      message: 'Update created successfully',
    });

    logger.info('Update created', { updateId, appId, version });
  } catch (error) {
    next(error);
  }
});

/**
 * List updates
 * GET /api/updates/list
 */
router.get('/list', authenticate, async (req, res, next) => {
  try {
    const { appId, platform, channel, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM updates WHERE 1=1';
    const params = [];

    if (appId) {
      query += ' AND app_id = ?';
      params.push(appId);
    }
    if (platform) {
      query += ' AND platform = ?';
      params.push(platform.toLowerCase());
    }
    if (channel) {
      query += ' AND channel = ?';
      params.push(channel);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const updates = db.prepare(query).all(...params);
    const total = db.prepare(
      query.replace('SELECT *', 'SELECT COUNT(*) as count').replace(/LIMIT.*$/, '')
    ).get(...params.slice(0, -2)).count;

    res.json({
      updates,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update an update's metadata
 * PUT /api/updates/:id
 */
router.put('/:id', authenticate, authorize('write'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'description',
      'release_notes',
      'mandatory',
      'enabled',
      'rollout_percentage',
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        values.push(field === 'mandatory' || field === 'enabled' ? (req.body[field] ? 1 : 0) : req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const result = db.prepare(
      `UPDATE updates SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update not found' });
    }

    res.json({ message: 'Update modified successfully' });
    logger.info('Update modified', { id, fields: Object.keys(req.body) });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete an update
 * DELETE /api/updates/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM updates WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update not found' });
    }

    res.json({ message: 'Update deleted successfully' });
    logger.info('Update deleted', { id });
  } catch (error) {
    next(error);
  }
});

// Helper function for consistent hashing
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default router;