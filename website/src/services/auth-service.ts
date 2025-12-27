import {
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

export const authService = {
  // Login/Signup with Google (handles both cases)
  async loginWithGoogle() {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if user doc exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // First time login - create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google.com',
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        driveConnected: false,
        driveEmail: null,
        driveConnectedAt: null,
        plan: 'free',
        planStartDate: null,
        planEndDate: null,
        appsCount: 0,
        buildsCount: 0,
        storageUsed: 0,
        preferences: {
          emailNotifications: true,
          updateNotifications: true,
          theme: 'auto',
          language: 'en'
        },
        updatedAt: serverTimestamp()
      });
    } else {
      // Existing user - update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return user;
  },

  // Logout
  async logout() {
    await signOut(auth);
  },
};
