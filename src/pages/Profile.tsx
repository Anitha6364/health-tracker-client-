import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  age: string | number;
  gender: string;
  height: string | number;
}

export default function Profile(): JSX.Element {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    height: user?.height || '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const bmi =
    form.height && user?.weight
      ? (user.weight / ((Number(form.height) / 100) ** 2)).toFixed(1)
      : null;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: String(form.name),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender as 'male' | 'female' | 'other' | undefined,
        height: form.height ? Number(form.height) : undefined,
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const set =
    (field: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
      setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">👤 Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          {bmi && <p className="text-xs text-primary mt-0.5">BMI: {bmi}</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={set('name')}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Age</label>
              <input
                type="number"
                className="input"
                value={form.age}
                onChange={set('age')}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Gender</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                className="input"
                value={form.height}
                onChange={set('height')}
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
