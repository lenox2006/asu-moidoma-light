// Тонкий HTTP-клиент к backend (Laravel). Токен Sanctum хранится в localStorage.

const TOKEN_KEY = 'asu_light_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || null;
  }
}

async function request(method, url, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError('Сервер недоступен. Проверьте соединение.', 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('asu:unauthorized'));
    }
    const message = (data && data.message) || `Ошибка запроса (${res.status})`;
    throw new ApiError(message, res.status, data && data.errors);
  }

  return data;
}

export const api = {
  login: (login, password) => request('POST', '/api/auth/login', { login, password }),
  logout: () => request('POST', '/api/auth/logout'),
  me: () => request('GET', '/api/auth/me'),

  houses: (mark) => request('GET', `/api/houses?mark=${encodeURIComponent(mark || '')}`),
  houseCard: (buildId, mark) => request('GET', `/api/houses/card?build_id=${encodeURIComponent(buildId)}&mark=${encodeURIComponent(mark || '')}`),

  users: () => request('GET', '/api/users'),
  createUser: (payload) => request('POST', '/api/users', payload),
  updateUser: (id, payload) => request('PUT', `/api/users/${id}`, payload),
  deleteUser: (id) => request('DELETE', `/api/users/${id}`),
};
