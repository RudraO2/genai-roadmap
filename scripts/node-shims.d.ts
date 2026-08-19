/**
 * The slice of the Node runtime `scripts/validate-data.ts` uses.
 *
 * Declared here rather than pulling in `@types/node`, because CONTEXT.md section 10
 * caps the dependency list at Vite, React, TypeScript and Tailwind. If a later spec
 * needs materially more of the Node API than this, that is the moment to log the
 * `@types/node` question to BLOCKED.md rather than to keep growing this file.
 */

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
  export function existsSync(path: string): boolean
  /** Recursive form only — the two gate scripts walk whole trees or nothing. */
  export function readdirSync(
    path: string,
    options: { recursive: true; encoding: 'utf8' },
  ): string[]
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string
}

declare module 'node:path' {
  export function dirname(path: string): string
  export function join(...paths: string[]): string
}

declare const process: {
  exit(code?: number): never
}
