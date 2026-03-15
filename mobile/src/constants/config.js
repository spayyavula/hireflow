// API configuration
// For local development: use your machine's IP (not localhost) so the emulator can reach it
// For production: use the Vercel backend URL
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.47:8000'  // Local network IP — phone must be on same Wi-Fi
  : 'https://jobssearch.work';
