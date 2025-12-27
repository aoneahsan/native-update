import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.js';
import { AppError, handleError, validateString } from '../utils/errors.js';

const router = Router();
const db = getFirestore();

/**
 * User profile interface
 */
interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  organization?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * GET /users/profile - Get user profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;

    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const now = FieldValue.serverTimestamp();
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        createdAt: now,
        updatedAt: now,
      };

      await userRef.set(newProfile);

      res.json({
        success: true,
        profile: {
          ...newProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    const userData = userDoc.data() as UserProfile;

    res.json({
      success: true,
      profile: {
        ...userData,
        createdAt: userData.createdAt?.toDate().toISOString(),
        updatedAt: userData.updatedAt?.toDate().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * PUT /users/profile - Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { displayName, photoURL, organization } = req.body;

    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    const updates: Partial<UserProfile> = {
      updatedAt: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    };

    if (displayName !== undefined) {
      validateString(displayName, 'displayName', 1, 100);
      updates.displayName = displayName;
    }

    if (photoURL !== undefined) {
      validateString(photoURL, 'photoURL', 0, 2048);
      updates.photoURL = photoURL;
    }

    if (organization !== undefined) {
      validateString(organization, 'organization', 0, 100);
      updates.organization = organization;
    }

    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data() as UserProfile;

    res.json({
      success: true,
      profile: {
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
 * DELETE /users/account - Delete user account and all associated data
 */
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;

    const appsSnapshot = await db
      .collection('apps')
      .where('userId', '==', user.uid)
      .get();

    const buildsSnapshot = await db
      .collection('builds')
      .where('userId', '==', user.uid)
      .get();

    const batch = db.batch();

    appsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    buildsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    const userRef = db.collection('users').doc(user.uid);
    batch.delete(userRef);

    await batch.commit();

    await getAuth().deleteUser(user.uid);

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
      deletedApps: appsSnapshot.size,
      deletedBuilds: buildsSnapshot.size,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
