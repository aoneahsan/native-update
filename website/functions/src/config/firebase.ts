import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * Uses default credentials in Cloud Functions environment
 */
admin.initializeApp();

/**
 * Firestore database instance
 */
export const db = admin.firestore();

/**
 * Firebase Auth instance
 */
export const auth = admin.auth();

/**
 * Firebase Storage instance
 */
export const storage = admin.storage();

/**
 * Server timestamp
 */
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

/**
 * Increment field value
 */
export const increment = admin.firestore.FieldValue.increment;

/**
 * Array union
 */
export const arrayUnion = admin.firestore.FieldValue.arrayUnion;

/**
 * Array remove
 */
export const arrayRemove = admin.firestore.FieldValue.arrayRemove;

/**
 * Collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  APPS: 'apps',
  BUILDS: 'builds',
  DRIVE_TOKENS: 'drive_tokens',
  ANALYTICS: 'analytics',
} as const;
