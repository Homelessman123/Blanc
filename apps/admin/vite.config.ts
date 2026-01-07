import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const base = process.env.VITE_BASE || '/';
  return {
    base,
    server: {
      port: 3001,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Keep React core separate for better long-term caching
            if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor';

            // Router
            if (id.includes('/react-router') || id.includes('/@remix-run/')) return 'router-vendor';

            // Charts can be heavy
            if (id.includes('/recharts/')) return 'charts-vendor';

            // Icons can be large
            if (id.includes('/lucide-react/')) return 'icons-vendor';

            // Default: one vendor chunk
            return 'vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
