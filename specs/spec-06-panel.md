# Spec 06 — The node panel: pointers, never content

**Depends on:** 01 (types/registry — `Kind`, `KINDS` display order), 05 (node cards — `NodeCard`,
the node whose detail this panel opens)

## Goal

Give every node card a way to open its full metadata: links grouped by `kind` in the
`KINDS` display order already reserved in `constants.ts`, star count, last commit date,
`status`, and `note`. This is the panel `CONTEXT.md` section 3 constrains hardest — it
renders pointers and facts about a URL, never a description of what the tool does or how
to use it. The card (spec 05) stays the at-a-glance surface; the panel is where a learner
goes to actually click through to the source.

## In scope

- `NodePanel`: a native `<dialog>` showing one node's full metadata — title, level/status,
  star count, last commit date, `note` (when present), and links grouped by `kind`.
- Opening the panel from a full (non-stub) `NodeCard` by activating its title.
- Closing via an explicit close control, `Escape` (native `<dialog>` behavior), and a click
  on the backdrop.
- Grouping links by `Kind` in `KINDS` order; a kind with no links for this node renders no
  group at all (no empty headings).

## Out of scope

- Any prose describing what a tool is or how to use it. If the panel ever needs a
  sentence beyond the node's existing `blurb`, that request is wrong — log it to
  `BLOCKED.md`.
- Prerequisite (`requires`) display — not named in the spec board description; a later
  spec can add it if navigation needs it.
- Fog of war, the character, frontier branches (specs 07–09).
- Changing `NodeCard`'s stub/expand or completion-toggle behavior from spec 05, beyond
  making its title a panel-opening control.

## Files

- `specs/spec-06-panel.md` — this file
- `src/components/NodePanel.tsx` — new. The `<dialog>` component.
- `src/components/NodeCard.tsx` — edited. Title becomes a button that opens the panel;
  renders `<NodePanel>` for the card's node, controlled by new local state.
- `src/styles/panel.css` — new. `.node-panel` and its parts, `::backdrop`.
- `src/index.css` — edited. Imports `panel.css`.

## Interfaces

```ts
// src/components/NodePanel.tsx
export interface NodePanelProps {
  node: Node
  open: boolean
  onClose: () => void
}
export function NodePanel(props: NodePanelProps): ReactNode
```

`NodePanel` owns a `<dialog>` ref and syncs it to the `open` prop with `showModal()` /
`close()` in an effect — a controlled dialog, not an imperative handle. The native `close`
event (fired by `Escape` and by `.close()`) calls `onClose`, so `Escape` and the parent's
own state agree without extra wiring. A click whose target is the `<dialog>` element itself
(the backdrop area, since content sits in a nested wrapper) also calls `onClose`.

`NodeCard` adds one `useState<boolean>` for whether its panel is open, alongside the
existing `expanded`/`complete` state from spec 05. It does not lift this to `TrackMap` or
`App` — spec 05 already established that a card's own interaction state stays local to the
card.

## Acceptance criteria

- [ ] Activating a full card's title opens that node's panel; a stub card's title still
  only expands the stub (spec 05 behavior unchanged).
- [ ] The panel shows: title, level, status, star count (or a placeholder when `stars` is
  `null`), last commit date (or a placeholder when `last_commit` is null), `note` when
  present, and every link grouped under its `kind`, kinds in `KINDS` order, empty kinds
  omitted.
- [ ] Every link is a real `<a href>` to `link.url`, opening in a new tab
  (`target="_blank" rel="noreferrer"`), and no link text is invented — it renders
  `link.label` verbatim.
- [ ] No prose anywhere in the panel beyond the node's existing `blurb`/`title`/`note`
  fields already in the registry — nothing authored fresh describing the tool.
- [ ] `Escape` closes an open panel and returns focus to the title control that opened it
  (native `<dialog>` behavior — verify, don't fight it).
- [ ] A click on the backdrop closes the panel; a click inside the panel's content does not.
- [ ] The explicit close control closes the panel and is reachable by keyboard.
- [ ] Opening a second node's panel while one is open does not leave two panels visibly
  stacked — only one `<dialog>` is ever in its open state at a time.
- [ ] No hardcoded colour, gradient, glow, or emoji anywhere in the new/edited files —
  every colour is a `var(--...)` or a `color-mix()` built from one.
- [ ] No horizontal overflow at a 360px-wide viewport with the panel open.
- [ ] `npm run build` and `npx tsc --noEmit` both exit 0.
