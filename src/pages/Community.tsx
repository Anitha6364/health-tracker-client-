import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Challenge, LeaderboardData } from '../types';

const TYPE_COLORS: Record<string, string> = {
  steps: '#10b981',
  water: '#3b82f6',
  sleep: '#8b5cf6',
  exercise: '#06b6d4',
  calories: '#f59e0b',
  weight: '#ec4899',
};

interface LeaderboardModalProps {
  challengeId: string;
  onClose: () => void;
}

interface LeaderboardApiResponse {
  challenge: LeaderboardData['challenge'];
  data: LeaderboardData['data'];
}

function LeaderboardModal({ challengeId, onClose }: LeaderboardModalProps): JSX.Element {
  const [data, setData] = useState<LeaderboardApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get<LeaderboardApiResponse>(`/social/leaderboard/${challengeId}`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [challengeId]);

  const rankEmoji = (rank: number): string =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md p-5"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">🏆 Leaderboard</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        {data?.challenge && (
          <p className="text-sm text-slate-400 mb-4">
            {data.challenge.title} · {data.challenge.target} {data.challenge.unit}
          </p>
        )}
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No participants yet. Be the first!
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data?.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 py-2.5 px-3 bg-dark rounded-xl"
              >
                <span className="text-lg w-8 text-center">{rankEmoji(entry.rank)}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.name}</p>
                  <div className="h-1.5 bg-dark-border rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">
                  {entry.progress.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ChallengeTab = 'all' | 'mine';

interface ChallengesApiResponse {
  data: Challenge[];
}

export default function Community(): JSX.Element {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ChallengeTab>('all');

  const load = (): void => {
    setLoading(true);
    api
      .get<ChallengesApiResponse>('/social/challenges')
      .then((r) => setChallenges(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const join = async (id: string): Promise<void> => {
    setJoining((j) => ({ ...j, [id]: true }));
    try {
      await api.post(`/social/challenges/${id}/join`);
      toast.success('🎉 Joined challenge!');
      load();
    } catch {
      toast.error('Failed to join');
    } finally {
      setJoining((j) => ({ ...j, [id]: false }));
    }
  };

  const filtered: Challenge[] =
    tab === 'all' ? challenges : challenges.filter((c) => c.joined);

  const tabOptions: Array<[ChallengeTab, string]> = [
    ['all', '🌍 All Challenges'],
    ['mine', '✅ My Challenges'],
  ];

  return (
    <div className="space-y-6">
      {selectedId && (
        <LeaderboardModal challengeId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold">🏆 Community Challenges</h1>
        <p className="text-slate-400 text-sm mt-1">
          Join fitness challenges and compete on the leaderboard
        </p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Active Challenges',
            value: challenges.length,
            icon: '🔥',
          },
          {
            label: 'Joined',
            value: challenges.filter((c) => c.joined).length,
            icon: '✅',
          },
          {
            label: 'Total Participants',
            value: challenges.reduce((s, c) => s + c.participantCount, 0),
            icon: '👥',
          },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl">{s.icon}</p>
            <p className="text-xl font-bold text-primary mt-1">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
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

      {/* Challenge cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">🏆</p>
          <p>No challenges found. Check back later!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const color = TYPE_COLORS[c.type] || '#10b981';
            const pct = c.target > 0 ? Math.min((c.myProgress / c.target) * 100, 100) : 0;
            return (
              <div
                key={c._id}
                className="card border-t-4"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-xs text-slate-400">
                        {c.duration} days · {c.target.toLocaleString()} {c.unit}
                      </p>
                    </div>
                  </div>
                  {c.joined && (
                    <span className="badge bg-primary/10 text-primary text-xs">✓ Joined</span>
                  )}
                </div>

                <p className="text-sm text-slate-400 mb-3">{c.description}</p>

                {c.joined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>My Progress</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!c.joined ? (
                    <button
                      onClick={() => join(c._id)}
                      disabled={joining[c._id]}
                      className="btn-primary flex-1 text-sm py-2"
                      style={{ backgroundColor: color }}
                    >
                      {joining[c._id] ? '...' : '+ Join Challenge'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedId(c._id)}
                      className="btn-secondary flex-1 text-sm py-2"
                    >
                      🏆 View Leaderboard
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <span>👥</span>
                    <span>{c.participantCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
