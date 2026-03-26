/**
 * Service worker notification logic.
 *
 * This file is imported by the generated Workbox SW via importScripts.
 * It listens for messages from the main app to schedule local notifications.
 */

// Timer ID for the current scheduled notification
let notifTimerId = null;

// ─── Message handler ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(data);
  } else if (data.type === 'CANCEL_NOTIFICATIONS') {
    clearScheduled();
  }
});

function clearScheduled() {
  if (notifTimerId !== null) {
    clearTimeout(notifTimerId);
    notifTimerId = null;
  }
}

/**
 * Schedule a notification for the configured daily reminder time.
 * If the time has already passed today, schedule for tomorrow.
 */
function scheduleNotification(opts) {
  clearScheduled();

  if (!opts.enabled) return;

  const [hours, minutes] = (opts.reminderTime || '19:00').split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If the target time already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  // Safety: cap at 24 hours (setTimeout can handle large values but let's be safe)
  const safeDelay = Math.min(delay, 24 * 60 * 60 * 1000);

  notifTimerId = setTimeout(() => {
    // Only show if no study happened today
    const lastStudy = opts.lastStudyDate || '';
    const today = new Date().toDateString();
    const studiedToday = lastStudy === today;

    // Pick notification content
    let title, body;
    const dueCards = opts.dueCards || 0;
    const streak = opts.streak || 0;

    if (!studiedToday && streak > 1) {
      title = 'Don\'t lose your streak!';
      body = 'Your ' + streak + '-day streak is at risk. Quick review?';
    } else if (dueCards > 0) {
      title = 'Cards ready for review';
      body = 'You have ' + dueCards + ' cards due. Keep your streak going!';
    } else {
      title = 'Time to study!';
      body = 'Keep building your language skills with a quick session.';
    }

    self.registration.showNotification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'study-reminder',
      renotify: true,
      data: { url: '/' },
    });

    // Re-schedule for the next day
    scheduleNotification({
      ...opts,
      lastStudyDate: lastStudy, // keep same — will be updated by next session
    });
  }, safeDelay);
}

// ─── Notification click: open / focus the app ────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab if available
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow('/');
    })
  );
});
