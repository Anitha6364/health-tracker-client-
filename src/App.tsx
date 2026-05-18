import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MetricPage from './pages/MetricPage';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Insights from './pages/Insights';
import Nutrition from './pages/Nutrition';
import MoodTracker from './pages/MoodTracker';
import GPSTracker from './pages/GPSTracker';
import Community from './pages/Community';
import Notifications from './pages/Notifications';
import Export from './pages/Export';
import PredictiveAlerts from './pages/PredictiveAlerts';

function PrivateRoute({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }): JSX.Element | null {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App(): JSX.Element {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="metrics/:type" element={<MetricPage />} />
          <Route path="nutrition"     element={<Nutrition />} />
          <Route path="mood"          element={<MoodTracker />} />
          <Route path="gps"           element={<GPSTracker />} />
          <Route path="community"     element={<Community />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="export"        element={<Export />} />
          <Route path="ai-alerts"     element={<PredictiveAlerts />} />
          <Route path="insights"      element={<Insights />} />
          <Route path="goals"         element={<Goals />} />
          <Route path="profile"       element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}
