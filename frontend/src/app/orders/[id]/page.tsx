'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  ApiError,
  fetchWithAuth,
  getStoredToken,
  OrderDetail,
} from '@/lib/api';

interface OrderDetailResponse {
  data: OrderDetail;
}

function OrderInvoiceContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<{
    status: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    if (!orderId) return;

    let cancelled = false;

    fetchWithAuth<OrderDetailResponse>(`/api/orders/${orderId}`)
      .then((res) => {
        if (!cancelled) {
          setErrorState(null);
          setOrder(res.data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.push('/login');
            return;
          }
          setErrorState({ status: err.status, message: err.message });
        } else {
          setErrorState({
            status: 500,
            message:
              err instanceof Error ? err.message : 'Gagal memuat detail invoice',
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          &larr; Kembali ke Riwayat Pesanan
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Memuat detail invoice #{orderId}...
        </div>
      ) : errorState ? (
        errorState.status === 403 ? (
          <div
            role="alert"
            className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-8 text-rose-900 shadow-sm"
          >
            <span className="inline-block rounded-md bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Access Control Enforced
            </span>
            <h1 className="mt-3 text-xl font-bold text-rose-950">
              HTTP 403 Forbidden — Akses Ditolak
            </h1>
            <p className="mt-2 text-sm text-rose-800">{errorState.message}</p>
          </div>
        ) : errorState.status === 404 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              HTTP 404: Pesanan tidak ditemukan
            </h1>
            <p className="mt-1 text-sm text-slate-600">{errorState.message}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
            <strong>HTTP {errorState.status}:</strong> {errorState.message}
          </div>
        )
      ) : order ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Invoice Header */}
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                  TechStore Official Invoice
                </p>
                <h1 className="mt-1 font-mono text-2xl font-bold">
                  INV/2026/000{order.id}
                </h1>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-400/30">
                  {order.status}
                </span>
                <p className="mt-2 text-xs text-slate-300">
                  Tanggal:{' '}
                  {new Date(order.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            {/* Informasi Pengiriman & PII */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Informasi Penerima &amp; Pengiriman
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Nama Penerima</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {order.buyer_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email Penerima</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {order.buyer_email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">No. Kontak / HP</dt>
                  <dd className="mt-0.5 font-mono font-medium text-slate-900">
                    {order.recipient_phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">ID Pemilik (User ID)</dt>
                  <dd className="mt-0.5 font-mono text-slate-700">
                    #{order.user_id}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Alamat Pengiriman</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {order.shipping_address}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Rincian Item */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rincian Barang
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Produk</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {order.product_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {order.product_desc}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-slate-700">
                        Rp {Number(order.unit_price).toLocaleString('id-ID')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center text-slate-700">
                        {order.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-slate-900">
                        Rp {Number(order.total_price).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Pembayaran */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-5">
              <span className="text-sm font-medium text-slate-600">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                Rp {Number(order.total_price).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function OrderInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Memuat detail invoice...
        </div>
      }
    >
      <OrderInvoiceContent />
    </Suspense>
  );
}
