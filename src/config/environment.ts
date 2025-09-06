// Environment configuration
export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://anonymous-chat-be.onrender.com/api',
    timeout: 10000,
  },
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'wss://anonymous-chat-be.onrender.com',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Anonymous Chat',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
} as const
