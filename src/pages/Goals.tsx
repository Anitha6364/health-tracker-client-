import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MetricType } from '../types';

interface GoalConfig {
  label: string;
  icon: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const GOAL_CONFIG: Record<MetricType, GoalConfig> = {
  steps:     { label: 'Daily Steps',    icon: '🚶', unit: 'steps',   min: 1000, max: 30000, step: 500 },
  calories:  { label: 'Calories',       icon: '🔥', unit: 'kcal',    min: 1000, max: 5000,  step: 100 },
  water:     { label: 'Water Intake',   icon: '💧', unit: 'ml',      min: 500,  max: 5000,  step: 100 },
  sleep:     { label: 'Sleep Duration', icon: '😴', unit: 'hours',   min: 4,    max: 12,    step: 0.5 },
  weight:    { label: 'Target Weight',  icon: '⚖️', unit: 'kg',      min: 30,   max: 200,   step: 0.5 },
  heartRate: { label: 'Resting HR',     icon: '❤️', unit: 'bpm',     min: 40,   max: 120,   step: 1 },
  exercise:  { label: 'Exercise',       icon: '🏃', unit: 'minutes', min: 5,    max: 180,   step: 5 },
};

interface GoalData {
  target: number;
  unit: string;
}

interface GoalsApiResponse {
  data: Partial<Record<MetricType, GoalData>>;
}

export default function Goals(): JSX.Element {
  const [goals, setGoals] = useState<Partial<Record<MetricType, GoalData>>>({});
  const [editing, setEditing] = useState<Partial<Record<MetricType, string | number>>>({});
  const [saving, setSaving] = useState<Partial<Record<MetricType, boolean>>>({});

  useEffect(() => {
    api
      .get<GoalsApiResponse>('/goals')
      .then((res) => {
        const g = res.data.data;
        setGoals(g);
        const edits: Partial<Record<MetricType, number>> = {};
        (Object.keys(g) as MetricType[]).forEach((k) => {
          const target = g[k]?.target;
          if (target !== undefined) edits[k] = target;
        });
        setEditing(edits);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (type: MetricType): Promise<void> => {
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      await api.put(`/goals/${type}`, {
        target: Number(editing[type]),
        unit: GOAL_CONFIG[type].unit,
      });
      setGoals((g) => ({
        ...g,
        [type]: { target: Number(editing[type]), unit: GOAL_CONFIG[type].unit },
      }));
      toast.success(`${GOAL_CONFIG[type].label} goal updated!`);
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎯 My Goals</h1>
        <p className="text-slate-400 text-sm mt-1">
          Set daily targets to track your progress on the dashboard
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Object.entries(GOAL_CONFIG) as Array<[MetricType, GoalConfig]>).map(([type, cfg]) => (
          <div key={type} className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cfg.icon}</span>
              <span className="font-medium">{cfg.label}</span>
              <span className="text-xs text-slate-400 ml-auto">{cfg.unit}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="input flex-1"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={editing[type] ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditing((ed) => ({ ...ed, [type]: e.target.value }))
                }
              />
              <button
                onClick={() => handleSave(type)}
                disabled={saving[type]}
                className="btn-primary px-4 text-sm"
              >
                {saving[type] ? '...' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Range: {cfg.min} – {cfg.max} {cfg.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
