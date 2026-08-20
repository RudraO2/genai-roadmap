# BACKLOG.md — flat ordered task checklist

One line per task. `- [ ]` open, `- [~]` claimed, `- [x]` done. Tasks name the spec they
belong to. Work is claimed from the top. Noticed-but-not-done work gets appended to the
bottom rather than done inline.

`State of the project.md` is the spec-level board; this file is the task-level one.

---

## Spec 01 — Types, schema, and data loading

- [x] T001 — Put the repo under git and commit the Phase A files
- [x] T002 — Write `specs/spec-01-schema.md`
- [x] T003 — Minimal toolchain: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- [x] T004 — `src/types.ts` and `src/constants.ts`
- [x] T005 — `src/data/order.ts` — one definition of a track's reading order
- [x] T006 — `src/data/validate.ts` — 32 rule codes, pure and total
- [x] T007 — `src/data/registry.ts` — loader and indexes
- [x] T008 — `scripts/validate-data.ts` and wire it into `npm run build`
- [x] T009 — `src/main.tsx` unstyled smoke test
- [x] T010 — Verify: build, typecheck, 45-case corruption suite, browser load

## Spec 02 — Visual shell: theme, type scale, app frame

- [x] T011 — Write `specs/spec-02-shell.md`
- [x] T012 — Add Tailwind, layout only, no palette tokens
- [x] T013 — `src/theme.css` — every colour and type value as a custom property
- [x] T014 — Serif display face plus mono, self-hosted, no CDN
- [x] T015 — App frame: hairline rules, hard edges, generous space
- [x] T016 — Replace the `src/main.tsx` smoke test with the real shell

## Spec 03 — Intake: track and level

- [x] T023 — Write `specs/spec-03-intake.md`
- [x] T024 — `src/data/intake.ts` — `IntakeState`, storage read/write/clear, defensive
- [x] T025 — `src/hooks/useIntake.ts` — React-state wrapper
- [x] T026 — `src/components/Intake.tsx` — track list + level list, one screen
- [x] T027 — `src/styles/intake.css` — level list, submit control, change control
- [x] T028 — Rewrite `src/App.tsx` — branch on stored intake, "Change" masthead control
- [x] T029 — Verify: build, typecheck, browser (fresh/reload/change/corrupt storage/360px/keyboard)

## Spec 04 — The path engine

- [x] T030 — Write `specs/spec-04-path.md`
- [x] T031 — `src/path/pointAtT.ts` — pure point/angle math
- [x] T032 — `src/path/PathContext.ts` and `src/hooks/usePathPoint.ts`
- [x] T033 — `src/components/ActPath.tsx` — one `<svg>`/`<path>` per act, measures length
- [x] T034 — `src/components/PathNode.tsx` — bare dot + label
- [x] T035 — `src/components/TrackMap.tsx` — one `Section` per act
- [x] T036 — Rewrite `src/App.tsx` confirmation branch to render `TrackMap`
- [x] T037 — Verify: build, typecheck, browser (positions, track switch, 360px, no accent)

## Spec 05 — Node cards in the negative-space pockets

- [x] T038 — Write `specs/spec-05-cards.md`
- [x] T039 — `src/path/viewBox.ts` — pure viewBox-string parser
- [x] T040 — `src/components/NodeCard.tsx` — card/stub, level filter, inert completion toggle
- [x] T041 — `src/components/ActPath.tsx` — `.act-stage` wrapper, card overlay, `level` prop
- [x] T042 — `src/components/TrackMap.tsx` / `src/App.tsx` — thread `level` down
- [x] T043 — `src/styles/cards.css` — card layout, stub, narrow-viewport stacked fallback
- [x] T044 — Verify: build, typecheck, browser (stub/expand, side, level change, track change, 360px)

## Spec 06 — The node panel: pointers, never content

- [x] T045 — Write `specs/spec-06-panel.md`
- [x] T046 — `src/components/NodePanel.tsx` — controlled `<dialog>`, links grouped by `kind`
- [x] T047 — `src/components/NodeCard.tsx` — title becomes a button that opens the panel
- [x] T048 — `src/styles/panel.css` — dialog surface, `::backdrop`, grouped-link list
- [x] T049 — Verify: build, typecheck, browser (open/close, Escape+focus return, backdrop
      click, one dialog open at a time, 360px)

## Spec 07 — The character

