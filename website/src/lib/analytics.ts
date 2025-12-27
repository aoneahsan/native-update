import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { analytics } from './firebase';

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
}

/**
 * Tracks an analytics event across all platforms
 */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
  // Firebase Analytics
  if (analytics) {
    firebaseLogEvent(analytics, eventName, params);
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, params);
  }
}

/**
 * Tracks page view
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

/**
 * Tracks button click
 */
export function trackClick(elementName: string, location?: string): void {
  trackEvent('click', {
    element_name: elementName,
    location: location || 'unknown',
  });
}

/**
 * Tracks form submission
 */
export function trackFormSubmit(formName: string, success: boolean): void {
  trackEvent('form_submit', {
    form_name: formName,
    success,
  });
}

/**
 * Tracks external link click
 */
export function trackExternalLink(url: string, text?: string): void {
  trackEvent('external_link_click', {
    url,
    link_text: text || 'unknown',
  });
}

/**
 * Tracks download
 */
export function trackDownload(fileName: string, fileType?: string): void {
  trackEvent('download', {
    file_name: fileName,
    file_type: fileType || 'unknown',
  });
}

/**
 * Tracks error
 */
export function trackError(errorMessage: string, errorLocation?: string): void {
  trackEvent('error', {
    error_message: errorMessage,
    error_location: errorLocation || 'unknown',
  });
}
