import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'access_token';

let isRefreshing = false;
type FailedRequest = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10_000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log(`[API] ${res.status} ${res.config.url}`);
    return res;
  },
  (error) => {
    console.log(`[API] ERR ${error.response?.status ?? 'NO_RESP'} ${error.config?.url}`, JSON.stringify(error.response?.data ?? error.message));
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || original._retry || isAuthRoute) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
