import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Alert, AdaptiveGoal, MetricType } from '../types';

interface LevelStyle {
  bg: string;
  border: string;
  badge: string;
}

const LEVEL_STYLES: Record<string, LevelStyle> = {
  danger:  { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', badge: 'bg-red-500/20 text-red-400' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400' },
  success: { bg: 'rgba(16,185,129,0.08)', border: '#10b981', badge: 'bg-green-500/20 text-green-400' },
  info:    { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', badge: 'bg-blue-500/20 text-blue-400' },
};

const METRIC_UNITS: Partial<Record<MetricType, string>> = {
  steps: 'steps',
  water: 'ml',
  sleep: 'hours',
  exercise: 'min',
  weight: 'kg',
  heartRate: 'bpm',
};

interface AlertsApiResponse {
  data: Alert[];
}

interface AdaptiveApiResponse {
  data: AdaptiveGoal[];
}

type AlertTab = 'alerts' | 'adaptive';

export default function PredictiveAlerts(): JSX.Element {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [adaptive, setAdaptive] = useState<AdaptiveGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<Partial<Record<MetricType, boolean>>>({});
  const [tab, setTab] = useState<AlertTab>('alerts');

  useEffect(() => {
    Promise.all([
      api.get<AlertsApiResponse>('/alerts/predictive'),
      api.get<AdaptiveApiResponse>('/alerts/adaptive-goals'),
    ])
      .then(([r1, r2]) => {
        setAlerts(r1.data.data || []);
        setAdaptive(r2.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const applyGoal = async (suggestion: AdaptiveGoal): Promise<void> => {
    setApplying((a) => ({ ...a, [suggestion.type]: true }));
    try {
      await api.put(`/goals/${suggestion.type}`, {
        target: suggestion.suggestedGoal,
        unit: METRIC_UNITS[suggestion.type],
      });
      toast.success(`${suggestion.type} goal updated to ${suggestion.suggestedGoal}!`);
      setAdaptive((prev) => prev.filter((s) => s.type !== suggestion.type));
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setApplying((a) => ({ ...a, [suggestion.type]: false }));
    }
  };

  const dangerCount  = alerts.filter((a) => a.level === 'danger').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;
  const successCount = alerts.filter((a) => a.level === 'success').length;

  const tabOptions: Array<[AlertTab, string]> = [
    ['alerts', `🚨 Predictive Alerts (${alerts.length})`],
    ['adaptive', `🎯 Adaptive Goals (${adaptive.length})`],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧠 AI Health Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">
          Predictive alerts and adaptive goal recommendations powered by your data
        </p>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-400">{dangerCount}</p>
          <p className="text-xs text-slate-400 mt-1">🚨 Critical Alerts</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
          <p className="text-xs text-slate-400 mt-1">⚠️ Warnings</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary">{successCount}</p>
          <p className="text-xs text-slate-400 mt-1">✅ Achievements</p>
        </div>
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

      {/* Predictive Alerts */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🧠</p>
              <p>Log more data to unlock predictive alerts!</p>
            </div>
          ) : (
            alerts.map((alert, i) => {
              const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.info;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-4 border-l-4"
                  style={{ backgroundColor: style.bg, borderLeftColor: style.border }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{alert.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge text-xs ${style.badge}`}>{alert.category}</span>
                        <span className={`badge text-xs ${style.badge} capitalize`}>
                          {alert.level}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm">{alert.title}</h3>
                      <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                      {alert.recommendation && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <span className="text-xs text-primary font-medium shrink-0">
                            💡 Tip:
                          </span>
                          <p className="text-xs text-slate-400">{alert.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Adaptive Goals */}
      {tab === 'adaptive' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : adaptive.length === 0 ? (
            <div className="space-y-4">
              <div className="card text-center py-10 text-slate-400">
                <p className="text-4xl mb-3">🎯</p>
                <p className="font-medium">No goal adjustments needed</p>
                <p className="text-sm mt-1">
                  Your current goals are well-aligned with your performance. Keep it up!
                </p>
              </div>
              <div className="card bg-primary/5 border-primary/20">
                <p className="text-sm text-slate-300">
                  Adaptive goals require at least{' '}
                  <span className="text-primary font-medium">5 data points over 14 days</span>{' '}
                  per metric. The AI compares your actual average against your set goals and
                  suggests adjustments of ±10–15%.
                </p>
              </div>
            </div>
          ) : (
            adaptive.map((s, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold capitalize">{s.type} Goal</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{s.reason}</p>
                  </div>
                  <span
                    className={`badge text-xs ${
                      s.direction === 'increase'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {s.direction === 'increase' ? '📈 Level Up' : '📉 Adjust Down'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Current Goal</p>
                    <p className="text-lg font-bold text-slate-300">
                      {s.currentGoal.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{METRIC_UNITS[s.type]}</p>
                  </div>
                  <div className="flex-1 text-center text-2xl">→</div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Suggested Goal</p>
                    <p className="text-lg font-bold text-primary">
                      {s.suggestedGoal.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{METRIC_UNITS[s.type]}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-slate-400">Your Average</p>
                    <p className="text-lg font-bold text-amber-400">
                      {s.avgActual.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{METRIC_UNITS[s.type]}</p>
                  </div>
                </div>
                <button
                  onClick={() => applyGoal(s)}
                  disabled={applying[s.type]}
                  className="btn-primary w-full text-sm"
                >
                  {applying[s.type]
                    ? 'Applying...'
                    : `✅ Apply New ${s.type.charAt(0).toUpperCase() + s.type.slice(1)} Goal`}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
