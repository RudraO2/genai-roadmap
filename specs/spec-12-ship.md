# Spec 12 — Ship: build gates and GitHub Pages

**Depends on:** 01–11 — every spec. This one adds no feature; it makes the rules the other
eleven were written under machine-checkable, and puts the result on a URL.

## Goal

Turn rules that are currently kept by hand into things the build refuses to pass without, and
make `dist/` deployable to GitHub Pages as-is. `CONTEXT.md` section 12 names the definition of
done — build passes, typecheck passes, no hardcoded colour outside `theme.css`, no unverified
URL. The first, second and fourth are already gates (`npm run build` chains `validate:data`
and `tsc --noEmit`). The third is not: T019 records that "no hex outside `theme.css`" has been
checked by hand for eleven specs. This spec writes that checker, adds a second one over the
built output for the section 8 bans that only exist after Tailwind has run (T077), and wires
both into `npm run build` so a violation cannot be committed green.

Deploy is the other half. `base: './'` was set in spec 02 in anticipation of this. What is
missing is a 404 for the paths GitHub Pages will be asked for and does not have, a `.nojekyll`
so the static host does not reinterpret the output, and a workflow that runs the same
`npm run build` a session runs locally — the gate is worthless if CI does not run it.

## In scope

- `scripts/check-theme.ts` — the source gate. Fails on any colour literal, any type literal,
  any banned decorative construct, and any `var(--token)` that `theme.css` does not declare,
  anywhere under `src/` other than `src/theme.css` itself, plus `index.html` and `public/`.
- `scripts/check-output.ts` — the built-output gate. Fails if `dist/` is missing the deploy
  files, carries a sourcemap, references an asset by absolute path, or defines any of the
  section 8 utility classes Tailwind would emit if a theme namespace were ever un-cleared.
- `package.json` — both gates in the `build` chain, and each runnable alone.
- `vite.config.ts` — `sourcemap: false` (T018), and the `base` comment settled rather than
  deferred.
- `public/404.html` — new. Sends a request for a path this site does not have back to the
  deploy root, computed at runtime because the root differs between a project page, a user
  page and a custom domain.
- `public/.nojekyll` — new, empty. GitHub Pages runs Jekyll over an artifact otherwise.
- `.github/workflows/pages.yml` — new. Build with the gates on `main`, deploy the artifact.
- `scripts/node-shims.d.ts` — the two more `node:fs` functions the gates need. Still not
  `@types/node`; `BLOCKED.md` explains why that line is held.

## Out of scope

- **A router, a hash route, or a per-act URL (T105).** A deep link is a navigation feature and
  spec 10 owns navigation. With one page there is nothing to route; the 404 written here sends
  a stray path to the root, which is the correct answer for a single-page site and stays
  correct if a hash route is added later.
- **A favicon (T017).** `href="data:,"` already suppresses the request, so there is no bug to
  fix, and a hand-written icon file would be the first colour outside `theme.css` on the day
  the gate that forbids it lands. Deferred with that constraint recorded.
- **A README or deploy documentation.** Noticed and appended to `BACKLOG.md`, not written
  here — one task per session.
- **Any change to a component, a stylesheet, or `theme.css`.** If a gate finds a real
  violation, that is a finding for a follow-up task, not an edit smuggled into this one. The
  gates are expected to pass against the tree as committed; they are written to describe the
  code that exists, not to force a rewrite of it.
- **Bundle size work, code splitting, or a preload strategy.** 287 kB of JS is React and the
  registry. Nothing here is a performance spec.
- **Minifying or otherwise processing `public/404.html`.** Vite copies `public/` verbatim; the
  404 must work with no build step behind it, since GitHub Pages serves it directly.

## Files

| File | Change |
| --- | --- |
| `scripts/check-theme.ts` | New — source gate over `src/**`, `index.html`, `public/**` |
| `scripts/check-output.ts` | New — built-output gate over `dist/**` |
| `scripts/node-shims.d.ts` | Add `readdirSync` and `existsSync` |
| `package.json` | `check:theme`, `check:output`; `build` chains both |
| `vite.config.ts` | `sourcemap: false`; `base` comment finalised |
| `public/404.html` | New |
| `public/.nojekyll` | New, empty |
| `.github/workflows/pages.yml` | New |
| `BACKLOG.md`, `PROGRESS.md`, `State of the project.md` | Updated as every session updates them |

