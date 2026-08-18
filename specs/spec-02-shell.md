# Spec 02 — Visual shell: theme, type scale, app frame

**State:** `IN PROGRESS`
**Depends on:** 01
**Owns:** `src/theme.css`, the Tailwind setup, the typefaces, and the app frame

---

## Goal

Make the aesthetic judgeable before any system is built. This spec lands one `theme.css`
holding every colour and type value as a custom property, self-hosts the two typefaces,
installs Tailwind as a layout-only tool, and builds the frame every later screen mounts
inside: masthead, main region, colophon, hairline rules, generous emptiness. It replaces the
spec 01 smoke test with a real screen that renders the four tracks from the live registry, so
the theme is exercised against real strings rather than lorem. It builds no product feature —
no intake, no path, no cards, no progress. If the look is wrong, this is the cheap moment to
find out.

The second job is mechanical enforcement. `CONTEXT.md` section 8 bans gradients,
glassmorphism, glow shadows, default Tailwind palette tokens and decorative rounding. Rather
than trusting each future session to remember that, this spec resets the Tailwind theme
namespaces that generate those utilities, so `bg-slate-900`, `backdrop-blur-md`,
`shadow-lg`, `rounded-2xl` and `animate-pulse` **do not exist as classes**. A future violation
becomes a no-op class rather than a shipped gradient.

## In scope

- `src/theme.css` — the one swappable file. `@font-face` blocks and a single `:root` token
  block. Every colour, every type value, spacing scale, motion durations. No other selector.
- `src/fonts/*.woff2` — Instrument Serif and JetBrains Mono, self-hosted, latin + latin-ext,
  fetched from Google Fonts in this session. No CDN link at runtime.
- `src/index.css` — the CSS entry point: imports Tailwind and the theme, resets the banned
  Tailwind namespaces, maps the kept ones onto theme tokens.
- `src/styles/base.css` — element-level defaults inside `@layer base`, tokens only.
- `src/styles/shell.css` — the shell's own classes inside `@layer components`, tokens only.
- `src/components/Shell.tsx` — masthead / main / colophon frame. `children` mount in main.
- `src/components/Section.tsx` — the section heading pattern: mono index, mono kicker, serif
  title, optional mono meta. Later specs reuse it so headings do not drift.
- `src/App.tsx` — the first real screen: the track index, rendered from `registry`.
- `src/main.tsx` — replaced wholesale. Imports `./index.css`, mounts `<App />`.
- `src/assets.d.ts` — `declare module '*.css'`, since `tsconfig` sets `types: []`.
- `index.html` — description meta, an empty `data:` icon to stop the favicon 404.
- `vite.config.ts` — add the `@tailwindcss/vite` plugin.
- `package.json` — add `tailwindcss` and `@tailwindcss/vite` as dev dependencies.

## Out of scope

- Intake, track selection, level selection, localStorage. Spec 03. The track rows this spec
  renders are **not** links and **not** buttons; they are a static index.
- The SVG path, node placement, cards, character, progress, fog. Specs 04–09.
- Routing of any kind. One screen.
- The hardcoded-colour build gate. Spec 12 owns it (`BACKLOG.md` T019); until then the rule
  is checked by grep and by hand.
- A drawn favicon or any other brand mark. See the decision below.
- Editing `data/*.json`, `src/types.ts`, `src/constants.ts` or anything under `src/data/`.

## Decisions recorded up front

**Spec 01 already owns the toolchain.** This spec does not run `npm create vite`. It inherits
`package.json`, `tsconfig.json`, `vite.config.ts` and `index.html` and adds to them.

**Tailwind is installed with its palette removed, not with a lint rule.** `CONTEXT.md`
section 8 bans a list of things Tailwind ships utilities for. Tailwind v4 lets a theme
namespace be cleared with `--namespace-*: initial`, which deletes both the variables and the
utilities that read them. Cleared here: `--color-*`, `--font-*`, `--text-*`,
`--font-weight-*`, `--tracking-*`, `--leading-*`, `--radius-*`, `--shadow-*`,
`--inset-shadow-*`, `--drop-shadow-*`, `--text-shadow-*`, `--blur-*`, `--animate-*`. What
survives is layout: spacing, flex, grid, breakpoints, containers, positioning. That is the
constitution's "Tailwind is for layout only", made true by the build rather than by memory.

