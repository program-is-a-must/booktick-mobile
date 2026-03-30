export const API_BASE = __DEV__
  ? 'http://172.22.140.226:8000/api'
  : 'https://your-app.onrender.com/api';

export async function apiCall(
  endpoint: string,
  token:    string | null,
  options:  RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { message: 'Network error — check your connection' } };
  }
}