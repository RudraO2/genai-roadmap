# Research log — Phase A

Registry built 2026-08-18. Every URL in `nodes.json` was fetched with `curl -L` in that
session and returned HTTP 200 (98 unique URLs, re-verified as a batch after generation).
Star counts and `last_commit` (GitHub `pushed_at`) came from `api.github.com` the same day.

## Rejected — could not verify

| Seed | Reason |
| --- | --- |
| Meta AI Imagine | `https://www.meta.ai/` and `https://ai.meta.com/` both refuse automated requests (403 / 400). No verifiable canonical URL, so the node was dropped per the honesty rule. |
| Wireflow / hosted Remotion-style pipelines | No product by that name found. Search returned an unrelated Wireflow (a wireframing tool). Nothing to verify. |
| Browser-native all-in-one creative suites ("AI-0", "ZSky-style") | Category, not a product. No named tool resolved to a live URL. |

## Rejected — merged rather than dropped

| Seed | Where it went |
| --- | --- |
| Skills-over-MCP packaging | Covered by `agent-plugins-spec`. It is a positioning argument, not a tool with a repo. |
| Multi-app agent connectors (OAuth style) | Same node as `one-mcp`, which is the concrete instance of the pattern. |
| Netlify and Cloudflare Pages | One node, `netlify-cf-pages`. Same job, same act, two links. |
| CapCut and Dreamina | One node. Dreamina is CapCut's generation surface. |
| HyperFrames skills / Remotion skills | Kept as separate nodes, but they `require` their parent tool so they cannot appear first. |

## Corrections to the seed file

| Seed claim | What is actually true |
| --- | --- |
| Agent Plugins 1.0 is an AAIF standard | It is not. AAIF wrote about it. The spec is governed independently by a TSC with members from Amazon, Cursor, Microsoft, OpenAI and Vercel. |
| MCP GitHub server is `@modelcontextprotocol/server-github` | The maintained one is `github/github-mcp-server`, GitHub's own, in Go. |
| MCP Brave server is `@modelcontextprotocol/server-brave-search` | Brave now ships its own: `brave/brave-search-mcp-server`. |
| `npx skills add` — ecosystem unnamed | The CLI is `vercel-labs/skills`, registry at `skills.sh`. |
| Claude at `claude.ai` | `claude.ai` returns 403 to automated requests. `claude.com` verified instead. |
| Kling at `kling.ai` | Verified. `app.klingai.com` added as the direct app link. |
| Grok Imagine at `x.ai` | `x.ai/news/grok-imagine` is 404. Linked `grok.com` plus `x.ai` instead. |

## Repos that had moved

Followed the GitHub API redirect rather than trusting the seed path.

| Looked for | Resolved to |
| --- | --- |
| `sst/opencode` | `anomalyco/opencode` |
| `jlowin/fastmcp` | `PrefectHQ/fastmcp` |
| `supabase-community/supabase-mcp` | `supabase/mcp` |
| `photonstorm/phaser` | `phaserjs/phaser` |

## The freshness rule, applied literally

CONTEXT: *"If you cannot find a last-commit date, mark the node `status: "emerging"` and
note it."* Applied with no exception for hosted products. **`status: "core"` in this
registry means exactly one thing: a repo whose last commit date was read from the GitHub
API on the day of indexing.** Nothing else can earn it.

Final split — 25 `core`, 42 `emerging`, 0 `dormant`, 0 `superseded`.

The 39 nodes with `last_commit: null` fall in three groups, each carrying a `note` saying
which:

- **Hosted products** (ChatGPT, Claude, Gemini, Cursor, Copilot, Vercel, Suno, Kling,
  Runway, Veo, ElevenLabs, Ideogram, Leonardo, Krea, Perchance, Grok Imagine, CapCut,
  v0, Lovable, itch.io, GitHub Pages, Websim, Rosebud, Remocn Studio, Netlify/CF Pages,
  Cursor rules) — no public commit history exists to read.
- **Concept nodes** (prompting, reading a README, tokens, context window, hallucination,
  temperature, model vs chat vs agent, API keys, CLAUDE.md, adding an MCP server, remote
  MCP servers) — practices, not releases. Nothing to date-stamp.
- **Documentation surfaces of a parent tool** (HyperFrames skills, Remotion agent skills)
  — freshness follows the parent repo.

Three more nodes are `emerging` despite having a date, on their own merits: `one-mcp`
(9 stars), `framepack` (3 stars), `awesome-claude-skills` (112 days stale).

The generator enforces this: a node with no `last_commit` fails validation unless it is
both `emerging` and carries a `note`.

Consequence worth knowing before building the UI: `emerging` is the majority state, so it
must not render as a warning badge. It means "freshness unknown or unproven", not "risky".
The genuinely unproven signal is `emerging` **plus** a low star count, and that reading
lives in the node's `note`.

## Sites that block automated requests but are real

Linked via a verified alternative URL, noted on the node.

- `claude.ai` → linked `claude.com`
- `phaser.io` → linked `github.com/phaserjs/phaser`

## Discovery vectors used

- `punkpeye/awesome-mcp-servers` and the official `modelcontextprotocol/registry` → MCP servers
- `travisvn/awesome-claude-skills` and `skills.sh` → skills
- GitHub topic and search for CLI coding agents → OpenCode, Codex CLI, Cline
- Game track was almost empty in the seeds → Phaser, KAPLAY, three.js, Rosebud, Websim, itch.io

Every discovered item entered with `zone: "frontier"`. No exceptions.

## Known stale at time of indexing

- `travisvn/awesome-claude-skills` — last push 2026-04-28, 112 days. Real, drifting.
- `ARTHUR-BBU/framepack` — 3 stars, last push 2026-07-15.
- `withoneai/mcp` — 9 stars. Product is real; the repo is not the adoption signal.
- `phaserjs/phaser` — last push 2026-07-09. Normal cadence for a mature engine, not dormant.

## Not indexed, but worth knowing (from the same searches)

- Gemini CLI was retired 2026-06-18 for a closed-source successor.
- Roo Code was archived in May 2026.

Neither was a seed. If either is added later, it belongs in as `status: "superseded"` /
`"dormant"` rather than omitted — CONTEXT section 6 says dead tools are useful information.
