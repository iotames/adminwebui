const BASE_URL = '';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as T;
}

export function get<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' });
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body });
}

export function put<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body });
}

export function del<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' });
}
