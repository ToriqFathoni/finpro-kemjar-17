'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ApiError,
  fetchWithAuth,
  getStoredToken,
  OrderSummary,
} from '@/lib/api';

interface OrdersResponse {
  data: OrderSummary[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchWithAuth<OrdersResponse>('/api/orders')
      .then((res) => {
        setOrders(res.data || []);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.push('/login');
          return;
        }
        setErrorMsg(
          err instanceof Error ? err.message : 'Gagal memuat riwayat pesanan'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const statusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Riwayat Pesanan Saya
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Daftar transaksi pembelian yang terhubung dengan akun Anda.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Katalog
        </Link>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          Belum ada pesanan pada akun ini.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">ID Pesanan</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Produk</th>
                  <th className="px-6 py-3.5">Qty &amp; Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-semibold text-slate-900">
                      #{order.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {order.product_name}
                      </p>
                      <p className="text-xs text-slate-500">{order.category}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-slate-600">{order.quantity}x — </span>
                      <span className="font-semibold text-slate-900">
                        Rp {Number(order.total_price).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        Lihat Detail Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
