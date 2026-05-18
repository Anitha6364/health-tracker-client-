import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { NavSection, NavItem } from '../types';

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
    ],
  },
  {
    title: 'Track Health',
    items: [
      { to: '/metrics/steps',     label: 'Steps',      icon: '🚶' },
      { to: '/metrics/calories',  label: 'Calories',   icon: '🔥' },
      { to: '/metrics/water',     label: 'Water',      icon: '💧' },
      { to: '/metrics/sleep',     label: 'Sleep',      icon: '😴' },
      { to: '/metrics/weight',    label: 'Weight',     icon: '⚖️' },
      { to: '/metrics/heartRate', label: 'Heart Rate', icon: '❤️' },
      { to: '/metrics/exercise',  label: 'Exercise',   icon: '🏋️' },
    ],
  },
  {
    title: 'Log & Capture',
    items: [
      { to: '/nutrition', label: 'Nutrition',  icon: '🍎' },
      { to: '/mood',      label: 'Mood',       icon: '🧘' },
      { to: '/gps',       label: 'GPS Routes', icon: '🗺️' },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { to: '/insights',  label: 'Insights',  icon: '💡' },
      { to: '/ai-alerts', label: 'AI Alerts', icon: '🧠' },
      { to: '/goals',     label: 'Goals',     icon: '🎯' },
    ],
  },
  {
    title: 'Social & Tools',
    items: [
      { to: '/community',     label: 'Challenges',  icon: '🏆' },
      { to: '/notifications', label: 'Reminders',   icon: '🔔' },
      { to: '/export',        label: 'Export Data', icon: '📤' },
      { to: '/profile',       label: 'Profile',     icon: '👤' },
    ],
  },
];

const MOBILE_NAV: NavItem[] = [
  { to: '/',          label: 'Home',   icon: '🏠', exact: true },
  { to: '/nutrition', label: 'Food',   icon: '🍎' },
  { to: '/mood',      label: 'Mood',   icon: '🧘' },
  { to: '/gps',       label: 'GPS',    icon: '🗺️' },
  { to: '/community', label: 'Social', icon: '🏆' },
];

function Sidebar({ onClose }: { onClose: () => void }): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">💚</span>
          <span className="text-xl font-bold text-primary">HealthTracker</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }: { isActive: boolean }): string =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-dark-border hover:text-white'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-dark-border shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-secondary text-sm py-1.5">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function Layout(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-dark-card border-b border-dark-border flex items-center px-4 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-slate-400 hover:text-white mr-3"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-primary">💚 HealthTracker</span>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 overflow-y-auto pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark-card border-t border-dark-border md:hidden flex">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }: { isActive: boolean }): string =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
