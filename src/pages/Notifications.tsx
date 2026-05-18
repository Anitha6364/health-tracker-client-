import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Reminder } from '../types';

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'morning',
    label: 'Morning Check-in',
    icon: '☀️',
    time: '08:00',
    enabled: true,
    message: 'Good morning! Log your weight and start your day right.',
  },
  {
    id: 'water',
    label: 'Hydration Reminder',
    icon: '💧',
    time: '10:00',
    enabled: true,
    message: 'Time to drink some water! Stay hydrated.',
  },
  {
    id: 'lunch',
    label: 'Lunch Nutrition Log',
    icon: '🥗',
    time: '13:00',
    enabled: false,
    message: "Don't forget to log your lunch!",
  },
  {
    id: 'workout',
    label: 'Workout Reminder',
    icon: '🏃',
    time: '18:00',
    enabled: true,
    message: 'Time to get moving! Your workout is waiting.',
  },
  {
    id: 'evening',
    label: 'Evening Mood Log',
    icon: '🌙',
    time: '20:00',
    enabled: false,
    message: 'How was your day? Log your mood and stress level.',
  },
  {
    id: 'sleep',
    label: 'Sleep Reminder',
    icon: '😴',
    time: '22:30',
    enabled: true,
    message: 'Time to wind down. Log your sleep goal for tonight.',
  },
];

type NotificationPermission = 'default' | 'granted' | 'denied';

export default function Notifications(): JSX.Element {
  const [permission, setPermission] = useState<NotificationPermission>(
    (Notification?.permission as NotificationPermission) || 'default'
  );
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const stored = localStorage.getItem('ht_reminders');
      return stored ? (JSON.parse(stored) as Reminder[]) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });
  const [scheduledTimers, setScheduledTimers] = useState<ReturnType<typeof setTimeout>[]>([]);

  const save = (updated: Reminder[]): void => {
    setReminders(updated);
    localStorage.setItem('ht_reminders', JSON.stringify(updated));
  };

  const requestPermission = async (): Promise<void> => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in your browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    if (result === 'granted') {
      toast.success('Notifications enabled! 🔔');
      new Notification('HealthTracker', {
        body: "You'll now receive health reminders!",
        icon: '/favicon.svg',
      });
    } else {
      toast.error('Notification permission denied.');
    }
  };

  const toggle = (id: string): void => {
    save(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const updateTime = (id: string, time: string): void => {
    save(reminders.map((r) => (r.id === id ? { ...r, time } : r)));
  };

  const testNotification = (r: Reminder): void => {
    if (permission !== 'granted') {
      toast.error('Enable notifications first.');
      return;
    }
    new Notification(`HealthTracker — ${r.label}`, {
      body: r.message,
      icon: '/favicon.svg',
    });
    toast.success(`Test notification sent for "${r.label}"`);
  };

  // Schedule notifications using setTimeout (within-day scheduling)
  useEffect(() => {
    scheduledTimers.forEach(clearTimeout);
    const newTimers: ReturnType<typeof setTimeout>[] = [];

    if (permission !== 'granted') return;

    reminders
      .filter((r) => r.enabled)
      .forEach((r) => {
        const [h, m] = r.time.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(h, m, 0, 0);

        let delay = target.getTime() - now.getTime();
        if (delay < 0) delay += 24 * 60 * 60 * 1000;

        const tid = setTimeout(() => {
          new Notification(`HealthTracker — ${r.label}`, {
            body: r.message,
            icon: '/favicon.svg',
          });
        }, delay);

        newTimers.push(tid);
      });

    setScheduledTimers(newTimers);
    return () => newTimers.forEach(clearTimeout);
  }, [permission, reminders]);

  const enabled = reminders.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔔 Notifications & Reminders</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure health reminders to stay on track
        </p>
      </div>

      {/* Permission card */}
      <div
        className={`card border-2 ${
          permission === 'granted'
            ? 'border-primary bg-primary/5'
            : 'border-amber-500 bg-amber-500/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{permission === 'granted' ? '✅' : '🔔'}</span>
            <div>
              <p className="font-semibold">
                {permission === 'granted' ? 'Notifications Active' : 'Notifications Disabled'}
              </p>
              <p className="text-sm text-slate-400">
                {permission === 'granted'
                  ? `${enabled} reminder${enabled !== 1 ? 's' : ''} scheduled`
                  : 'Enable to receive health reminders'}
              </p>
            </div>
          </div>
          {permission !== 'granted' && (
            <button onClick={requestPermission} className="btn-primary text-sm">
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Reminder cards */}
      <div className="space-y-3">
        <h2 className="font-semibold">Scheduled Reminders</h2>
        {reminders.map((r) => (
          <div
            key={r.id}
            className={`card transition-opacity ${!r.enabled ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <input
                  type="time"
                  value={r.time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateTime(r.id, e.target.value)
                  }
                  className="bg-dark border border-dark-border rounded-lg px-2 py-1 text-sm text-white"
                />
                <button
                  onClick={() => testNotification(r)}
                  className="text-slate-500 hover:text-primary text-xs"
                  title="Send test"
                >
                  🧪
                </button>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(r.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    r.enabled ? 'bg-primary' : 'bg-dark-border'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      r.enabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="card bg-dark-card border-dark-border">
        <h2 className="font-semibold mb-2 text-sm">💡 How reminders work</h2>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Reminders fire at your set time while the app is open</li>
          <li>• For background notifications, install the app (PWA) on your device</li>
          <li>• Tap the 🧪 icon to send a test notification immediately</li>
          <li>• Times are saved locally and persist across sessions</li>
        </ul>
      </div>
    </div>
  );
}