- [x] T050 — Write `specs/spec-07-character.md`
- [x] T051 — `src/types.ts` — `Facing`, `CharacterVariant`
- [x] T052 — `src/path/pointAtT.ts` — `facingFromAngle`
- [x] T053 — `src/path/viewBox.ts` — `pointToPercent`, and `NodeCard` uses it
- [x] T054 — `src/hooks/useWalking.ts` — walk state from `t` changes, settles after 400ms
- [x] T055 — `src/components/Character.tsx` — frozen props, three layers, feet on the path
- [x] T056 — `src/components/ActPath.tsx` — `.act-stage__path` wrapper, `characterT` prop
- [x] T057 — `src/components/TrackMap.tsx` — `character` placement, defaults to act 1 at t=0
- [x] T058 — `src/styles/character.css` — placeholder geometry, `character-step` keyframes
- [x] T059 — Verify: build, typecheck, browser (position vs path point, facing both ways,
      walk start/restart/settle, reduced motion, 360px, zero-node act, zero-act track)

## Spec 08 — Progress and fog of war

- [x] T063 — Write `specs/spec-08-progress.md`
- [x] T064 — `src/data/progress.ts` — storage (mirrors `intake.ts`) plus `computeTrackProgress`
- [x] T065 — `src/data/ProgressContext.ts` — context and `useProgressContext`
- [x] T066 — `src/hooks/useProgress.ts` — React state over the storage half
- [x] T067 — `src/hooks/useTweenedT.ts` — constant-speed rAF tween, snaps on mount
- [x] T068 — `src/components/ActPath.tsx` — `progress` prop, the two dash-clipped strokes, memo
- [x] T069 — `src/components/PathNode.tsx` — `state` prop on the dot
- [x] T070 — `src/components/NodeCard.tsx` — completion from the shared set
- [x] T071 — `src/components/TrackMap.tsx` — derive, tween, distribute per act
- [x] T072 — `src/App.tsx` — own progress, provide the context, `n / m DONE` in the masthead
- [x] T073 — `src/styles/path.css` — reached/walked strokes, three dot states, one transition
- [x] T074 — Verify: build, typecheck, a 4-track × 20-subset derivation suite, and browser
      (persistence both ways, cross-track, corrupt storage, act crossing, tween retarget,
      reduced motion, all-complete, advanced level, 360px, zero-node act, zero-act track)

## Spec 09 — The frontier branch

- [x] T078 — Write `specs/spec-09-frontier.md`
- [x] T079 — `src/data/dormancy.ts` — `dormancyOf`, section 6's twelve-month rule, pure
- [x] T080 — `src/types.ts` + `src/data/validate.ts` — optional `successor`, three rules,
      plus an `EMPTY_BRANCH` warning
- [x] T081 — `src/data/progress.ts` — `BranchProgress`, the `frontier` tally, `ActProgress.anchors`
- [x] T082 — `src/hooks/usePathLength.ts` — the one path measurement, lifted out of `ActPath`
- [x] T083 — `src/components/BranchPath.tsx` — head, dashed spur, dots, stacked cards, memoised
- [x] T084 — `src/components/PathNode.tsx` — registry-read zone/dormancy, `anchor` ring prop
- [x] T085 — `src/components/TrackMap.tsx` — branches rendered under their own act
- [x] T086 — `src/components/NodeCard.tsx` — dormant card, dormant marker, successor line
- [x] T087 — `src/components/NodePanel.tsx` — `Freshness` fact and the successor link
- [x] T088 — `src/App.tsx` — `· n / m FRONTIER` beside the masthead's road count
- [x] T089 — `src/styles/branch.css` (+ `path.css`, `cards.css`, `panel.css`, `index.css`)
- [x] T090 — Verify: build, typecheck, an 824-assertion branch/anchor suite, nine `dormancyOf`
      cases, five validator mutations, and browser (all 21 spurs, dot geometry, tallies,
      persistence, panels, stubs, overlap scan at 1440px and 360px, patched-dormancy render,
      throwaway roots for the empty cases, mid-tween fps and branch mutation count)

## Spec 10 — Act navigation and the overview map