**Colour and type therefore never travel through a Tailwind class.** They travel through the
component CSS in `src/styles/`, which reads `var(--…)` from `theme.css`. A later spec that
wants a rounded corner or a border colour writes it in CSS against a token.

**No favicon file.** A drawn mark needs a colour, and a colour outside `theme.css` fails the
definition of done. `index.html` instead carries `<link rel="icon" href="data:,">`, which
stops the 404 without inventing an asset. Closes `BACKLOG.md` T017. A real mark is an asset
decision for whoever owns the visual identity later; it will need its colours parameterised.

**One accent, used only for state.** `--accent` appears on exactly three things: the
focus-visible ring, the hover marker on a track row, and text selection. Nothing decorative
is accent-coloured. Section 8 says accent means "here", not decoration, so "here" is defined
as the thing the keyboard or pointer is currently on.

**Arrow glyphs are avoided.** The latin subsets we self-host cover U+2191 and U+2193 but not
U+2192, so `→` would silently fall back to a different face. Structural marks use ASCII in
the mono face.

## Files

| Path | New / changed | What |
| --- | --- | --- |
| `src/theme.css` | new | `@font-face` × 4 and one `:root` token block. Nothing else. |
| `src/fonts/instrument-serif-400-latin.woff2` | new | Display face, latin. |
| `src/fonts/instrument-serif-400-latin-ext.woff2` | new | Display face, latin-ext. |
| `src/fonts/jetbrains-mono-400-700-latin.woff2` | new | Mono, variable 400–700, latin. |
| `src/fonts/jetbrains-mono-400-700-latin-ext.woff2` | new | Mono, latin-ext. |
| `src/fonts/README.md` | new | Family, source URL, licence, date fetched. |
| `src/index.css` | new | Entry. Imports, namespace resets, kept-namespace mapping. |
| `src/styles/base.css` | new | `@layer base` element defaults. |
| `src/styles/shell.css` | new | `@layer components` shell classes. |
| `src/components/Shell.tsx` | new | The frame. |
| `src/components/Section.tsx` | new | The section heading pattern. |
| `src/App.tsx` | new | Track index screen, from `registry`. |
| `src/main.tsx` | changed | Smoke test replaced wholesale. |
| `src/assets.d.ts` | new | `declare module '*.css'`. |
| `index.html` | changed | Description meta, empty icon, `#root` unchanged. |
| `vite.config.ts` | changed | `tailwindcss()` added to `plugins`. |
| `package.json` | changed | Two dev dependencies added. |

## Interfaces

```tsx
// src/components/Shell.tsx
import type { ReactNode } from 'react'

export interface ShellProps {
  /** The screen. Mounts inside <main>, which owns the page's vertical rhythm. */
  children: ReactNode
  /** Right-hand masthead slot: short mono facts, e.g. "67 NODES". Optional. */
  masthead?: ReactNode
}
export function Shell(props: ShellProps): ReactNode
```

```tsx
// src/components/Section.tsx
export interface SectionProps {
  /** Two-digit index shown in the accent-free mono kicker, e.g. "01". */
  index: string
  /** Kicker text. Rendered upper-case and letter-spaced by CSS, not by the caller. */
  kicker: string
  /** Serif display heading. */
  title: string
  /** Optional mono line under the title. One sentence. */
  standfirst?: string
  children: ReactNode
}
export function Section(props: SectionProps): ReactNode
```

## Token contract

Names are stable; later specs reference these and must not invent parallel ones. Values live
in `theme.css` and only there.

