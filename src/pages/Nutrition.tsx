import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import { NutritionEntry, NutritionTotals } from '../types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
  drink: '🥤',
};

const MACRO_COLORS: Record<string, string> = {
  protein: '#10b981',
  carbs: '#3b82f6',
  fats: '#f59e0b',
  fiber: '#8b5cf6',
};

const CALORIE_GOAL = 2000;

interface MacroRingProps {
  label: string;
  value: number;
  goal: number;
  color: string;
}

function MacroRing({ label, value, goal, color }: MacroRingProps): JSX.Element {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#334155" strokeWidth="7" />
        <circle
          cx="35"
          cy="35"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x="35" y="39" textAnchor="middle" fill={color} fontSize="13" fontWeight="700">
          {Math.round(value)}
        </text>
      </svg>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <p className="text-xs text-slate-500">{goal}g goal</p>
    </div>
  );
}

interface NutritionForm {
  mealName: string;
  mealType: MealType;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  note: string;
}

interface NutritionApiResponse {
  data: NutritionEntry[];
  todayTotals: NutritionTotals;
}

interface PostNutritionResponse {
  data: NutritionEntry;
}

interface PieDataPoint {
  name: string;
  value: number;
}

const MACRO_FIELDS: Array<{ f: keyof NutritionForm; label: string; ph: string }> = [
  { f: 'calories', label: 'Calories *', ph: '450' },
  { f: 'protein',  label: 'Protein (g)', ph: '30' },
  { f: 'carbs',    label: 'Carbs (g)',   ph: '60' },
  { f: 'fats',     label: 'Fats (g)',    ph: '15' },
  { f: 'fiber',    label: 'Fiber (g)',   ph: '5' },
];

export default function Nutrition(): JSX.Element {
  const [meals, setMeals] = useState<NutritionEntry[]>([]);
  const [totals, setTotals] = useState<NutritionTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<'log' | 'history'>('log');
  const [form, setForm] = useState<NutritionForm>({
    mealName: '',
    mealType: 'lunch',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const load = (): void => {
    setLoading(true);
    api
      .get<NutritionApiResponse>('/nutrition')
      .then((res) => {
        setMeals(res.data.data || []);
        setTotals(
          res.data.todayTotals || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set =
    (f: keyof NutritionForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
      setForm({ ...form, [f]: e.target.value });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!form.mealName || !form.calories) {
      toast.error('Meal name and calories are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post<PostNutritionResponse>('/nutrition', { ...form });
      toast.success(`${MEAL_ICONS[form.mealType]} ${form.mealName} logged!`);
      setForm({
        mealName: '',
        mealType: 'lunch',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        fiber: '',
        note: '',
      });
      load();
    } catch {
      toast.error('Failed to log meal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    await api.delete(`/nutrition/${id}`);
    setMeals((prev) => prev.filter((m) => m._id !== id));
    load();
    toast.success('Removed');
  };

  const caloriePct = Math.min((totals.calories / CALORIE_GOAL) * 100, 100);
  const pieData: PieDataPoint[] = [
    { name: 'Protein', value: totals.protein * 4 },
    { name: 'Carbs',   value: totals.carbs * 4 },
    { name: 'Fats',    value: totals.fats * 9 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🍎 Nutrition Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Log meals and track your daily macros</p>
      </div>

      {/* Calorie bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Today's Calories</span>
          <span className="text-sm text-slate-400">
            <span className="text-white font-bold text-lg">{Math.round(totals.calories)}</span> /{' '}
            {CALORIE_GOAL} kcal
          </span>
        </div>
        <div className="h-3 bg-dark-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${caloriePct}%`,
              backgroundColor: caloriePct > 100 ? '#ef4444' : '#10b981',
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {CALORIE_GOAL - totals.calories > 0
            ? `${Math.round(CALORIE_GOAL - totals.calories)} kcal remaining`
            : `${Math.round(totals.calories - CALORIE_GOAL)} kcal over goal`}
        </p>
      </div>

      {/* Macros + Pie */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-4 text-sm">Macro Breakdown</h2>
          <div className="flex justify-around">
            <MacroRing label="Protein" value={totals.protein} goal={150} color={MACRO_COLORS.protein} />
            <MacroRing label="Carbs"   value={totals.carbs}   goal={250} color={MACRO_COLORS.carbs} />
            <MacroRing label="Fats"    value={totals.fats}    goal={65}  color={MACRO_COLORS.fats} />
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2 text-sm">Calorie Sources</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={Object.values(MACRO_COLORS)[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v: number, n: string) => [`${Math.round(v)} kcal`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
              Log a meal to see breakdown
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['log', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-dark-border text-slate-400 hover:text-white'
            }`}
          >
            {t === 'log' ? '+ Log Meal' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Log a Meal</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Meal Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Chicken Rice Bowl"
                  value={form.mealName}
                  onChange={set('mealName')}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Meal Type</label>
                <select className="input" value={form.mealType} onChange={set('mealType')}>
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MEAL_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {MACRO_FIELDS.map(({ f, label, ph }) => (
                <div key={f}>
                  <label className="text-xs text-slate-400 block mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="input"
                    placeholder={ph}
                    value={form[f]}
                    onChange={set(f)}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Note (optional)</label>
              <input
                className="input"
                placeholder="e.g. Restaurant meal, homemade..."
                value={form.note}
                onChange={set('note')}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Logging...' : '🍽️ Log Meal'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Meal History</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No meals logged yet.</div>
          ) : (
            <div className="space-y-2">
              {meals.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between py-2.5 px-3 bg-dark rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{MEAL_ICONS[m.mealType]}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.mealName}</p>
                      <p className="text-xs text-slate-400">
                        🔥 {m.calories} kcal · P:{m.protein}g · C:{m.carbs}g · F:{m.fats}g
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-slate-500">
                      {new Date(m.date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(m._id)}
                      className="text-slate-600 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
