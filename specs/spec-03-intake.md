# Spec 03 — Intake: track and level

**Depends on:** 01 (types, constants, registry), 02 (shell, theme, `Section`)

## Goal

One screen, shown once per browser: the learner picks a track (`game` / `app` /
`portfolio` / `media`) and a level (`beginner` / `intermediate` / `advanced`), then
continues. The choice persists to `localStorage`. On every later visit the intake
screen is skipped — the app renders a confirmation of the stored choice instead — and
a small control lets the learner reopen the picker to change either value.

This is the first screen that writes to `localStorage` and the first real exercise of
`Section`/`Shell` with an interactive, stateful UI rather than a static read of the
registry.

## In scope

- `src/data/intake.ts` — `IntakeState` type, the `localStorage` key, and
  `loadIntake` / `saveIntake` / `clearIntake`, all defensive against missing or
  corrupt storage (private browsing with storage disabled, hand-edited JSON, an
  unknown track/level id from a future format change).
- `src/hooks/useIntake.ts` — a React hook wrapping the above in state, so a write
  re-renders the app without a reload.
- `src/components/Intake.tsx` — the picker: a track list, a level list, a submit
  control. Accepts optional initial values so the same component serves first-run
  and "change" without a second implementation.
- `src/styles/intake.css` — new file. Classes this spec adds do not belong in
  `shell.css` (its own header says so); a level list and a submit control are new
  surfaces, not the track index.
- `src/App.tsx` — rewritten to branch on stored intake state: no stored state
  renders `Intake`; stored state renders a confirmation view plus a "Change" control
  in the masthead slot that reopens `Intake` pre-filled.
- `src/index.css` — one new `@import` for `intake.css`.

## Out of scope

- The actual path/map screen. Spec 04 owns it. The confirmation view this spec
  ships is deliberately minimal — it states the stored choice and nothing else —
  because spec 04 replaces it wholesale rather than building on it.
- Level-based node filtering (collapsing nodes below the chosen level). That reads
  `LEVEL_RANK` against real node placement, which does not exist until spec 05.
- Any routing library. Track/level state is the only "route" this app has for now;
  a boolean (has-intake or not) plus a local "editing" flag is the entire
  navigation model. No dependency added.

## Files

| File | Change |
| --- | --- |
| `src/data/intake.ts` | New |
| `src/hooks/useIntake.ts` | New |
| `src/components/Intake.tsx` | New |
| `src/styles/intake.css` | New |
| `src/App.tsx` | Rewritten |
| `src/index.css` | One line added (`@import './styles/intake.css';`) |

## Interfaces

```ts
// src/data/intake.ts
export interface IntakeState {
  track: TrackId
  level: Level
}

export function loadIntake(): IntakeState | null
export function saveIntake(state: IntakeState): void
export function clearIntake(): void

// src/hooks/useIntake.ts
export function useIntake(): {
  intake: IntakeState | null
  setIntake: (state: IntakeState) => void
  resetIntake: () => void
}

// src/components/Intake.tsx
export interface IntakeProps {
  initialTrack?: TrackId
  initialLevel?: Level
  onComplete: (state: IntakeState) => void
}
export function Intake(props: IntakeProps): ReactNode
```

`loadIntake` returns `null` — never throws — on: missing key, invalid JSON, or a
parsed value whose `track` is not in `TRACK_IDS` or whose `level` is not in
`LEVELS`. A corrupt or stale stored value must degrade to "no intake yet", not crash
the app (same posture as the registry validator's "hard stop only when the thing
we cannot recover from is the thing about to render").

## Acceptance criteria

1. First visit (empty `localStorage`): `Intake` renders, nothing is pre-selected,
   the submit control is disabled or absent until both a track and a level are
   chosen.
2. Choosing a track highlights exactly that one track row; choosing a level
   highlights exactly that one level row. Both are visible at once — this is not a
   wizard with a back button, both lists render on the same screen.
3. Submitting with both chosen calls `saveIntake`, and the same render pass swaps
   to the confirmation view — no reload, no flash of the intake screen.
4. Reloading the page (simulated: re-mount `App` with the same `localStorage`)
   skips `Intake` entirely and renders the confirmation view directly.
5. The confirmation view names the chosen track's `destination` and the chosen
   level, and offers a "Change" control.
6. Activating "Change" reopens `Intake` with both lists pre-selected to the
   stored values, not blank.
7. Submitting again from the "Change" state overwrites the stored value and
   returns to confirmation with the new values reflected.
8. Corrupting the stored value (`localStorage.setItem` with the key set to
   `"not json"`, and separately to `{"track":"nope","level":"beginner"}`) and
   reloading falls back to the first-visit `Intake` screen, not a crash.
9. Keyboard-only: every track row, every level row, and the submit/change
   controls are reachable by `Tab` and activatable by `Enter`/`Space`. Focus
   outline is the existing `:focus-visible` accent ring — no new focus style.
10. No hardcoded colour, gradient, glow shadow, or rounded-2xl anywhere in
    `intake.css` — every value is a `var(--...)` from `theme.css`.
11. 360px viewport: neither list overflows horizontally; rows wrap the way
    `.track-row` already does.
12. `npm run build` and `npx tsc --noEmit` both exit 0.

## Notes for the implementer

- Reuse the existing `.track-row` markup/classes for the track list (this is the
  merge `BACKLOG.md` T022 flagged) — swap the `<li>` static row for a `<li>`
  wrapping a `<button>`, add a `.track-row--selected` modifier for the persistent
  (not just `:hover`) accent left-border, and keep `.track-list`/`.track-row`
  themselves in `shell.css` since spec 02 already owns them. Anything genuinely
  new (the level list, the submit control, the selected-state modifier if it does
  not fit cleanly in `shell.css`) goes in `intake.css`.
- `IntakeState` does not belong in `src/types.ts` — that file mirrors
  `data/nodes.json`/`data/tracks.json` exactly (its own header says so) and
  `IntakeState` is not part of the registry. It lives in `src/data/intake.ts`
  instead, next to the storage functions that use it.
