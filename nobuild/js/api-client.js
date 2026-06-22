// 默认同域（mock 模式）。对接真实后端时设为后端地址。
// 也可在 index.html 中通过 <script>window.__ENV__={BASE_API_URL:'https://...'}</script> 注入。
const BASE_URL = window.__ENV__?.BASE_API_URL || '';

export async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export function get(url) { return request(url, { method: 'GET' }); }
export function post(url, body) { return request(url, { method: 'POST', body }); }
export function put(url, body) { return request(url, { method: 'PUT', body }); }
export function del(url) { return request(url, { method: 'DELETE' }); }
