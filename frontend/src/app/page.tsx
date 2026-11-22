'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, fetchWithAuth, Product } from '@/lib/api';

interface ProductsResponse {
  count: number;
  data: Product[];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<{
    status: number;
    message: string;
    query?: string;
  } | null>(null);

  const loadProducts = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setErrorState(null);
    try {
      const endpoint = searchTerm
        ? `/api/products?search=${encodeURIComponent(searchTerm)}`
        : '/api/products';
      const res = await fetchWithAuth<ProductsResponse>(endpoint);
      setProducts(res.data || []);
      setActiveQuery(searchTerm);
    } catch (err) {
      setProducts([]);
      if (err instanceof ApiError) {
        setErrorState({
          status: err.status,
          message: err.message,
          query: err.query,
        });
      } else {
        setErrorState({
          status: 500,
          message:
            err instanceof Error ? err.message : 'Gagal memuat katalog produk',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchWithAuth<ProductsResponse>('/api/products')
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data || []);
          setActiveQuery('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setProducts([]);
        if (err instanceof ApiError) {
          setErrorState({
            status: err.status,
            message: err.message,
            query: err.query,
          });
        } else {
          setErrorState({
            status: 500,
            message:
              err instanceof Error ? err.message : 'Gagal memuat katalog produk',
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
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    loadProducts(searchInput);
  };

  const handleReset = () => {
    setSearchInput('');
    loadProducts('');
  };

  const isValidHttpUrl = (val: string | null): boolean => {
    if (!val) return false;
    return val.startsWith('http://') || val.startsWith('https://');
  };

  return (
    <div className="space-y-8">
      {/* Hero & Search Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Katalog Gadget &amp; Aksesoris Tech
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Temukan laptop, peripheral mekanikal, monitor, dan perlengkapan kerja
            terbaik untuk kebutuhan teknis Anda.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari laptop, keyboard, mouse..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Search status banner */}
        {!loading && !errorState && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              Menampilkan{' '}
              <strong className="font-semibold text-slate-800">
                {products.length}
              </strong>{' '}
              produk
            </span>
            {activeQuery && (
              <span>
                untuk kata kunci:{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                  {activeQuery}
                </code>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Error Box (Database Error / SQLi Error-Based Feedback) */}
      {errorState && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-900 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
              HTTP {errorState.status}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold">
                Database Error (HTTP {errorState.status}): {errorState.message}
              </h2>
              {errorState.query && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Executed SQL Query:
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-rose-200 bg-white p-3 font-mono text-xs text-rose-800">
                    {errorState.query}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="h-44 rounded-xl bg-slate-200" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded bg-slate-100" />
              <div className="mt-6 h-5 w-1/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : products.length === 0 && !errorState ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            Tidak ada produk yang cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, idx) => (
            <article
              key={product.id ?? `row-${idx}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {isValidHttpUrl(product.image_url) ? (
                <div className="h-48 w-full overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url as string}
                    alt={product.name || 'Produk TechStore'}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : product.image_url ? (
                <div className="border-b border-amber-200 bg-amber-50 p-4">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                    Extra Info / Non-URL Field
                  </span>
                  <p className="mt-1 break-words font-mono text-xs text-amber-900">
                    {product.image_url}
                  </p>
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
                  Tidak ada gambar
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {product.category || 'Uncategorized'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {product.stock != null ? `Stok: ${product.stock}` : 'Stok: -'}
                  </span>
                </div>

                <h2 className="mt-3 text-base font-bold text-slate-900">
                  {product.name ?? '-'}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
                  {product.description ?? '-'}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-lg font-bold text-indigo-600">
                    {product.price != null
                      ? `Rp ${Number(product.price).toLocaleString('id-ID')}`
                      : 'Rp -'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
