const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UserSession {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export interface Product {
  id: number | string | null;
  name: string | null;
  description: string | null;
  price: number | string | null;
  stock: number | string | null;
  category: string | null;
  image_url: string | null;
}

export interface OrderSummary {
  id: number;
  quantity: number;
  total_price: string | number;
  status: string;
  created_at: string;
  product_name: string;
  unit_price: string | number;
  category: string;
}

export interface OrderDetail {
  id: number;
  user_id: number;
  quantity: number;
  total_price: string | number;
  shipping_address: string;
  recipient_phone: string;
  status: string;
  created_at: string;
  product_name: string;
  unit_price: string | number;
  product_desc: string;
  buyer_name: string;
  buyer_email: string;
}

export class ApiError extends Error {
  status: number;
  query?: string;

  constructor(message: string, status: number, query?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.query = query;
  }
}

export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('techstore_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || 'Terjadi kesalahan pada server',
      response.status,
      data.query
    );
  }
  return data as T;
}

export function getStoredUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('techstore_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('techstore_token');
}

export function setAuthSession(token: string, user: UserSession) {
  localStorage.setItem('techstore_token', token);
  localStorage.setItem('techstore_user', JSON.stringify(user));
  window.dispatchEvent(new Event('techstore-auth-change'));
}

export function clearAuthSession() {
  localStorage.removeItem('techstore_token');
  localStorage.removeItem('techstore_user');
  window.dispatchEvent(new Event('techstore-auth-change'));
}

export { API_URL };
