import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.js';
import {
  AppError,
  handleError,
  validateRequired,
  validateString,
  validateVersion,
  validatePlatform,
} from '../utils/errors.js';

const router = Router();
const db = getFirestore();

/**
 * Build document interface
 */
interface Build {
  buildId: string;
  appId: string;
  version: string;
  buildNumber: number;
  platform: string;
  bundleUrl: string;
  checksumSha256: string;
  size: number;
  userId: string;
  channel?: string;
  releaseNotes?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * App document interface
 */
interface App {
  userId: string;
}

/**
 * POST /builds - Create new build
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const {
      appId,
      version,
      buildNumber,
      platform,
      bundleUrl,
      checksumSha256,
      size,
      channel,
      releaseNotes,
    } = req.body;

    validateRequired(
      { appId, version, buildNumber, platform, bundleUrl, checksumSha256, size },
      ['appId', 'version', 'buildNumber', 'platform', 'bundleUrl', 'checksumSha256', 'size']
    );

    validateString(appId, 'appId');
    validateVersion(version);
    validatePlatform(platform);
    validateString(bundleUrl, 'bundleUrl', 1, 2048);
    validateString(checksumSha256, 'checksumSha256', 64, 64);

    if (typeof buildNumber !== 'number' || buildNumber < 1) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Build number must be a positive integer'
      );
    }

    if (typeof size !== 'number' || size < 1) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Size must be a positive number'
      );
    }

    if (channel) {
      validateString(channel, 'channel', 1, 50);
    }

    if (releaseNotes) {
      validateString(releaseNotes, 'releaseNotes', 0, 5000);
    }

    const appRef = db.collection('apps').doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new AppError(404, 'APP_NOT_FOUND', 'App not found');
    }

    const appData = appDoc.data() as App;

    if (appData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this app');
    }

    const buildRef = db.collection('builds').doc();
    const buildId = buildRef.id;

    const buildData: Partial<Build> = {
      buildId,
      appId,
      version,
      buildNumber,
      platform,
      bundleUrl,
      checksumSha256,
      size,
      userId: user.uid,
      channel: channel || 'production',
      releaseNotes: releaseNotes || '',
      createdAt: FieldValue.serverTimestamp(),
    };

    await buildRef.set(buildData);

    res.status(201).json({
      success: true,
      build: {
        ...buildData,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /builds - List builds with optional filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { appId, platform, channel, limit = '50' } = req.query;

    let query = db.collection('builds').where('userId', '==', user.uid);

    if (appId) {
      validateString(appId, 'appId');
      query = query.where('appId', '==', appId);
    }

    if (platform) {
      validatePlatform(platform as string);
      query = query.where('platform', '==', platform);
    }

    if (channel) {
      validateString(channel, 'channel');
      query = query.where('channel', '==', channel);
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Limit must be between 1 and 100'
      );
    }

    const buildsSnapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .get();

    const builds = buildsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    res.json({
      success: true,
      builds,
      count: builds.length,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /builds/:buildId - Get specific build
 */
router.get('/:buildId', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { buildId } = req.params;

    const buildRef = db.collection('builds').doc(buildId);
    const buildDoc = await buildRef.get();

    if (!buildDoc.exists) {
      throw new AppError(404, 'BUILD_NOT_FOUND', 'Build not found');
    }

    const buildData = buildDoc.data() as Build;

    if (buildData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this build');
    }

    res.json({
      success: true,
      build: {
        ...buildData,
        createdAt: buildData.createdAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * DELETE /builds/:buildId - Delete build
 */
router.delete('/:buildId', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { buildId } = req.params;

    const buildRef = db.collection('builds').doc(buildId);
    const buildDoc = await buildRef.get();

    if (!buildDoc.exists) {
      throw new AppError(404, 'BUILD_NOT_FOUND', 'Build not found');
    }

    const buildData = buildDoc.data() as Build;

    if (buildData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this build');
    }

    await buildRef.delete();

    res.json({
      success: true,
      message: 'Build deleted successfully',
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
