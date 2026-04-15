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
      // Forward /chat-messages to the local Express backend proxy
      '/chat-messages': {
        target: 'http://localhost:3001',
        changeOrigin: true,
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