- [x] T095 — Write `specs/spec-10-navigation.md`
- [x] T096 — `src/data/navigation.ts` — `ActView`, act lookup, neighbours, `initialView`, pure
- [x] T097 — `src/path/dash.ts` — `dashToFraction` lifted out of `ActPath`, one clip
- [x] T098 — `src/data/progress.ts` — `ActProgress.frontier`, the per-act spur tally
- [x] T099 — `src/components/ActNav.tsx` — overview, position, the "you are in" jump
- [x] T100 — `src/components/ActPager.tsx` — previous / next act, named, hidden at the ends
- [x] T101 — `src/components/Overview.tsx` — the act rows and their `ActMini` miniatures
- [x] T102 — `src/components/TrackMap.tsx` — one act at a time, view state, focus and scroll
- [x] T103 — `src/styles/navigation.css` (+ `index.css` import)
- [x] T104 — Verify: build, typecheck, 502-assertion suite, five React edge cases, browser
      pass at 1440 and 360 across `game` and `portfolio`

## Spec 11 — Progress portability

- [x] T109 — Write `specs/spec-11-portability.md`
- [x] T110 — `src/data/portability.ts` — file shape, builder, serializer, total parser, filename
- [x] T111 — `src/data/intake.ts` — `parseIntake` extracted so storage and import validate once
- [x] T112 — `src/hooks/useProgress.ts` — `replaceProgress`, one write per import
- [x] T113 — `src/components/ProgressPanel.tsx` — the dialog: export, import, two-step reset
- [x] T114 — `src/App.tsx` — panel state, masthead control on both screens, import wiring
- [x] T115 — `src/styles/portability.css` (+ `index.css` import)
- [x] T116 — Verify: build, typecheck, 81-assertion parser suite, browser pass at 1200 and 360

## Spec 12 — Ship: build gates and GitHub Pages

- [x] T121 — Write `specs/spec-12-ship.md`
- [x] T122 — `scripts/check-theme.ts` — the source gate: colour, type, banned construct, token
- [x] T123 — `scripts/check-output.ts` — the built-output gate: deploy files, sourcemap,
      absolute asset path, section 8 utility classes, gradients
- [x] T124 — `scripts/node-shims.d.ts` — `readdirSync` and `existsSync`, still not `@types/node`
- [x] T125 — `package.json` — `check:theme` and `check:output`, both in the `build` chain
- [x] T126 — `vite.config.ts` — `sourcemap: false`, `base` settled
- [x] T127 — `public/404.html` and `public/.nojekyll`
- [x] T128 — `.github/workflows/pages.yml` — build with the gates on `main`, deploy `dist`
- [x] T129 — Verify: build, typecheck, ten-rule violation probe, local-token probe, both gate
      failure modes, `vite preview` served over HTTP

## Spec 14 — Completion payoff: the game-psychology pass

Opened directly by the project owner in conversation rather than claimed off this board —
same as spec 13. No pre-written task list; logged here after the fact, same as spec 13 was.

- [x] T140 — Write `specs/spec-14-completion-payoff.md` and claim the spec
- [x] T141 — `theme.css` — `--dur-reward` / `--ease-reward` tokens; corrected the stale
      level-keyed paper comment left over from before spec 13's kind-keyed rule
- [x] T142 — `src/hooks/useJustCompleted.ts` — one-shot flag on a `false → true` flip only
- [x] T143 — `NodeCard.tsx` / `cards.css` — the `Mark done` stamp, gated on `useJustCompleted`
- [x] T144 — `Section.tsx` / `shell.css` — optional `badge` slot; `TrackMap.tsx` wires an
      "Act cleared" chip when an act's own tally reads `done === total`
- [x] T145 — `Overview.tsx` / `navigation.css` and `App.tsx` / `shell.css` — the track-shipped
      banner and the accent-filled masthead chip, both off `progress.done === progress.total`
- [x] T146 — `NodeCard.tsx` / `cards.css` — reveal animation on expanding a below-level stub,
      gated on `belowLearnerLevel` at the point only an explicit expand click can reach it
- [x] T147 — Verify: build, typecheck, theme gate; browser checks of all four animations
      firing exactly once on the real state change (`animation-name` read via
      `getComputedStyle` immediately after the triggering click, not just a screenshot) and
      never on load, on un-marking, or on an already-cleared act/track

## Spec 15 — Closing the content gap: a real AI-engineering branch

Opened directly by the project owner in conversation, same as specs 13 and 14. No
pre-written task list; logged here after the fact.

