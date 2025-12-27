import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

export const authService = {
  // Signup with email/password
  async signup(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Send verification email
    await sendEmailVerification(user);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      provider: 'email',
      emailVerified: false,
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

    return user;
  },

  // Login with email/password
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return user;
  },

  // Login with Google
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

  // Send verification email
  async sendVerificationEmail(user: FirebaseUser) {
    await sendEmailVerification(user);
  },

  // Send password reset email
  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  // Check if email is verified
  isEmailVerified(user: FirebaseUser | null): boolean {
    return user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';
  }
};
