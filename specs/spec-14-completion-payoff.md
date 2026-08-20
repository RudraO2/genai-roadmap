# Spec 14 — Completion payoff: the game-psychology pass

**Depends on:** 01–13 (every screen exists and carries the paper-roadmap identity; this
spec adds reward feedback on top of it)

**Opened:** 2026-08-20, by the project owner, after reviewing a local build and giving
direction directly: keep the current identity — "colourful and minimalist" — but make
progress feel like *winning something*. Progressive disclosure, the psychology of games,
without becoming a different, louder app.

## Why this spec exists

The owner's first report was that the deployed site looked broken and "cringe." Diagnosis
found the real fault was operational, not visual: `.github/workflows/pages.yml` was
failing at `actions/configure-pages@v5` because the repository's Pages source was never
switched from "Deploy from a branch" to "GitHub Actions," so GitHub's own legacy Jekyll
build was serving raw, unbuilt source instead of `dist/`. That is a settings fix, not a
code fix, and is called out separately in `BLOCKED.md` and `PROGRESS.md` — it is not part
of this spec's scope.

Once shown a real local build, the owner's actual note was narrower: the map already reads
as clean and colourful, but marking a node done, clearing an act, and finishing a track are
flat state flips with no payoff. Section 8's own motion rule — "only to show state change"
— was being read too conservatively: a `Mark done` click *is* a state change, and it was
getting the same 120ms colour swap as a hover.

## Goal

Every one-shot moment that says "you did something" gets a felt animation, once, tied
exactly to that state change — never a loop, never ambient, never present on ordinary
re-renders (the walker's tween re-renders `TrackMap` every frame; nothing in this spec may
replay on those frames). Nothing here introduces a new colour, a new surface, or a new
banned construct. The accent green keeps meaning exactly one thing.

## In scope

**Two new motion tokens**, `theme.css`: `--dur-reward` and `--ease-reward`, for the
handful of celebratory moments below. Kept separate from `--dur-state` / `--ease-state`
deliberately — routine hover and focus feedback stays calm and instant; a reward moment is
allowed to take longer and to overshoot slightly on the way back to rest, which
`--ease-state`'s flat curve does not do and should not start doing everywhere.

**`useJustCompleted`, `src/hooks/`.** Same shape as `useWalking`: watches a boolean, returns
`true` for one animation's length exactly when it flips `false → true`, `false` on mount and
on the reverse flip. Marking a node done fires it; marking one *un*done, or a card that
loads already complete, does not.

**The `Mark done` stamp.** `NodeCard` applies `data-just-completed` while the hook above is
true. `cards.css` adds a one-shot keyframe on `.node-card__complete` under that attribute —
a scale-and-settle thump, ink and accent only, no new surface. Fires on the click that
completes a node and nowhere else.

**Act cleared.** `Section` gains an optional `badge` slot beside its title. `TrackMap`
passes one when an act's own tally (`progress.acts.get(act.id)`) reads `done === total` and
`total > 0`. The badge is a small accent chip, printed in words ("Act cleared"), that does
not exist in the DOM until the act actually clears — so its entrance animation is a plain
CSS `animation` on mount, no transient state to track, and it never replays on a re-render
that leaves the act still clear.

**Track shipped.** Same mechanism, one level up: `Overview` gets a `shipped` flag from
`TrackMap` (`progress.done === progress.total`, `total > 0`) and renders a stamp under the
section standfirst when true. The masthead's `X / Y DONE` chip in `App.tsx` gets a
`data-shipped` attribute for the same condition and turns accent-filled — the one other
place `--accent` is allowed to appear, because it is still saying "done."

**Progressive reveal.** A collapsed stub (`NodeCard`, below the learner's level) already
expands on click. It currently swaps to the full card with no transition. This spec adds a
mount animation on the expanded article, gated on `belowLearnerLevel && expanded` — a state
only reachable through the explicit expand click, never on initial paint, so an always-
visible card is never touched by it and a page full of cards never animates in at once on
load.

**One drive-by correction.** `theme.css`'s comment above the four paper tokens still
describes the pre-spec-13 level-keyed assignment (lime = beginner, blue = intermediate,
…). Spec 13 changed the real rule to the first link's `kind`, documented correctly in
`NodeCard.tsx`, and never came back to fix the comment it contradicts. Corrected here as
part of the same pass, since it was found while reading the file this spec edits anyway.

## Out of scope

- The GitHub Pages source setting — the owner's action, not a code change.
- Any new visual identity, palette, or typeface. The owner asked to keep this one.
- Sound, confetti/particle graphics, streaks, or anything from `CONTEXT.md` section 11's
  deferred list.
- Re-keying card paper or reworking the pocket solver — spec 13's geometry is untouched.

## Acceptance

1. Marking a node done animates the button once; marking it done again after un-marking
   animates again; loading a page with nodes already complete animates nothing.
2. Clearing the last node of an act shows the "Act cleared" badge with its entrance
   animation exactly once; revisiting an already-cleared act (new screen, same act) shows
   the badge present with no animation replay tied to ordinary re-renders.
3. Finishing a track's last main-zone node shows the Overview's shipped stamp and turns the
   masthead counter accent-filled; frontier completions never trigger it, matching
   `progress.done` / `progress.total`'s existing exclusion of `frontier`.
4. Expanding a below-level stub animates the reveal; a card that was never a stub (at or
   above the learner's level) never carries the animation, on first paint or ever.
5. `prefers-reduced-motion: reduce` collapses every animation added here to 0.01ms, through
   the existing global rule in `base.css` — no second reduced-motion rule anywhere in this
   spec's CSS.
6. `npm run build` and `npx tsc --noEmit` both exit 0; the theme gate reports 0 violations;
   no colour outside `theme.css`; no new npm dependency.
