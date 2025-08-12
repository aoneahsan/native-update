import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { db, statements } from '../database/init.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configure multer for bundle uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.STORAGE_PATH || './storage/bundles';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const bundleId = nanoid();
    const ext = path.extname(file.originalname);
    cb(null, `${bundleId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_BUNDLE_SIZE || '104857600'), // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.bundle'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .zip and .bundle files are allowed.'));
    }
  },
});

/**
 * Upload a bundle for an update
 * POST /api/bundles/upload/:updateId
 */
router.post('/upload/:updateId', authenticate, authorize('write'), upload.single('bundle'), async (req, res, next) => {
  try {
    const { updateId } = req.params;
    const { signature } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No bundle file uploaded' });
    }

    // Verify update exists
    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(updateId);
    if (!update) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Update not found' });
    }

    // Calculate checksum
    const fileBuffer = await fs.readFile(req.file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Create bundle record
    const bundleId = path.basename(req.file.filename, path.extname(req.file.filename));
    const downloadUrl = `/api/bundles/${bundleId}`;

    statements.createBundle.run({
      id: bundleId,
      update_id: updateId,
      file_path: req.file.path,
      file_size: req.file.size,
      checksum,
      signature: signature || null,
      download_url: downloadUrl,
    });

    res.status(201).json({
      bundleId,
      checksum,
      size: req.file.size,
      downloadUrl,
    });

    logger.info('Bundle uploaded', {
      bundleId,
      updateId,
      size: req.file.size,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
});

/**
 * Download a bundle
 * GET /api/bundles/:bundleId
 */
router.get('/:bundleId', async (req, res, next) => {
  try {
    const { bundleId } = req.params;
    
    // Get bundle info
    const bundle = db.prepare(`
      SELECT b.*, u.app_id, u.platform, u.version 
      FROM bundles b
      JOIN updates u ON b.update_id = u.id
      WHERE b.id = ?
    `).get(bundleId);

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Check if file exists
    try {
      await fs.access(bundle.file_path);
    } catch {
      logger.error('Bundle file missing', { bundleId, path: bundle.file_path });
      return res.status(404).json({ error: 'Bundle file not found' });
    }

    // Record download attempt
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', bundle.file_size);
      res.setHeader('Content-Disposition', `attachment; filename="${bundle.app_id}-${bundle.version}.zip"`);
      res.setHeader('X-Checksum', bundle.checksum);
      
      if (bundle.signature) {
        res.setHeader('X-Signature', bundle.signature);
      }

      // Stream the file
      const stream = require('fs').createReadStream(bundle.file_path);
      stream.pipe(res);

      stream.on('end', () => {
        // Record successful download
        statements.recordDownload.run({
          bundle_id: bundleId,
          ip_address: ipAddress,
          user_agent: userAgent,
          success: 1,
          error_message: null,
        });

        logger.info('Bundle downloaded', {
          bundleId,
          appId: bundle.app_id,
          version: bundle.version,
        });
      });

      stream.on('error', (error) => {
        logger.error('Bundle stream error', { bundleId, error: error.message });
        
        statements.recordDownload.run({
          bundle_id: bundleId,
          ip_address: ipAddress,
          user_agent: userAgent,
          success: 0,
          error_message: error.message,
        });

        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download bundle' });
        }
      });
    } catch (error) {
      statements.recordDownload.run({
        bundle_id: bundleId,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: 0,
        error_message: error.message,
      });
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a bundle
 * DELETE /api/bundles/:bundleId
 */
router.delete('/:bundleId', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { bundleId } = req.params;
    
    // Get bundle info
    const bundle = db.prepare('SELECT * FROM bundles WHERE id = ?').get(bundleId);
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Delete file
    try {
      await fs.unlink(bundle.file_path);
    } catch (error) {
      logger.warn('Failed to delete bundle file', { bundleId, error: error.message });
    }

    // Delete database record
    db.prepare('DELETE FROM bundles WHERE id = ?').run(bundleId);

    res.json({ message: 'Bundle deleted successfully' });
    logger.info('Bundle deleted', { bundleId });
  } catch (error) {
    next(error);
  }
});

export default router;