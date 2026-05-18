import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  age: string;
  gender: string;
  height: string;
}

export default function Register(): JSX.Element {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    height: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; errors?: Array<{ msg: string }> }>;
      toast.error(
        axiosErr.response?.data?.message ||
          axiosErr.response?.data?.errors?.[0]?.msg ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const set =
    (field: keyof RegisterForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void =>
      setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">💚</span>
          <h1 className="text-3xl font-bold mt-3">HealthTracker</h1>
          <p className="text-slate-400 mt-1">Start your health journey today</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Enter your full name"
                value={form.name}
                onChange={set('name')}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Age</label>
                <input
                  type="number"
                  className="input"
                  placeholder="22"
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
                  placeholder="170"
                  value={form.height}
                  onChange={set('height')}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