No new npm dependency. Nothing in `src/` changes.

## Interfaces

Neither script is imported by anything — they are commands, and their contract is their exit
code and their stdout. Both follow `scripts/validate-data.ts`: report every problem, print one
summary line, `process.exit(1)` on any error and `0` otherwise. A warning never fails a build.

```ts
// scripts/check-theme.ts

/** Where a violation is, and what it is. One per line of output. */
interface Violation {
  file: string   // repo-relative, forward slashes
  line: number   // 1-based
  rule: RuleId
  text: string   // the offending snippet, trimmed
}

type RuleId =
  | 'colour-literal'   // #rgb / #rrggbb / rgb() / hsl() / oklch() / a named CSS colour
  | 'type-literal'     // font-family, font-size, font-weight, letter-spacing, line-height
  | 'banned-construct' // gradient(), backdrop-filter, filter: blur(), a coloured box-shadow
  | 'unknown-token'    // var(--x) where theme.css declares no --x

/** Every colour and type value lives in theme.css. This is that sentence as a list. */
const THEME_FILE = 'src/theme.css'
```

```ts
// scripts/check-output.ts

type OutputRuleId =
  | 'missing-file'     // dist/index.html, dist/404.html or dist/.nojekyll absent
  | 'absolute-asset'   // href/src into /assets/... — breaks under a project subpath
  | 'sourcemap'        // a .map file, or a sourceMappingURL comment, in the artifact
  | 'banned-utility'   // a section 8 utility class survived into the built CSS
  | 'gradient'         // any *-gradient() in the built CSS
```

## Behaviour

### The source gate

Scans `src/**/*.{css,ts,tsx}`, `index.html` and `public/**/*.html`. Skips `src/theme.css`,
which is the one file allowed to hold literals, and reads it separately for the token list.

- **CSS comments are stripped before matching.** Several stylesheets explain a colour decision
  in prose ("the screen turned orange"), and a gate that fails on its own documentation
  teaches people to delete comments. TS and TSX are scanned raw — no colour literal exists in
  either today, and keeping them raw means a hex cannot hide in a comment either.
- **`colour-literal`** — `#` followed by exactly 3, 4, 6 or 8 hex digits at a word boundary;
  any of `rgb() rgba() hsl() hsla() hwb() lab() lch() oklab() oklch() color()`; or a CSS named
  colour in a declaration's value position in a CSS file. `transparent` and `currentColor` are
  not colour literals — they name a relationship, not a value, and section 8 has no quarrel
  with either. `color-mix()` is not banned: it is the documented way panel backdrops dim
  without `backdrop-filter`, and any literal inside one is caught by the rules above anyway.
- **`type-literal`** — a declaration of `font`, `font-family`, `font-size`, `font-weight`,
  `font-style`, `letter-spacing` or `line-height` whose value is not a single `var(--…)` or
  one of `inherit`, `initial`, `unset`, `normal`. `text-transform` is not on the list: it is a
  typographic instruction, not a value the theme should own.
- **`banned-construct`** — `linear-gradient(`, `radial-gradient(`, `conic-gradient(`, their
  `repeating-` forms, `backdrop-filter`, `-webkit-backdrop-filter`, a `filter` declaration
  containing `blur(`, and a `box-shadow` whose value is anything other than `none`. Section 8,
  transcribed.
- **`unknown-token`** — every `var(--name)` in a scanned file must find `--name:` declared in
  `theme.css`. Nothing outside `theme.css` declares a custom property today, so this is a
  typo-catcher: `var(--text-secondry)` currently renders as nothing at all and nothing
  complains. Tailwind's own `--tw-*` namespace is exempt; nothing in `src/` writes one, but a
  utility class that does must not be a build failure.
- **Unused tokens are a warning, not an error.** A declared token nothing reads is worth
  saying out loud — T021 was exactly that, found by hand — but a palette is allowed to be
  wider than today's screens.

### The output gate

