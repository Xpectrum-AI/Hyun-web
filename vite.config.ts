import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones) for proxy config
  const env = loadEnv(mode, process.cwd(), '');
  return {
  server: {
    host: "::",
    port: 8000,
    proxy: {
      // Forward /chat-messages to the Xpectrum chat API, injecting the real API key
      '/chat-messages': {
        target: env.XPECTRUM_API_BASE_URL || 'https://cloud.xpectrum.co/api/v1',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (env.XPECTRUM_API_KEY) {
              proxyReq.setHeader('Authorization', `Bearer ${env.XPECTRUM_API_KEY}`);
            }
          });
        },
      },
      // Forward /conversations (fetch existing conversations by user)
      '/conversations': {
        target: env.XPECTRUM_API_BASE_URL || 'https://cloud.xpectrum.co/api/v1',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (env.XPECTRUM_API_KEY) {
              proxyReq.setHeader('Authorization', `Bearer ${env.XPECTRUM_API_KEY}`);
            }
          });
        },
      },
      // Forward /messages/* (e.g. suggested-questions, message history) to the same API
      '/messages': {
        target: env.XPECTRUM_API_BASE_URL || 'https://cloud.xpectrum.co/api/v1',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (env.XPECTRUM_API_KEY) {
              proxyReq.setHeader('Authorization', `Bearer ${env.XPECTRUM_API_KEY}`);
            }
          });
        },
      },
      // Forward /workflow-run to the availability workflow
      '/workflow-run': {
        target: env.WORKFLOW_API_BASE_URL || 'https://cloud-v2.xpectrum.co/v1',
        changeOrigin: true,
        rewrite: () => '/workflows/run',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = env.WORKFLOW_API_KEY || 'app-NX9DPU2Oe4zvngT4bdQSUiGY';
            proxyReq.setHeader('Authorization', `Bearer ${key}`);
          });
        },
      },
      // Forward /workflow-book to the booking workflow
      '/workflow-book': {
        target: env.WORKFLOW_API_BASE_URL || 'https://cloud-v2.xpectrum.co/v1',
        changeOrigin: true,
        rewrite: () => '/workflows/run',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = env.BOOKING_WORKFLOW_API_KEY || 'app-6KvdN7TJjDGfxPSJqC18Mhlk';
            proxyReq.setHeader('Authorization', `Bearer ${key}`);
          });
        },
      },
      // Forward /voice/* to the voice integration server, injecting the real API key
      '/voice': {
        target: env.VOICE_API_BASE_URL || 'https://api-prod.xpectrum-ai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/voice/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Replace the placeholder key with the real server-side key
            if (env.VOICE_API_KEY) {
              proxyReq.setHeader('x-api-key', env.VOICE_API_KEY);
            }
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
