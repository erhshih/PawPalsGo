import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('access_token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] connect error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
