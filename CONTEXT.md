# CONTEXT.md — Project constitution

**Read this fully before every task. Never edit this file.**

---

## 1. What this is

An open-source, interactive **roadmap** for modern AI/GenAI tooling. A learner picks a
track, tells us their level, and gets a visual path of *what to learn, in what order,
and from where*.

## 2. What this is NOT

Read this twice. Every previous attempt to spec this project drifted here.

| ❌ NOT this | ✅ This instead |
| --- | --- |
| A course or tutorial site | An index of external links |
| Hosting explanations of tools | Linking to the tool's own docs |
| Generating setup commands | Linking to the repo README |
| Rewriting docs for beginners | Tagging a difficulty level and linking out |
| Quizzes, lessons, video embeds | Nodes, links, prerequisites |
| A backend, accounts, or login | Static site + localStorage |

**The learner brings their own ChatGPT/Claude/Gemini to actually learn the thing.**
We are signposts on a road. We are not the school.

## 3. The one hard rule

> **Store pointers, never content.**

A node holds a URL and metadata about that URL. It never holds a copy of what's at
that URL. This is what makes the project zero-maintenance: upstream maintainers keep
our content current for free, because they're already maintaining it for themselves.

If a task ever requires writing an explanation of how a tool works — the task is wrong.
Stop and log it to `BLOCKED.md`.

## 4. Tracks

The learner picks one at entry. Each renders as its own map.

| Track | Destination |
| --- | --- |
| `game` | Ship a playable game |
| `app` | Ship a working application |
| `portfolio` | Ship a personal site that gets you hired |
| `media` | Ship image / video / audio / music work |

**Architecture:** one flat node registry, four route definitions. A node is a graph
entity; a track is an ordered path through the graph. Nodes are shared freely across
tracks — "context engineering" appears in all four. Never duplicate a node per track.

All tracks share a `foundations` prefix (~5 nodes) before diverging.

## 5. Levels

Every node carries `level: beginner | intermediate | advanced`. Intake asks the
learner's level and hides nodes below it (collapsed, not deleted — they can expand).

## 6. The Frontier

New tools land in a visually distinct **Frontier branch** spurring off the main path,
explicitly marked unproven.

Graduation to the main path requires ALL of:
- ≥ 90 days since first indexed
- Commits within the last 60 days
- ≥ 1000 stars OR clear upward star velocity

Demotion is automatic: no commits in 12 months → greyed out, marked dormant, kept
visible with its successor linked if one is known. **Dead tools are useful information.
Never delete a node.**

## 7. Data shapes

`data/nodes.json` — the registry. One entry per tool/concept:

```json
{
  "id": "mcp-servers",
  "title": "Model Context Protocol",
  "blurb": "Standard for giving agents tools and data. One line, max 90 chars.",
  "level": "intermediate",
  "tracks": ["app", "game", "media"],
  "requires": ["agent-basics"],
  "links": [
    { "label": "Spec", "url": "https://...", "kind": "docs" },
    { "label": "Repo", "url": "https://...", "kind": "repo" }
  ],
  "repo": "modelcontextprotocol/servers",
  "stars": 0,
  "last_commit": "2026-08-01",
  "status": "core",
  "zone": "main",
  "first_indexed": "2026-08-18",
  "verified_at": "2026-08-18"
}
```

`status`: `core | emerging | dormant | superseded`
`zone`: `main | frontier`
`kind`: `repo | docs | video | thread | article | playground`

`data/tracks.json` — ordered node ids per track, plus map curve geometry.

**Never invent a URL.** Every link must come from a real search result or fetch that
returned 200. A hallucinated repo is worse than a missing node.

## 8. Visual identity — anti-slop directive

The aesthetic is **editorial dark terminal**: a technical publication, not a SaaS
landing page.

### Banned outright

- Purple→blue gradients. Any gradient used decoratively.
- Glassmorphism, `backdrop-blur`, frosted panels
- Emoji as UI icons
- Default Tailwind palette tokens (`slate-900`, `indigo-500`, `violet-*`)
- Glow shadows, neon halos, `box-shadow` with color
- Bento grids
- Inter as the primary typeface
- Uniform `rounded-2xl` on every surface
- Centered hero + gradient headline + two pill buttons

### Required

- **Type:** one serif display face (e.g. Instrument Serif) + one mono for all
  structural/UI text (e.g. JetBrains Mono or IBM Plex Mono). The mono is the voice
  of the interface. Real hierarchy: 3 sizes minimum, meaningful weight jumps.
- **Color:** near-black base (`#0B0C0E`–`#111316`), warm off-white text
  (`#E8E4DC`), and **exactly one** accent hue used sparingly. Accent means "here,"
  not "decoration."
- **Structure:** hairline rules (1px, low opacity) instead of card borders. Hard
  edges by default; rounding only where something is genuinely tactile.
- **Space:** generous. Emptiness is the luxury signal. Do not fill the canvas.
- **Motion:** only to show state change. No ambient float, no parallax.

### The test

Would this look at home in a print technical journal? If it looks like a Product Hunt
launch, it's wrong.

## 9. The map rendering

The path is **one SVG `<path>` element per track**. This is load-bearing:

- Node placement = `path.getPointAtLength(total * node.t)` where `t` is 0–1.
  Nodes store a percentage, never x/y.
- Fog of war = `stroke-dasharray` + `stroke-dashoffset` on the same path.
- Character position = tween `t`, read the point each frame. Sample `t + 0.001`,
  `Math.atan2` the delta for facing direction.
- Completed glow = a second path layered above, dash-clipped to progress.

One element, four systems. Do not reimplement any of these separately.

Cards sit in the negative-space pockets created by the S-curve bends, alternating
sides. Each act is its own serpentine screen; a zoomed-out overview chains the acts.

**Character: for now, draw it in code** — a simple geometric shape with a two-state
bob animation. Sprite sheets arrive later and must slot in behind the same
`<Character t={...} facing={...} />` interface. Do not block on assets.

## 10. Stack

- Vite + React + TypeScript
- Tailwind for layout only — all color/type via CSS custom properties in one
  `theme.css`, so the theme is swappable in one file
- localStorage for progress; JSON export/import for device sync
- Static build, deployable to GitHub Pages. **No backend. No auth. No database.**
- Dependencies: nothing beyond the above without logging to `BLOCKED.md` first

## 11. Deferred to v2 — do not build

Leaderboards, peer verification, guilds, streaks-with-social, proof-of-work
submission. All need a backend. v1 is the map only.

## 12. Definition of done for any task

- `npm run build` passes
- `npx tsc --noEmit` passes
- No hardcoded colors outside `theme.css`
- No node in `nodes.json` with an unverified URL
- Committed with a message naming the task id
