import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'access_token';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
