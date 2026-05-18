import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GPSRoute, RouteCoordinate } from '../types';

declare global {
  interface Window {
    L: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

type ActivityType = 'run' | 'walk' | 'cycle' | 'hike';
type TabType = 'track' | 'routes';

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  run: '🏃',
  walk: '🚶',
  cycle: '🚴',
  hike: '🥾',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  run: '#10b981',
  walk: '#3b82f6',
  cycle: '#f59e0b',
  hike: '#8b5cf6',
};

function haversine(a: RouteCoordinate, b: RouteCoordinate): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

interface StatBoxProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatBox({ label, value, sub, color = '#10b981' }: StatBoxProps): JSX.Element {
  return (
    <div className="card text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

interface GPSApiResponse {
  data: GPSRoute[];
}

interface PostRouteResponse {
  data: GPSRoute;
}

export default function GPSTracker(): JSX.Element {
  const [tracking, setTracking] = useState<boolean>(false);
  const [coords, setCoords] = useState<RouteCoordinate[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [activity, setActivity] = useState<ActivityType>('run');
  const [saved, setSaved] = useState<GPSRoute[]>([]);
  const [tab, setTab] = useState<TabType>('track');
  const [saving, setSaving] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const polyline = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const marker = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Dynamically load Leaflet
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Init map once Leaflet is ready and container is rendered
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletMap.current) return;
    leafletMap.current = window.L.map(mapRef.current).setView([20.5937, 78.9629], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(leafletMap.current);
    polyline.current = window.L
      .polyline([], { color: ACTIVITY_COLORS[activity], weight: 4 })
      .addTo(leafletMap.current);
  }, [mapLoaded, tab]);

  // Load saved routes
  useEffect(() => {
    api
      .get<GPSApiResponse>('/gps')
      .then((r) => setSaved(r.data.data || []))
      .catch(() => {});
  }, []);

  const addPoint = useCallback(
    (pos: GeolocationPosition): void => {
      const pt: RouteCoordinate = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: Date.now(),
      };
      setCoords((prev) => {
        const next = [...prev, pt];
        if (next.length >= 2) {
          const d = haversine(next[next.length - 2], next[next.length - 1]);
          setDistance((dd) => dd + d);
        }
        if (polyline.current) {
          polyline.current.addLatLng([pt.lat, pt.lng]);
          polyline.current.setStyle({ color: ACTIVITY_COLORS[activity] });
        }
        if (leafletMap.current) {
          if (!marker.current) {
            marker.current = window.L
              .circleMarker([pt.lat, pt.lng], {
                radius: 8,
                color: ACTIVITY_COLORS[activity],
                fillColor: ACTIVITY_COLORS[activity],
                fillOpacity: 1,
              })
              .addTo(leafletMap.current);
          } else {
            marker.current.setLatLng([pt.lat, pt.lng]);
          }
          leafletMap.current.panTo([pt.lat, pt.lng]);
        }
        return next;
      });
    },
    [activity]
  );

  const startTracking = (): void => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device.');
      return;
    }
    setCoords([]);
    setDistance(0);
    setDuration(0);
    if (polyline.current) polyline.current.setLatLngs([]);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    watchId.current = navigator.geolocation.watchPosition(
      addPoint,
      (err: GeolocationPositionError) => {
        toast.error(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    setTracking(true);
    toast.success(
      `${ACTIVITY_ICONS[activity]} ${activity.charAt(0).toUpperCase() + activity.slice(1)} started!`
    );
  };

  const stopTracking = (): void => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (timerRef.current !== null) clearInterval(timerRef.current);
    setTracking(false);
    toast('Session stopped. Save your route below!', { icon: '⏹️' });
  };

  const saveRoute = async (): Promise<void> => {
    if (coords.length < 2) {
      toast.error('Not enough GPS points to save.');
      return;
    }
    setSaving(true);
    try {
      const avgSpeed =
        distance > 0 && duration > 0 ? (distance / 1000) / (duration / 3600) : 0;
      const avgPace = avgSpeed > 0 ? 60 / avgSpeed : 0;
      const calories = Math.round(
        (distance / 1000) * 65 * (activity === 'cycle' ? 0.5 : 1)
      );

      const res = await api.post<PostRouteResponse>('/gps', {
        name: `${activity.charAt(0).toUpperCase() + activity.slice(1)} — ${new Date().toLocaleDateString()}`,
        activityType: activity,
        coordinates: coords,
        distance: Math.round(distance),
        duration,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        avgPace: Math.round(avgPace * 10) / 10,
        calories,
      });
      setSaved((p) => [res.data.data, ...p]);
      setCoords([]);
      setDistance(0);
      setDuration(0);
      if (polyline.current) polyline.current.setLatLngs([]);
      toast.success('Route saved! 🗺️');
      setTab('routes');
    } catch {
      toast.error('Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoute = async (id: string): Promise<void> => {
    await api.delete(`/gps/${id}`);
    setSaved((p) => p.filter((r) => r._id !== id));
    toast.success('Route deleted');
  };

  const km = (distance / 1000).toFixed(2);
  const speed =
    duration > 0 && distance > 0
      ? ((distance / 1000) / (duration / 3600)).toFixed(1)
      : '0';
  const pace = parseFloat(speed) > 0 ? (60 / parseFloat(speed)).toFixed(1) : '—';

  const tabOptions: Array<[TabType, string]> = [
    ['track', '📍 Track'],
    ['routes', '📋 Saved Routes'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🗺️ GPS Route Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track your outdoor runs, walks, and cycles in real time
        </p>
      </div>

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

      {tab === 'track' && (
        <div className="space-y-4">
          {/* Activity type selector */}
          {!tracking && (
            <div className="card">
              <h2 className="font-semibold mb-3 text-sm">Activity Type</h2>
              <div className="flex gap-3">
                {(Object.entries(ACTIVITY_ICONS) as Array<[ActivityType, string]>).map(
                  ([a, icon]) => (
                    <button
                      key={a}
                      onClick={() => setActivity(a)}
                      className={`flex-1 py-3 rounded-xl text-center transition-all ${
                        activity === a
                          ? 'ring-2 text-white'
                          : 'bg-dark-border text-slate-400 hover:text-white'
                      }`}
                      style={
                        activity === a
                          ? { backgroundColor: ACTIVITY_COLORS[a], outline: `2px solid ${ACTIVITY_COLORS[a]}` }
                          : {}
                      }
                    >
                      <div className="text-2xl">{icon}</div>
                      <div className="text-xs mt-1 font-medium capitalize">{a}</div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Distance" value={`${km} km`} color={ACTIVITY_COLORS[activity]} />
            <StatBox
              label="Duration"
              value={formatTime(duration)}
              color={ACTIVITY_COLORS[activity]}
            />
            <StatBox
              label="Avg Speed"
              value={speed}
              sub="km/h"
              color={ACTIVITY_COLORS[activity]}
            />
          </div>

          {/* Map */}
          <div className="card p-0 overflow-hidden rounded-2xl">
            {!mapLoaded && (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Loading map…
              </div>
            )}
            <div
              ref={mapRef}
              style={{ height: 280, display: mapLoaded ? 'block' : 'none' }}
            />
          </div>

          {/* GPS notice */}
          <div className="flex items-start gap-2 text-xs text-slate-500 bg-dark-card border border-dark-border rounded-xl px-4 py-3">
            <span>ℹ️</span>
            <span>
              GPS tracking uses your device's location. Allow location access when prompted. Works
              best outdoors with clear sky view.
            </span>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!tracking ? (
              <button
                onClick={startTracking}
                className="btn-primary flex-1 py-3 text-base"
                style={{ backgroundColor: ACTIVITY_COLORS[activity] }}
              >
                {ACTIVITY_ICONS[activity]} Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors text-base"
              >
                ⏹ Stop
              </button>
            )}
            {!tracking && coords.length >= 2 && (
              <button onClick={saveRoute} disabled={saving} className="btn-primary px-6">
                {saving ? '...' : '💾 Save'}
              </button>
            )}
          </div>

          {tracking && (
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Tracking {ACTIVITY_ICONS[activity]} {activity} · {coords.length} GPS points
            </div>
          )}

          {/* Show pace only when calculated */}
          {!tracking && coords.length >= 2 && pace !== '—' && (
            <p className="text-xs text-slate-500">Avg pace: {pace} min/km</p>
          )}
        </div>
      )}

      {tab === 'routes' && (
        <div className="space-y-3">
          {saved.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🗺️</p>
              <p>No saved routes yet. Go for a run or walk!</p>
            </div>
          ) : (
            saved.map((r) => (
              <div key={r._id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ACTIVITY_ICONS[r.activityType]}</span>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(r.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRoute(r._id)}
                    className="text-slate-600 hover:text-red-400"
                  >
                    🗑️
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {(
                    [
                      ['📏', `${(r.distance / 1000).toFixed(2)} km`, 'Distance'],
                      ['⏱️', formatTime(r.duration), 'Duration'],
                      ['💨', `${r.avgSpeed} km/h`, 'Avg Speed'],
                      ['🔥', `${r.calories} kcal`, 'Calories'],
                    ] as Array<[string, string, string]>
                  ).map(([icon, val, lbl]) => (
                    <div key={lbl} className="bg-dark rounded-xl p-2 text-center">
                      <div className="text-sm">{icon}</div>
                      <div className="text-sm font-bold text-primary">{val}</div>
                      <div className="text-xs text-slate-500">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