- [x] T148 — Write `specs/spec-15-ai-engineering-branch.md` and claim the spec
- [x] T149 — Research: fetch `aishwaryanr/awesome-generative-ai-guide`'s roadmap and a
      summary of roadmap.sh's AI Engineer path; diff their topic lists against the 67
      existing nodes to name the actual gap
- [x] T150 — Verify six candidate repos live via the GitHub API (stars, `pushed_at`):
      `NirDiamant/RAG_Techniques`, `chroma-core/chroma`, `langchain-ai/langchain`,
      `run-llama/llama_index`, `promptfoo/promptfoo`, `ollama/ollama`
- [x] T151 — Add the six nodes to `data/nodes.json` — `zone: "frontier"`,
      `status: "core"`, `tracks: ["app"]` only
- [x] T152 — Add `frontier-ai-engineering` ("Build with your own data") to the `app`
      track in `data/tracks.json`, anchored at `api-keys` under the `intuition` act
- [x] T153 — Verify: `validate:data` (0 errors/warnings), build, typecheck; a real
      Chromium tab confirming all six cards render in order with working links, at both
      a level that collapses them to stubs and one that doesn't

## Noticed, not done

Appended by sessions that spotted work outside their one task. Do not do these inline.

- [ ] T017 — No favicon; the dev server logs a 404 for `/favicon.ico`. Spec 02 asset decision.
      Still open after spec 12, and now with a constraint: `href="data:,"` in `index.html`
      already suppresses the request, and `check:theme` fails on a colour outside
      `theme.css`, so a hand-written icon file would be a violation the day it lands. If an
      icon is ever wanted, it has to be derived from `theme.css` rather than drawn beside it.
- [x] T018 — `npm run build` emits a ~1 MB sourcemap. Decide in spec 12 whether to ship it.
      Resolved: `sourcemap: false`. 1.13 MB of map against 287 kB of JS, for the benefit of
      someone who could clone the repo instead. `check:output` fails on any `.map` in `dist/`.
- [x] T019 — The hardcoded-colour build gate named in spec 12 does not exist yet. Until it
      does, "no hex outside `theme.css`" is checked by hand. Resolved in spec 12:
      `scripts/check-theme.ts`, in the `build` chain, four rules over 51 files.
- [ ] T020 — `registry.tracks` and `registry.geometry` are readonly by type only, not frozen.
      Revisit if a spec ever mutates them by accident.
- [x] T021 — `--size-title` was defined in `theme.css` but unused anywhere in `src/`.
      Resolved in spec 06: `.node-panel__title` uses it for the detail-panel heading.
- [x] T022 — `.track-row`/`.track-list` in `src/styles/shell.css` style a static index.
      Resolved in spec 03: `button.track-row` reset + `.track-row--selected` modifier
      added to `shell.css`, hover/focus states merged rather than duplicated.
- [ ] T060 — Left-side node cards overflow the frame at mid widths. At ~730px client width
      a `.node-card--left` sits at `left: -95px` and `scrollWidth` (867) exceeds
      `clientWidth` (730). Pre-existing from spec 05, unrelated to the character (measured
      identical with the character overlay hidden). Spec 05's own checks were at 360px and
      full width, which both pass.
- [ ] T061 — Nothing in the UI picks a `CharacterVariant`; `Character` falls back to
      `DEFAULT_VARIANT` and the placeholder draws every variant identically. Whether the
      learner ever chooses one is a product question for after the sprite sheets land.
- [ ] T062 — The placeholder's legs are one block, not two. A gap would need either a
      third pseudo-element per layer or a cut painted in `--surface-base` over the path
      line; neither was worth it before real sprites.
- [x] T075 — `useProgress`'s `resetProgress` and `data/progress.ts`'s `clearCompleted` are
      written and exported but nothing calls them. Resolved in spec 11: `ProgressPanel`'s
      two-step reset calls `resetProgress`, which calls `clearCompleted`.
