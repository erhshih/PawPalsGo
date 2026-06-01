import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    console.log(`[API] ERR ${error.response?.status} ${error.config?.url}`, error.response?.data);
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !error.config._retry && !isAuthRoute) {
      error.config._retry = true;
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('access_token', data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