Runs after `vite build`, over `dist/`. Refuses to run at all if `dist/` is absent, so a stale
pass is impossible.

- `dist/index.html`, `dist/404.html` and `dist/.nojekyll` must all exist — the last two prove
  `public/` was copied, which is the only thing that makes the deploy behave.
- No `href="/…"` or `src="/…"` in `dist/index.html`. A project page lives under `/<repo>/`,
  and an absolute asset path is the classic way a Pages deploy renders blank.
- No `*.map` file anywhere in `dist/`, and no `sourceMappingURL` comment in a built asset.
- The built CSS defines none of `.blur-*`, `.backdrop-blur-*`, `.shadow-*`, `.drop-shadow-*`,
  `.inset-shadow-*`, `.text-shadow-*`, `.rounded-*`, `.animate-*`, or a `.bg-` followed by a
  default Tailwind palette name. The bare `.backdrop-filter` and `.filter` enabler classes are
  **allowed and expected** — Tailwind emits them unconditionally and both expand to a list of
  empty custom properties, so neither can render anything. That is the answer to T077: the
  strings are in the file, the capability is not.
- No `linear-gradient(`, `radial-gradient(` or `conic-gradient(` in the built CSS.

### The 404

`public/404.html` is a redirect, not a page: no stylesheet, no font, no colour, so it cannot
violate the gate it ships beside and cannot go stale when the theme changes. It computes the
deploy root from `location` — the first path segment on a `*.github.io` project page, `/`
everywhere else — and replaces the location with it, but **only if the current path is not
already that root**, so a site that is not deployed yet cannot put the browser in a redirect
loop. A `<noscript>` link is the fallback, and `robots` is `noindex`.

### The workflow

`push` to `main` and `workflow_dispatch`. `actions/checkout` → `actions/setup-node` at the
version `engines` requires, with the npm cache → `npm ci` → `npm run build` → upload `dist`
as a Pages artifact → deploy. `npm run build` is used verbatim, unsplit: if CI ran the pieces
separately it would eventually run a different set of pieces than a session does.

## Visual

Nothing renders. The only thing anyone sees is the gates' output, which follows
`validate-data.ts`: one `file:line  rule  text` per violation, a blank line, then one summary
line. No colour codes, no box drawing, no emoji — the same voice the interface has.

## Acceptance criteria

1. `npm run build` and `npx tsc --noEmit` both exit 0, with both new gates in the chain.
2. `npm run check:theme` exits 0 against the tree as committed, and reports the count of files
   scanned and tokens declared.
3. Introducing `color: #ff0000` into any file under `src/` other than `theme.css` makes
   `npm run check:theme` exit 1 and name that file and line. Reverting it restores exit 0.
   The same holds for `font-family: Inter, sans-serif`, for `background: linear-gradient(...)`,
   for `backdrop-filter: blur(4px)`, for `box-shadow: 0 0 8px red`, and for `var(--nonesuch)`.
4. The same `color: #ff0000` inside `src/theme.css` does **not** fail the gate — that file is
   where colour is supposed to live.
5. A CSS comment containing the word `orange` or the phrase `off-white` does not fail the gate.
6. `color-mix(in srgb, var(--surface-base) 80%, transparent)` — the existing backdrop in
   `panel.css` and `portability.css` — does not fail the gate.
7. `npm run check:output` exits 1 with `dist/` absent, and exits 0 after a build.
8. `dist/` after a build contains `404.html` and `.nojekyll`, contains no `*.map` file, and
   `dist/index.html` references every asset relatively.
9. `dist/assets/*.css` defines no banned utility class; `.backdrop-filter` and `.filter` are
   present and are not reported.
10. `public/404.html` contains no colour, no font reference and no stylesheet link, and passes
    the source gate like any other scanned file.
11. `.github/workflows/pages.yml` runs `npm run build` as a single step, requests
    `pages: write` and `id-token: write`, and uploads `dist`.
12. No new npm dependency; `package.json`'s dependency lists are unchanged.
13. Nothing under `src/` is modified by this spec.
14. T018, T019 and T077 close in `BACKLOG.md`; T017 and T105 stay open with the reason
    recorded here.
