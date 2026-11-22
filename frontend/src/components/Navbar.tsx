'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  API_URL,
  clearAuthSession,
  getStoredUser,
  UserSession,
} from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };
    syncUser();

    window.addEventListener('techstore-auth-change', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('techstore-auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [pathname]);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              TS
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              TechStore
            </span>
          </Link>

          <span
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${
              apiOnline === true
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : apiOnline === false
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            title={`Backend API: ${API_URL}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiOnline === true
                  ? 'bg-emerald-500'
                  : apiOnline === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
              }`}
            />
            API: {API_URL.replace(/^https?:\/\//, '')}
          </span>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Katalog Gadget
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 md:inline">
                Halo,{' '}
                <strong className="font-semibold text-slate-900">
                  {user.fullName}
                </strong>{' '}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                  {user.role}
                </span>
              </span>
              <Link
                href="/orders"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith('/orders')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Pesanan Saya
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Keluar
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Masuk Akun
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
