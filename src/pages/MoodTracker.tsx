import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MoodEntry, EmotionType } from '../types';

interface EmotionOption {
  value: EmotionType;
  label: string;
  emoji: string;
  color: string;
  score: number;
}

const EMOTIONS: EmotionOption[] = [
  { value: 'great',    label: 'Great',   emoji: '😄', color: '#10b981', score: 9 },
  { value: 'good',     label: 'Good',    emoji: '😊', color: '#3b82f6', score: 7 },
  { value: 'okay',     label: 'Okay',    emoji: '😐', color: '#f59e0b', score: 5 },
  { value: 'bad',      label: 'Bad',     emoji: '😔', color: '#f97316', score: 3 },
  { value: 'terrible', label: 'Terrible', emoji: '😢', color: '#ef4444', score: 1 },
];

const TAGS = ['work', 'exercise', 'diet', 'sleep', 'social', 'health', 'weather', 'other'];
const TAG_ICONS: Record<string, string> = {
  work: '💼',
  exercise: '🏃',
  diet: '🥗',
  sleep: '😴',
  social: '👥',
  health: '⚕️',
  weather: '🌤️',
  other: '✨',
};

type MoodTab = 'log' | 'trend' | 'history';

interface TrendPoint {
  date: string;
  stress: number;
  energy: number;
}

interface MoodApiResponse {
  data: MoodEntry[];
}

interface TrendApiResponse {
  data: Array<{ date: string; score: number; energy: number }>;
}

interface PostMoodResponse {
  data: MoodEntry;
}

export default function MoodTracker(): JSX.Element {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tab, setTab] = useState<MoodTab>('log');

  const [emotion, setEmotion] = useState<EmotionType>('good');
  const [stress, setStress] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(7);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');

  const load = (): void => {
    setLoading(true);
    Promise.all([
      api.get<MoodApiResponse>('/mood?limit=30'),
      api.get<TrendApiResponse>('/mood/trend'),
    ])
      .then(([r1, r2]) => {
        setEntries(r1.data.data || []);
        const t: TrendPoint[] = (r2.data.data || []).map((e) => ({
          date: format(new Date(e.date), 'MM/dd'),
          stress: e.score,
          energy: e.energy,
        }));
        setTrend(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleTag = (t: string): void =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleLog = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post<PostMoodResponse>('/mood', { emotion, score: stress, energy, tags, note });
      toast.success('Mood logged 💚');
      setNote('');
      setTags([]);
      load();
      setTab('trend');
    } catch {
      toast.error('Failed to log mood');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    await api.delete(`/mood/${id}`);
    setEntries((p) => p.filter((e) => e._id !== id));
    toast.success('Entry removed');
  };

  const emo = EMOTIONS.find((e) => e.value === emotion);

  const tabOptions: Array<[MoodTab, string]> = [
    ['log', '✏️ Log'],
    ['trend', '📈 Trend'],
    ['history', '📋 History'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧘 Mood & Stress Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Log your daily mental wellbeing and energy levels
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabOptions.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === v ? 'bg-primary text-white' : 'bg-dark-border text-slate-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* LOG TAB */}
      {tab === 'log' && (
        <div className="space-y-4">
          {/* Emotion picker */}
          <div className="card">
            <h2 className="font-semibold mb-3">How are you feeling?</h2>
            <div className="flex gap-3 justify-center">
              {EMOTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEmotion(e.value)}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                    emotion === e.value ? 'scale-110 ring-2' : 'opacity-60 hover:opacity-80'
                  }`}
                  style={
                    emotion === e.value
                      ? { outline: `2px solid ${e.color}`, background: `${e.color}22` }
                      : {}
                  }
                >
                  <span className="text-4xl">{e.emoji}</span>
                  <span className="text-xs mt-1 font-medium" style={{ color: e.color }}>
                    {e.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress & Energy sliders */}
          <div className="card space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">😤 Stress Level</label>
                <span
                  className="text-sm font-bold"
                  style={{ color: stress > 6 ? '#ef4444' : '#10b981' }}
                >
                  {stress}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStress(Number(e.target.value))
                }
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>😌 Relaxed</span>
                <span>😤 Very Stressed</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">⚡ Energy Level</label>
                <span className="text-sm font-bold text-primary">{energy}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEnergy(Number(e.target.value))
                }
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>😴 Exhausted</span>
                <span>⚡ Energised</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <h2 className="font-semibold mb-3 text-sm">
              What's affecting your mood? (optional)
            </h2>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                    tags.includes(t)
                      ? 'bg-primary text-white'
                      : 'bg-dark-border text-slate-400 hover:text-white'
                  }`}
                >
                  {TAG_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Note + submit */}
          <div className="card">
            <label className="text-sm text-slate-400 block mb-2">
              Journal note (optional)
            </label>
            <textarea
              className="input h-24 resize-none"
              placeholder="How was your day? Any thoughts..."
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            />
            <button
              onClick={handleLog}
              disabled={submitting}
              className="btn-primary w-full mt-3"
            >
              {submitting ? 'Saving...' : `${emo?.emoji} Save Mood Check-in`}
            </button>
          </div>
        </div>
      )}

      {/* TREND TAB */}
      {tab === 'trend' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-4">Stress & Energy Trend (14 days)</h2>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 10,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={5} stroke="#334155" strokeDasharray="4 2" />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#ef4444' }}
                    name="Stress"
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    name="Energy"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400">
                Log mood entries to see your trend
              </div>
            )}
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Stress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-slate-400">Energy</span>
              </div>
            </div>
          </div>

          {/* Emotion frequency */}
          {entries.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3 text-sm">Emotion Frequency</h2>
              <div className="space-y-2">
                {EMOTIONS.map((e) => {
                  const count = entries.filter((en) => en.emotion === e.value).length;
                  const pct = entries.length ? (count / entries.length) * 100 : 0;
                  return (
                    <div key={e.value} className="flex items-center gap-3">
                      <span className="text-xl w-8">{e.emoji}</span>
                      <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: e.color }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Mood History</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No mood entries yet.</div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const emoEntry = EMOTIONS.find((x) => x.value === entry.emotion);
                return (
                  <div
                    key={entry._id}
                    className="flex items-start justify-between py-2.5 px-3 bg-dark rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{emoEntry?.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: emoEntry?.color }}>
                            {emoEntry?.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            😤 {entry.score}/10 · ⚡ {entry.energy}/10
                          </span>
                        </div>
                        {entry.tags?.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {entry.tags.map((t) => (
                              <span
                                key={t}
                                className="text-xs bg-dark-border px-1.5 py-0.5 rounded"
                              >
                                {TAG_ICONS[t]} {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {entry.note && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-slate-500">
                        {format(new Date(entry.date), 'MMM d')}
                      </span>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-slate-600 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
