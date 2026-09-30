import { defineConfig } from 'vite';

// Debug tools exist only in dev builds. The playtest build strips them (spec §6.4, §8).
export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    __PLAYTEST__: JSON.stringify(mode === 'playtest'),
  },
  build: {
    target: 'es2022',
    sourcemap: mode !== 'playtest',
    chunkSizeWarningLimit: 1200,
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1' },
}));
