import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` keeps every asset URL relative, so the same `dist/` works from a
// GitHub Pages project subpath (`user.github.io/<repo>/`), from a user page, from a
// custom domain and from a plain file server, with nothing to configure per host.
// `scripts/check-output.ts` asserts no absolute asset path survives into the build.
// The deploy is `.github/workflows/pages.yml`.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // Off, deliberately. The map was 1.13 MB against 287 kB of JS,
    // shipped to every visitor's cache for the benefit of a developer who could
    // clone the repo and `npm run dev` instead. `check:output` fails the build if a
    // `.map` file or a `sourceMappingURL` comment ever reappears in `dist/`.
    sourcemap: false,
  },
})
