'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  fetchWithAuth,
  setAuthSession,
  UserSession,
} from '@/lib/api';

interface LoginResponse {
  message: string;
  token: string;
  user: UserSession;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<{
    status: number;
    message: string;
    query?: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorState(null);

    try {
      const res = await fetchWithAuth<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setAuthSession(res.token, res.user);
      router.push('/orders');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorState({
          status: err.status,
          message: err.message,
          query: err.query,
        });
      } else {
        setErrorState({
          status: 500,
          message: err instanceof Error ? err.message : 'Gagal terhubung ke server',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Masuk ke TechStore</h1>
          <p className="mt-1 text-sm text-slate-600">
            Silakan masuk untuk melihat riwayat pesanan dan detail invoice Anda.
          </p>
        </div>

        {errorState && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900"
          >
            <p className="font-bold">
              {errorState.status === 500
                ? `Database Error (HTTP 500): ${errorState.message}`
                : `HTTP ${errorState.status} Unauthorized: ${errorState.message}`}
            </p>
            {errorState.query && (
              <pre className="mt-2 overflow-x-auto rounded-lg border border-rose-200 bg-white p-2.5 font-mono text-xs text-rose-800">
                {errorState.query}
              </pre>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Masuk ke Akun'}
          </button>
        </form>

        {/* Demo Helper Box */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Akun Uji Coba (Lab Demo Helper):
          </p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>
              <span className="font-semibold text-slate-800">alice</span> /
              AliceSecret#88 (Customer)
            </li>
            <li>
              <span className="font-semibold text-slate-800">bob</span> /
              BobPassword123 (Customer)
            </li>
            <li>
              <span className="font-semibold text-slate-800">admin</span> /
              AdminMaster2026! (Admin)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
