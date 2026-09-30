import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'force-exit-on-build',
      apply: 'build',
      closeBundle() {
        // Ensures the Node.js build process cleanly exits after bundling
        setTimeout(() => {
          process.exit(0);
        }, 100);
      },
    },
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('dompurify')) {
              return 'vendor-purify';
            }
            return 'vendor-other';
          }
        },
      },
    },
  },
});
