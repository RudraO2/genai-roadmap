/**
 * tsconfig sets `types: []`, so Vite's own `.css` module declarations are not
 * picked up automatically. This is the one line that restores them.
 */
declare module '*.css'
