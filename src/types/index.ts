export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
}

export type MetricType = 'steps' | 'calories' | 'water' | 'sleep' | 'weight' | 'heartRate' | 'exercise';

export interface Metric {
  id: string;
  _id: string;
  type: MetricType;
  value: number;
  unit: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Goal {
  type: MetricType;
  target: number;
  unit: string;
}

export interface NutritionEntry {
  id: string;
  _id: string;
  mealName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  note?: string;
  date: string;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export type EmotionType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface MoodEntry {
  id: string;
  _id: string;
  emotion: EmotionType;
  score: number;
  energy: number;
  note?: string;
  tags: string[];
  date: string;
}

export interface RouteCoordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface GPSRoute {
  id: string;
  _id: string;
  name: string;
  activityType: 'run' | 'walk' | 'cycle' | 'hike';
  coordinates?: RouteCoordinate[];
  distance: number;
  duration: number;
  avgPace: number;
  avgSpeed: number;
  calories: number;
  elevationGain: number;
  date: string;
}

export interface Challenge {
  id: string;
  _id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  unit: string;
  duration: number;
  icon: string;
  participants: Array<{ userId: string; progress: number; joinedAt: string }>;
  isPublic: boolean;
  joined: boolean;
  myProgress: number;
  participantCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  rank: number;
  progress: number;
  percentage: number;
}

export interface LeaderboardData {
  challenge: { title: string; target: number; unit: string };
  data: LeaderboardEntry[];
}

export interface Alert {
  icon: string;
  category: string;
  level: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  recommendation?: string;
}

export interface AdaptiveGoal {
  type: MetricType;
  currentGoal: number;
  suggestedGoal: number;
  avgActual: number;
  direction: 'increase' | 'decrease';
  reason: string;
}

export interface WeeklyMetricPoint {
  date: string;
  value: number;
}

export interface DashboardSummary {
  today: Partial<Record<MetricType, { value: number }>>;
  weekly: Partial<Record<MetricType, WeeklyMetricPoint[]>>;
  healthScore: number;
  goals: Partial<Record<MetricType, number>>;
}

export interface Insight {
  type: 'warning' | 'success' | 'info';
  icon: string;
  title: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Reminder {
  id: string;
  label: string;
  icon: string;
  time: string;
  enabled: boolean;
  message: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface ExportItem {
  id: string;
  label: string;
  icon: string;
  desc: string;
  endpoint: string;
  filename: string;
  color: string;
}
