import { io } from 'socket.io-client';
import { getAuthToken } from './auth';

const socketBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

let socket = null;

export const initSocket = () => {
  const token = getAuthToken();
  if (!token) return null;

  if (socket) {
    socket.disconnect();
  }

  socket = io(socketBaseUrl, {
    query: { token },
    transports: ['websocket'],
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('Socket.io connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket.io disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
