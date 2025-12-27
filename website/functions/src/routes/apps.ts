import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.js';
import {
  AppError,
  handleError,
  validateRequired,
  validateString,
  validateAppId,
} from '../utils/errors.js';

const router = Router();
const db = getFirestore();

/**
 * App document interface
 */
interface App {
  appId: string;
  name: string;
  description?: string;
  bundleId: string;
  platforms: string[];
  userId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * POST /apps - Create new app
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { appId, name, description, bundleId, platforms } = req.body;

    validateRequired({ appId, name, bundleId, platforms }, [
      'appId',
      'name',
      'bundleId',
      'platforms',
    ]);

    validateAppId(appId);
    validateString(name, 'name', 1, 100);
    validateString(bundleId, 'bundleId', 1, 255);

    if (description) {
      validateString(description, 'description', 0, 500);
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Platforms must be a non-empty array'
      );
    }

    platforms.forEach((platform: string) => {
      if (!['ios', 'android'].includes(platform)) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Platform must be ios or android'
        );
      }
    });

    const appRef = db.collection('apps').doc(appId);
    const appDoc = await appRef.get();

    if (appDoc.exists) {
      throw new AppError(409, 'APP_EXISTS', 'App with this ID already exists');
    }

    const now = FieldValue.serverTimestamp();
    const appData: Partial<App> = {
      appId,
      name,
      description: description || '',
      bundleId,
      platforms,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    await appRef.set(appData);

    res.status(201).json({
      success: true,
      app: {
        ...appData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /apps - List user's apps
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;

    const appsSnapshot = await db
      .collection('apps')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const apps = appsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });

    res.json({
      success: true,
      apps,
      count: apps.length,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /apps/:appId - Get specific app
 */
router.get('/:appId', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { appId } = req.params;

    const appRef = db.collection('apps').doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new AppError(404, 'APP_NOT_FOUND', 'App not found');
    }

    const appData = appDoc.data() as App;

    if (appData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this app');
    }

    res.json({
      success: true,
      app: {
        ...appData,
        createdAt: appData.createdAt?.toDate().toISOString(),
        updatedAt: appData.updatedAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * PUT /apps/:appId - Update app
 */
router.put('/:appId', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { appId } = req.params;
    const { name, description, bundleId, platforms } = req.body;

    const appRef = db.collection('apps').doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new AppError(404, 'APP_NOT_FOUND', 'App not found');
    }

    const appData = appDoc.data() as App;

    if (appData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this app');
    }

    const updates: Partial<App> = {
      updatedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    };

    if (name !== undefined) {
      validateString(name, 'name', 1, 100);
      updates.name = name;
    }

    if (description !== undefined) {
      validateString(description, 'description', 0, 500);
      updates.description = description;
    }

    if (bundleId !== undefined) {
      validateString(bundleId, 'bundleId', 1, 255);
      updates.bundleId = bundleId;
    }

    if (platforms !== undefined) {
      if (!Array.isArray(platforms) || platforms.length === 0) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Platforms must be a non-empty array'
        );
      }

      platforms.forEach((platform: string) => {
        if (!['ios', 'android'].includes(platform)) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Platform must be ios or android'
          );
        }
      });

      updates.platforms = platforms;
    }

    await appRef.update(updates);

    const updatedDoc = await appRef.get();
    const updatedData = updatedDoc.data() as App;

    res.json({
      success: true,
      app: {
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate().toISOString(),
        updatedAt: updatedData.updatedAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * DELETE /apps/:appId - Delete app and all its builds
 */
router.delete('/:appId', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { appId } = req.params;

    const appRef = db.collection('apps').doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      throw new AppError(404, 'APP_NOT_FOUND', 'App not found');
    }

    const appData = appDoc.data() as App;

    if (appData.userId !== user.uid) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this app');
    }

    const buildsSnapshot = await db
      .collection('builds')
      .where('appId', '==', appId)
      .get();

    const batch = db.batch();
    batch.delete(appRef);

    buildsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'App and all associated builds deleted successfully',
      deletedBuilds: buildsSnapshot.size,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
