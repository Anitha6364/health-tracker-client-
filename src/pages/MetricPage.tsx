import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Metric, MetricType } from '../types';

interface MetricConfig {
  label: string;
  icon: string;
  color: string;
  unit: string;
  placeholder: string;
  defaultGoal: number;
}

const CONFIG: Record<MetricType, MetricConfig> = {
  steps:     { label: 'Steps',      icon: '🚶', color: '#10b981', unit: 'steps',   placeholder: '8000',  defaultGoal: 10000 },
  calories:  { label: 'Calories',   icon: '🔥', color: '#f59e0b', unit: 'kcal',    placeholder: '1800',  defaultGoal: 2000 },
  water:     { label: 'Water',      icon: '💧', color: '#3b82f6', unit: 'ml',      placeholder: '2000',  defaultGoal: 2500 },
  sleep:     { label: 'Sleep',      icon: '😴', color: '#8b5cf6', unit: 'hours',   placeholder: '7.5',   defaultGoal: 8 },
  weight:    { label: 'Weight',     icon: '⚖️', color: '#ec4899', unit: 'kg',      placeholder: '70',    defaultGoal: 70 },
  heartRate: { label: 'Heart Rate', icon: '❤️', color: '#ef4444', unit: 'bpm',     placeholder: '72',    defaultGoal: 70 },
  exercise:  { label: 'Exercise',   icon: '🏃', color: '#06b6d4', unit: 'minutes', placeholder: '30',    defaultGoal: 30 },
};

interface ChartPoint {
  date: string;
  value: number;
}

interface GoalsApiResponse {
  data: Partial<Record<MetricType, { target: number; unit: string }>>;
}

interface MetricsApiResponse {
  data: Metric[];
}

interface PostMetricResponse {
  data: Metric;
}

export default function MetricPage(): JSX.Element {
  const { type } = useParams<{ type: string }>();
  const metricType = type as MetricType;
  const cfg = CONFIG[metricType] as MetricConfig | undefined;

  const [entries, setEntries] = useState<Metric[]>([]);
  const [value, setValue] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [goal, setGoal] = useState<number>(cfg?.defaultGoal ?? 0);

  useEffect(() => {
    if (!cfg) return;
    setLoading(true);
    Promise.all([
      api.get<MetricsApiResponse>(`/metrics/${metricType}?limit=30`),
      api.get<GoalsApiResponse>('/goals'),
    ])
      .then(([metricsRes, goalsRes]) => {
        setEntries(metricsRes.data.data || []);
        setGoal(goalsRes.data.data?.[metricType]?.target ?? cfg.defaultGoal);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [metricType]);

  const handleLog = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!value || !cfg) return;
    setSubmitting(true);
    try {
      const res = await api.post<PostMetricResponse>(`/metrics/${metricType}`, {
        value: parseFloat(value),
        note,
      });
      setEntries([res.data.data, ...entries]);
      setValue('');
      setNote('');
      toast.success(`${cfg.label} logged!`);
    } catch {
      toast.error('Failed to log. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await api.delete(`/metrics/${id}`);
      setEntries(entries.filter((e) => e._id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const chartData: ChartPoint[] = [...entries]
    .reverse()
    .slice(-14)
    .map((e) => ({
      date: format(new Date(e.date), 'MM/dd'),
      value: e.value,
    }));

  const latest: number | undefined = entries[0]?.value;
  const avg: string =
    entries.length
      ? (entries.reduce((s, e) => s + e.value, 0) / entries.length).toFixed(1)
      : '—';
  const best: number | string = entries.length
    ? Math.max(...entries.map((e) => e.value))
    : '—';

  if (!cfg) {
    return <div className="text-center py-20 text-slate-400">Unknown metric type.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {cfg.icon} {cfg.label}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Track and log your {cfg.label.toLowerCase()} daily
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Latest',    value: latest ?? '—', suffix: cfg.unit },
          { label: '30-Day Avg', value: avg,           suffix: cfg.unit },
          { label: 'Best',      value: best,           suffix: cfg.unit },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: cfg.color }}>
              {s.value}
            </p>
            <p className="text-xs text-slate-500">{s.suffix}</p>
          </div>
        ))}
      </div>

      {/* Log form */}
      <div className="card">
        <h2 className="font-semibold mb-4">Log {cfg.label}</h2>
        <form onSubmit={handleLog} className="flex gap-3 flex-wrap">
          <input
            type="number"
            step="any"
            required
            className="input flex-1 min-w-[120px]"
            placeholder={`Value (${cfg.placeholder} ${cfg.unit})`}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          />
          <input
            type="text"
            className="input flex-1 min-w-[120px]"
            placeholder="Note (optional)"
            value={note}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary whitespace-nowrap"
            style={{ backgroundColor: cfg.color }}
          >
            {submitting ? '...' : '+ Log'}
          </button>
        </form>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Last 14 Entries</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: cfg.color }}
              />
              <ReferenceLine
                y={goal}
                stroke={cfg.color}
                strokeDasharray="4 2"
                opacity={0.5}
                label={{ value: 'Goal', fill: cfg.color, fontSize: 10 }}
              />
              <Bar dataKey="value" fill={cfg.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h2 className="font-semibold mb-4">History</h2>
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No entries yet. Log your first {cfg.label.toLowerCase()}!
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between py-2.5 px-3 bg-dark rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cfg.icon}</span>
                  <div>
                    <span className="font-semibold" style={{ color: cfg.color }}>
                      {entry.value} {cfg.unit}
                    </span>
                    {entry.note && (
                      <span className="text-slate-400 text-sm ml-2">— {entry.note}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {format(new Date(entry.date), 'MMM d, h:mm a')}
                  </span>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="text-slate-600 hover:text-red-400 text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
