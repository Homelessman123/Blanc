import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            router: ['react-router', 'react-router-dom'],
            motion: ['framer-motion'],
            toast: ['react-hot-toast'],
            icons: ['lucide-react'],
            calendar: ['react-calendar'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'contesthub.homelabo.work',
        '.homelabo.work'
      ]
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
