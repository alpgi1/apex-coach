import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'workout-reminder';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Cancels any existing workout reminder and schedules a new one
 * for 48 hours from now. Call this every time a workout is completed.
 */
export async function scheduleWorkoutReminder(): Promise<void> {
    try {
        // Cancel previous reminder so we never double-up
        await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY).catch(() => {});

        await Notifications.scheduleNotificationAsync({
            identifier: REMINDER_ID_KEY,
            content: {
                title: "Time to train! 💪",
                body: "It's been 2 days since your last workout. Don't break the streak!",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: TWO_DAYS_MS / 1000,
            },
        });
    } catch (err) {
        // Non-critical — never crash the app over a notification
        console.warn('Failed to schedule workout reminder:', err);
    }
}

/** Call on app startup to re-arm the reminder if none is pending. */
export async function ensureWorkoutReminderArmed(lastWorkoutTime: string | null): Promise<void> {
    if (!lastWorkoutTime) return;

    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = pending.some((n) => n.identifier === REMINDER_ID_KEY);
    if (alreadyScheduled) return;

    const elapsed = Date.now() - new Date(lastWorkoutTime).getTime();
    if (elapsed >= TWO_DAYS_MS) {
        // Already overdue — fire immediately (1 second delay so it reaches the tray)
        await Notifications.scheduleNotificationAsync({
            identifier: REMINDER_ID_KEY,
            content: {
                title: "Time to train! 💪",
                body: "It's been 2 days since your last workout. Don't break the streak!",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 1,
            },
        }).catch(() => {});
    } else {
        const remaining = TWO_DAYS_MS - elapsed;
        await Notifications.scheduleNotificationAsync({
            identifier: REMINDER_ID_KEY,
            content: {
                title: "Time to train! 💪",
                body: "It's been 2 days since your last workout. Don't break the streak!",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: Math.floor(remaining / 1000),
            },
        }).catch(() => {});
    }
}
