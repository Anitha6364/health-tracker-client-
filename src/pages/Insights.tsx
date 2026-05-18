import { useState, useEffect } from 'react';
import api from '../services/api';
import { Insight } from '../types';

const TYPE_COLORS: Record<string, string> = {
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
};

const TYPE_BG: Record<string, string> = {
  warning: 'rgba(245,158,11,0.1)',
  success: 'rgba(16,185,129,0.1)',
  info: 'rgba(59,130,246,0.1)',
};

interface InsightsApiResponse {
  data: Insight[];
}

export default function Insights(): JSX.Element {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get<InsightsApiResponse>('/dashboard/insights')
      .then((res) => setInsights(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧠 Health Insights</h1>
        <p className="text-slate-400 text-sm mt-1">
          Personalized analysis based on your last 7 days of data
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Log your health metrics for at least a few days to see insights!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="card border-l-4 flex items-start gap-4"
              style={{
                borderLeftColor: TYPE_COLORS[insight.type],
                backgroundColor: TYPE_BG[insight.type],
              }}
            >
              <span className="text-3xl mt-0.5">{insight.icon}</span>
              <div>
                <span
                  className="badge text-xs mb-1"
                  style={{
                    backgroundColor: TYPE_BG[insight.type],
                    color: TYPE_COLORS[insight.type],
                  }}
                >
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </span>
                <p className="text-sm leading-relaxed mt-1">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/30">
        <h2 className="font-semibold mb-2">💡 Tips for better health tracking</h2>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Log your metrics at the same time each day for consistency</li>
          <li>Aim to log at least 5 different metric types daily</li>
          <li>Set realistic goals and gradually increase them over time</li>
          <li>Use the notes field to record how you felt that day</li>
          <li>Review your weekly trends every Sunday to plan the next week</li>
        </ul>
      </div>
    </div>
  );
}