- [ ] T076 — `App` calls `computeTrackProgress` for the masthead count and `TrackMap` calls
      it again for the map. Same pure function, same inputs, so they cannot disagree — but
      if the derivation ever gets expensive, the fix is to lift the map branch into its own
      component (App's early return blocks a hook there today).
- [x] T077 — The built CSS still defines a bare `.backdrop-filter` utility (5 hits in
      `dist/assets/*.css`). Nothing uses it and `--blur-*: initial` means `backdrop-blur-*`
      does not exist, so nothing renders frosted — but spec 12's hardcoded-colour gate is
      the right place to also assert the banned utilities are absent from the output.
      Resolved in spec 12: `check:output` asserts no `.blur-*`, `.backdrop-blur-*`,
      `.shadow-*`, `.drop-shadow-*`, `.inset-shadow-*`, `.text-shadow-*`, `.rounded-*`,
      `.animate-*`, no default-palette utility and no gradient survives into `dist/`. The
      bare `.backdrop-filter` and `.filter` enablers are allowed by name: Tailwind emits
      both unconditionally and each expands to a list of empty custom properties.
- [ ] T091 — A branch's cards no longer sit against their dots: `branch.css` stacks them
      below the spur at every width because seven nodes cannot be pocketed on a `640x320`
      viewBox. If spec 10's overview map ever gives branches more room, revisit — the
      measurements that forced it are in the comment at `.act-stage--branch`.
- [ ] T092 — `dormancyOf` reads `Date.now()` at render, so the map's appearance depends on
      the day it is opened. Correct per `CONTEXT.md` section 6 ("demotion is automatic"),
      but it means no snapshot test of a card can be date-independent without injecting
      `now`, which the function already accepts.
- [ ] T093 — No node in `nodes.json` is `dormant` or carries a `successor`, so both render
      paths are only exercised by hand-patched data today. Whoever revises the registry
      next should check the freshness rule against every `last_commit` while they are in
      there.
- [ ] T094 — `BranchPath` still passes `viewBoxWidth`/`viewBoxHeight` to `NodeCard` and the
      card still computes a percentage position, which `branch.css` then overrides. Kept so
      `NodeCard` has one contract; drop it only if branches never float again.
- [ ] T105 — No URL, hash or history entry per act. Navigation lives in React state only,
      so the browser's back button leaves the app and a link cannot point at one act. Spec
      12 owns the GitHub Pages base path and 404 handling; decide there whether a hash
      route is worth it, and remember `CONTEXT.md` section 10 forbids anything server-side.
      Spec 12's answer: not here. A deep link is a navigation feature and spec 10 owns
      navigation. `public/404.html` sends any stray path to the deploy root, which stays
      correct if a hash route is added later — a hash never reaches the server, so no Pages
      configuration changes when it is.
- [ ] T106 — The viewed act is not persisted. Reopening the map lands on the progress
      frontier, which is usually right, but a learner reading ahead loses their place on a
      reload. Spec 11 owns storage; if it adds a key for this, it must also survive an
      import of someone else's progress without pointing at an act of another track.
- [ ] T107 — `useTweenedT` still runs while the overview is showing, tweening a walker that
      nothing draws. Harmless (it only animates when `t` changes) but it is work with no
      output; if the overview ever gets expensive, gate the hook on the act view.
- [ ] T108 — The overview miniatures carry no dots, so a learner cannot see *which* node
      they are standing on from the zoomed-out screen — only how far along the act is. If
      the minis ever grow (a wider breakpoint, say), revisit: the geometry is already there
      through `PathContext`, and only legibility argued against it.
- [ ] T117 — `.node-panel` in `panel.css` has the same double-scroller as `.progress-panel`
      had: the UA stylesheet gives `<dialog>` its own `overflow: auto`, so a tall node panel
      scrolls beside its content's scroller and loses ~15px of row width. Spec 06 owns that
      file; the fix is one `overflow: hidden` on `.node-panel`.
- [ ] T118 — Import replaces and never merges, which is the honest default with no per-node
      timestamps in the file. If two devices ever need to be reconciled rather than
      overwritten, the file needs a per-id `marked_at` before a merge rule can exist.
- [ ] T119 — The export writes through a `Blob` + object URL + synthetic anchor click. If a
      browser ever blocks that (an aggressive download policy, a sandboxed iframe), the
      learner gets no file and no error. A visible fallback would mean showing the JSON to
      copy by hand, which is a bigger UI than this spec wanted.
- [ ] T120 — T106 (persist the viewed act) stays open after spec 11. Storage now has a
      second key shape to think about: any act key must survive importing a file for another
      track, so it belongs beside the intake, not beside the completed set.
- [ ] T130 — No `README.md`. The repo has a constitution, a state board, a backlog and twelve
      specs, and nothing that tells a visitor what the site is or how to run it. Out of scope
      for spec 12 (one task per session) but the obvious next non-feature task, and the one
      thing a public deploy makes conspicuous.
- [ ] T131 — `.github/workflows/pages.yml` has never run: this repo has no git remote, so
      nothing has exercised `npm ci` or the Pages actions. The first push also needs Pages
      switched to the "GitHub Actions" source in repository settings — the workflow cannot
      set that itself.
- [ ] T132 — `check:theme` reads `src/`, `index.html` and `public/`, and deliberately not
      `scripts/`, because `check-theme.ts` holds all 148 CSS named colours as data and would
      fail on itself. If a script ever renders anything, that exemption has to be revisited
      rather than widened.
- [ ] T133 — The theme gate's `unknown-token` rule now accepts a custom property declared
      anywhere in the scanned source, not only in `theme.css`, so a local geometry property
      is legal. That is the right trade — a colour in a local property is still caught by
      `colour-literal` — but it does mean the gate no longer proves every `var()` in the app
      resolves to a *theme* token.
- [ ] T135 — `--weight-medium` is declared in `theme.css` and read nowhere — the same shape as
      T021, now reported by `check:theme` on every build instead of found by hand. Either a
      weight the type scale wants and no component has asked for yet, or a leftover. Decide
      when something next touches the type scale; a warning never fails the build.
- [ ] T134 — `dist/assets/index-*.js` is 287 kB (81 kB gzipped) in one chunk, all of it React
      plus the 67-node registry. Nothing here is slow, and no spec asked for a budget, but
      nothing asserts one either — if a size gate is ever wanted, `check:output` is where it
      goes.
- [ ] T136 — Spec 13 gave the map a colour system (paper keyed to a node's first link kind)
      and no legend. The card prints its kind in words, so nothing is colour-only, but a
      reader still has to collect five cards before the scheme is obvious. The overview screen
      is where a four-line key would go.
- [ ] T137 — The pocket solver's card size comes from `ActPath.cardSize` and the band spacing
      from `data/tracks.json`. Nothing asserts the two agree; the relationship is written down
      in both files and checked by hand. A unit test over `placePockets` with the registry's
      six curve/count combinations would catch a future edit to either one — it needs no DOM
      if the sampled road is passed in as fixture data.
- [ ] T138 — `--dot-r-spur` and the frontier stop styling in `path.css` are unreachable
      today: no node in `nodes.json` sits on an act path with `zone: frontier`, and no node
      has a `last_commit` old enough to derive dormancy. The rules are written against the
      schema rather than against data, so the first dormant or road-frontier node will be
      their first render. Worth an eyeball then.
- [ ] T139 — A `<dialog>` `::backdrop` reads its custom properties by inheritance from the
      originating element, which current Chrome does and older engines do not. Both panels
      dim with `color-mix(in srgb, var(--surface-road) 40%, transparent)`; where that
      inheritance is missing the scrim is simply absent, and the modal still works. Revisit
      only if a browser matrix is ever written down.
- [ ] T154 — Spec 15's `frontier-ai-engineering` branch (RAG, vector DB, agent frameworks,
      evals, local models) is scoped to `app` only. `game`, `portfolio` and `media` are
      arguably owed the same content — a game dev grounding NPC dialogue in a wiki, a
      portfolio site with a RAG-backed chat widget, a media pipeline with an agent
      choosing shots, are all real — but each needs its own placement decision (which
      anchor, which act) and its own `UNPLACED_NODE` check once the nodes' `tracks`
      arrays grow, not a copy-paste of `app`'s branch.
- [ ] T155 — The owner also asked, in the same conversation as spec 15, for a smoother
      first-use experience — "pop-ups," not landing on the intake screen not knowing what
      to click. Not touched by spec 15, which is registry content only. Distinct from
      anything `CONTEXT.md` section 2 forbids (it is app-navigation guidance, not tool
      explanation) but needs its own scoping pass: what "doesn't know where to click"
      actually refers to, and whether a guided first-run walkthrough fits the paper-roadmap
      identity without turning into a tutorial-site tour that section 2 rules out.
- [ ] T156 — Every one of spec 15's six new nodes carries exactly one link (its GitHub
      repo). Companion docs sites that would normally pair with a "docs" or "playground"
      link — `docs.trychroma.com`, `python.langchain.com`, `ollama.com` among them — are
      blocked outright by this environment's egress proxy and could not be fetched this
      session to confirm live. A session with different network access should try adding
      the second link each of these six nodes is missing.

