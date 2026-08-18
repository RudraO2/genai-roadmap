import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps every asset URL relative, so the same `dist/` works from a
// GitHub Pages project subpath or from a plain file server. Spec 12 owns deploy.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
