/// <reference types="vite/client" />
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExportItem } from '../types';

const EXPORTS: ExportItem[] = [
  {
    id: 'metrics',
    label: 'Health Metrics',
    icon: '📊',
    desc: 'All logged metrics: steps, heart rate, sleep, weight, water, calories, exercise',
    endpoint: '/export/metrics.csv',
    filename: 'health-metrics.csv',
    color: '#10b981',
  },
  {
    id: 'nutrition',
    label: 'Nutrition Log',
    icon: '🍎',
    desc: 'All meal logs with calories, protein, carbs, fats, and fiber breakdown',
    endpoint: '/export/nutrition.csv',
    filename: 'nutrition.csv',
    color: '#f59e0b',
  },
  {
    id: 'mood',
    label: 'Mood & Stress',
    icon: '🧘',
    desc: 'All mood check-ins with emotion, stress score, energy, and notes',
    endpoint: '/export/mood.csv',
    filename: 'mood-log.csv',
    color: '#8b5cf6',
  },
  {
    id: 'full',
    label: 'Full Export',
    icon: '📦',
    desc: 'Everything in one file — metrics, nutrition, and mood combined',
    endpoint: '/export/full.csv',
    filename: 'healthtracker-full-export.csv',
    color: '#3b82f6',
  },
];

export default function Export(): JSX.Element {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const download = async (exp: ExportItem): Promise<void> => {
    setDownloading((d) => ({ ...d, [exp.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseURL}${exp.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exp.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${exp.label} downloaded!`);
    } catch {
      toast.error('Download failed. Try again.');
    } finally {
      setDownloading((d) => ({ ...d, [exp.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📤 Data Export</h1>
        <p className="text-slate-400 text-sm mt-1">
          Download your health data as CSV for analysis or medical use
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {EXPORTS.map((exp) => (
          <div
            key={exp.id}
            className="card border-l-4"
            style={{ borderLeftColor: exp.color }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{exp.icon}</span>
              <div>
                <h3 className="font-semibold">{exp.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{exp.desc}</p>
              </div>
            </div>
            <button
              onClick={() => download(exp)}
              disabled={downloading[exp.id]}
              className="w-full py-2 rounded-xl text-white font-medium text-sm transition-colors"
              style={{
                backgroundColor: exp.color,
                opacity: downloading[exp.id] ? 0.7 : 1,
              }}
            >
              {downloading[exp.id] ? '⏳ Exporting...' : '⬇️ Download CSV'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2 text-sm">📋 Export notes</h2>
        <ul className="text-sm text-slate-400 space-y-1.5">
          <li>• Exports include all data — no date limit unless specified</li>
          <li>• CSV files can be opened in Excel, Google Sheets, or any data tool</li>
          <li>• Share exports with your doctor or dietitian for professional review</li>
          <li>• Your data is only sent to you — it is never shared with third parties</li>
          <li>• All exports are generated in real time from your database entries</li>
        </ul>
      </div>
    </div>
  );
}
