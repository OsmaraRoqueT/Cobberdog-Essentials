import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is relative so the build works on GitHub Pages sub-paths and any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
});
