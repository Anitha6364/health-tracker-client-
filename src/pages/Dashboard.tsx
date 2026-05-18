import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardSummary, MetricType } from '../types';

interface MetricConfig {
  label: string;
  icon: string;
  color: string;
  unit: string;
}

const METRIC_CONFIG: Record<MetricType, MetricConfig> = {
  steps:     { label: 'Steps',      icon: '🚶', color: '#10b981', unit: 'steps' },
  calories:  { label: 'Calories',   icon: '🔥', color: '#f59e0b', unit: 'kcal' },
  water:     { label: 'Water',      icon: '💧', color: '#3b82f6', unit: 'ml' },
  sleep:     { label: 'Sleep',      icon: '😴', color: '#8b5cf6', unit: 'hrs' },
  weight:    { label: 'Weight',     icon: '⚖️', color: '#ec4899', unit: 'kg' },
  heartRate: { label: 'Heart Rate', icon: '❤️', color: '#ef4444', unit: 'bpm' },
  exercise:  { label: 'Exercise',   icon: '🏃', color: '#06b6d4', unit: 'min' },
};

interface HealthScoreProps {
  score: number;
}

function HealthScore({ score }: HealthScoreProps): JSX.Element {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="card flex flex-col items-center justify-center">
      <p className="text-slate-400 text-sm mb-3">Today's Health Score</p>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#334155" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="60" y="65" textAnchor="middle" fill={color} fontSize="26" fontWeight="700">
          {score}
        </text>
      </svg>
      <p className="text-xs text-slate-400 mt-2">
        {score >= 75 ? '🏆 Excellent' : score >= 50 ? '👍 Good' : '💪 Keep going'}
      </p>
    </div>
  );
}

interface MetricCardProps {
  type: MetricType;
  value: number | undefined;
  unit: string;
  goal: number | undefined;
  icon: string;
  label: string;
  color: string;
}

function MetricCard({ type, value, unit, goal, icon, label, color }: MetricCardProps): JSX.Element {
  const progress = goal && value ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <Link
      to={`/metrics/${type}`}
      className="card hover:border-primary transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-slate-400 group-hover:text-primary transition-colors">
          Log →
        </span>
      </div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value !== null && value !== undefined ? value.toLocaleString() : '—'}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      {goal && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Goal: {goal.toLocaleString()}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

interface ChartPoint {
  date: string;
  value: number;
}

export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeChart, setActiveChart] = useState<MetricType>('steps');

  useEffect(() => {
    api
      .get<{ data: DashboardSummary }>('/dashboard/summary')
      .then((res) => setSummary(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartData: ChartPoint[] =
    summary?.weekly?.[activeChart]?.map((m) => ({
      date: format(new Date(m.date), 'MM/dd'),
      value: m.value,
    })) || [];

  const { color } = METRIC_CONFIG[activeChart];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const metricEntries = Object.entries(METRIC_CONFIG) as Array<[MetricType, MetricConfig]>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Good {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Score + first 3 Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthScore score={summary?.healthScore || 0} />
        {metricEntries.slice(0, 3).map(([type, cfg]) => (
          <MetricCard
            key={type}
            type={type}
            {...cfg}
            value={summary?.today?.[type]?.value}
            goal={summary?.goals?.[type]}
          />
        ))}
      </div>

      {/* Remaining metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricEntries.slice(3).map(([type, cfg]) => (
          <MetricCard
            key={type}
            type={type}
            {...cfg}
            value={summary?.today?.[type]?.value}
            goal={summary?.goals?.[type]}
          />
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">7-Day Trend</h2>
          <div className="flex gap-2 flex-wrap">
            {metricEntries.map(([type, cfg]) => (
              <button
                key={type}
                onClick={() => setActiveChart(type)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  activeChart === type
                    ? 'text-white'
                    : 'bg-dark-border text-slate-400 hover:text-white'
                }`}
                style={activeChart === type ? { backgroundColor: cfg.color } : {}}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 10,
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill="url(#grad)"
                strokeWidth={2.5}
                dot={{ fill: color, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-slate-400">
            No data yet — log some {METRIC_CONFIG[activeChart].label.toLowerCase()} to see your
            trend!
          </div>
        )}
      </div>
    </div>
  );
}