**Colour** — `--surface-base`, `--surface-raised`, `--rule`, `--rule-faint`, `--text-primary`,
`--text-secondary`, `--text-muted`, `--accent`, `--accent-quiet`.

**Type** — `--font-display`, `--font-mono`; sizes `--size-display`, `--size-title`,
`--size-lead`, `--size-body`, `--size-meta`, `--size-micro`; weights `--weight-regular`,
`--weight-medium`, `--weight-bold`; `--tracking-caps`, `--tracking-tight`; `--leading-tight`,
`--leading-body`.

**Structure** — `--space-unit`, `--frame-max`, `--measure`, `--hairline`, `--gutter`.

**Motion** — `--dur-state`, `--ease-state`. Only ever used on a state change.

## Acceptance criteria

A stranger can verify each of these without asking me.

1. `npm run build` exits 0 and `npx tsc --noEmit` exits 0.
2. `npm ls --depth=0` shows exactly the spec 01 dependencies plus `tailwindcss` and
   `@tailwindcss/vite`. No other package was added.
3. No hex colour, `rgb(`, `hsl(`, `oklch(` or named colour appears in any file outside
   `src/theme.css`. Verified by grep over `src/`, `index.html` and `*.ts*`.
4. `src/theme.css` contains no selector other than `:root` and its four `@font-face` blocks.
5. No `.css` file outside `theme.css` declares a literal colour or a literal font size; every
   one reads a `var(--…)`.
6. The built CSS in `dist/` contains **no** `--color-slate`, `--color-indigo`,
   `--color-violet` or any other default Tailwind palette variable, and no `.blur-`,
   `.backdrop-blur-`, `.shadow-`, `.rounded-` or `.animate-` utility.
7. No `linear-gradient`, `radial-gradient`, `backdrop-filter`, `box-shadow` with a colour
   other than a token, or `text-shadow` appears anywhere in `src/`.
8. No emoji appears in any file under `src/` or in `index.html`.
9. The word `Inter` appears nowhere. The display face is Instrument Serif; every structural
   and UI string renders in JetBrains Mono.
10. Both font families load from `src/fonts/`. `dist/assets/` contains four hashed `.woff2`
    files and the built CSS references them relatively, so a GitHub Pages subpath still
    resolves them. No `fonts.googleapis.com` or `fonts.gstatic.com` request is made at
    runtime — grep `dist/` for `gstatic` returns nothing.
11. At least three distinct type sizes are visible on the one screen, and the jump between
    the largest and the body size is at least 3×.
12. Every rule in the UI is one CSS pixel and reads a rule token. No element has a border on
    all four sides.
13. `--accent` is referenced in exactly three places in `src/styles/`: focus ring, row hover
    marker, `::selection`.
14. Keyboard focus is visible on the skip link and on every focusable element, and the ring
    is not a glow — it is a hard offset outline.
15. `@media (prefers-reduced-motion: reduce)` disables the two state transitions.
16. The screen renders the four real tracks with their real titles, destinations, node counts
    and act counts, read from `registry`. No hardcoded track list.
17. At 360 px width nothing overflows horizontally, the masthead meta stacks under the
    wordmark, and no text is smaller than the `--size-micro` token.
18. No prose describing what any indexed tool does appears anywhere this spec touches.
19. `data/nodes.json`, `data/tracks.json`, `src/types.ts`, `src/constants.ts` and everything
    under `src/data/` are unchanged by this spec.

## Edge cases the implementation must survive

- A very long track destination string — wraps, never truncates the row into ellipsis soup.
- A registry with zero warnings and one with warnings: the colophon states the count either
  way and does not special-case one of them into an error style.
- 360 px viewport, and a 2560 px viewport where `--frame-max` must stop the measure growing.
- Fonts blocked or still loading: `font-display: swap` plus a real fallback stack in both
  font tokens, so the layout does not collapse to a proportional face.
- `prefers-reduced-motion: reduce`.
- Forced dark: the page is dark by design; `color-scheme: dark` is declared so form controls
  and scrollbars match rather than flashing white.
