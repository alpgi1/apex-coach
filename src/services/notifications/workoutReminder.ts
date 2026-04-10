import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'workout-reminder';
const LAST_OVERDUE_NOTIF_KEY = 'last-overdue-notif-date';
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
        // Already overdue — only fire once per calendar day to avoid spamming on every app open
        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        const lastShown = await AsyncStorage.getItem(LAST_OVERDUE_NOTIF_KEY).catch(() => null);
        if (lastShown === today) return;

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

        await AsyncStorage.setItem(LAST_OVERDUE_NOTIF_KEY, today).catch(() => {});
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
