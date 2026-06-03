/**
 * Local notification service for study reminders.
 *
 * Uses the Web Notifications API via the service worker.  No server or push
 * subscription is required – all scheduling happens client-side with
 * setTimeout + a daily-check heartbeat in the service worker.
 */

// ─── Storage keys ────────────────────────────────────────────
const NOTIF_ENABLED_KEY = 'quest_notifications_enabled';
const NOTIF_TIME_KEY = 'quest_notifications_time'; // "HH:MM"
const SESSION_COUNT_KEY = 'quest_session_count';
const LAST_STUDY_DATE_KEY = 'quest_last_study_date_notif';
const PROMPT_DISMISSED_KEY = 'quest_notification_prompt_dismissed';

// ─── Types ───────────────────────────────────────────────────
export interface NotificationPrefs {
  enabled: boolean;
  /** Daily reminder time in "HH:MM" (24-h). Default "19:00". */
  reminderTime: string;
}

// ─── Preference helpers ──────────────────────────────────────
export function loadNotificationPrefs(): NotificationPrefs {
  return {
    enabled: localStorage.getItem(NOTIF_ENABLED_KEY) === 'true',
    reminderTime: localStorage.getItem(NOTIF_TIME_KEY) || '19:00',
  };
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(NOTIF_ENABLED_KEY, String(prefs.enabled));
  localStorage.setItem(NOTIF_TIME_KEY, prefs.reminderTime);
}

// ─── Session counting (for gentle prompt) ────────────────────
export function getSessionCount(): number {
  return parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
}

export function incrementSessionCount(): void {
  localStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
}

/** Has the user dismissed the "enable notifications?" prompt? */
export function isPromptDismissed(): boolean {
  return localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
}

export function dismissPrompt(): void {
  localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
}

/** Should we show the gentle "Enable reminders?" prompt? */
export function shouldShowNotificationPrompt(): boolean {
  const prefs = loadNotificationPrefs();
  if (prefs.enabled) return false;
  if (isPromptDismissed()) return false;
  return getSessionCount() >= 3;
}

// ─── Permission ──────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// ─── Scheduling via the service worker ───────────────────────
/**
 * Posts a message to the active service worker to schedule (or cancel) the
 * daily reminder.  The SW handles the actual setTimeout / alarm logic.
 */
export async function syncScheduleWithSW(dueCards: number, streak: number): Promise<void> {
  const prefs = loadNotificationPrefs();

  // Record that a study happened today (for the "no study today" check)
  localStorage.setItem(LAST_STUDY_DATE_KEY, new Date().toDateString());

  const reg = await navigator.serviceWorker?.ready;
  if (!reg?.active) return;

  reg.active.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    enabled: prefs.enabled && Notification.permission === 'granted',
    reminderTime: prefs.reminderTime,
    dueCards,
    streak,
    lastStudyDate: new Date().toDateString(),
  });
}

/**
 * Cancel all pending notifications (e.g. when user toggles off).
 */
export async function cancelScheduledNotifications(): Promise<void> {
  const reg = await navigator.serviceWorker?.ready;
  if (!reg?.active) return;
  reg.active.postMessage({ type: 'CANCEL_NOTIFICATIONS' });
}

/**
 * Call this after each study session ends.
 * It increments the session counter and re-syncs the SW schedule.
 */
export async function onSessionComplete(dueCards: number, streak: number): Promise<void> {
  incrementSessionCount();
  if (loadNotificationPrefs().enabled && Notification.permission === 'granted') {
    await syncScheduleWithSW(dueCards, streak);
  }
}

/**
 * Call on app startup to re-arm the SW timer (tabs may have been closed).
 */
export async function initNotifications(dueCards: number, streak: number): Promise<void> {
  if (!isNotificationSupported()) return;
  const prefs = loadNotificationPrefs();
  if (!prefs.enabled || Notification.permission !== 'granted') return;
  await syncScheduleWithSW(dueCards, streak);
}
