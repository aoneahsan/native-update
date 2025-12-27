import type { Timestamp } from 'firebase/firestore';

/**
 * Safely converts various date types to a JavaScript Date object
 */
function toDate(date: Timestamp | Date | { seconds: number; nanoseconds: number } | unknown): Date | null {
  if (!date) return null;

  // Already a Date
  if (date instanceof Date) return date;

  // Firebase Timestamp (has toDate method)
  if (typeof date === 'object' && 'toDate' in date && typeof (date as Timestamp).toDate === 'function') {
    return (date as Timestamp).toDate();
  }

  // Timestamp-like object with seconds (from Firestore)
  if (typeof date === 'object' && 'seconds' in date && typeof (date as { seconds: number }).seconds === 'number') {
    return new Date((date as { seconds: number }).seconds * 1000);
  }

  // FieldValue (serverTimestamp) or other - return null
  return null;
}

/**
 * Formats a Firebase Timestamp or Date to a human-readable string
 */
export function formatDate(date: Timestamp | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return 'Just now';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a Firebase Timestamp or Date to a human-readable string with time
 */
export function formatDateTime(date: Timestamp | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return 'Just now';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats a Firebase Timestamp or Date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Timestamp | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return 'Just now';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) !== 1 ? 's' : ''} ago`;
}

/**
 * Formats a number of bytes to a human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a version string (e.g., "1.0.0")
 */
export function formatVersion(version: string): string {
  return version || 'N/A';
}

/**
 * Capitalizes first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
