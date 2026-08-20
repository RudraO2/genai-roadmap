# Spec 15 — Closing the content gap: a real AI-engineering branch

**Depends on:** 01–14 (every mechanism this spec uses — frontier branches, the registry
schema, the validator — already exists; this spec is content, not new engineering)

**Opened:** 2026-08-20, by the project owner, in conversation, after two rounds of
feedback: the deployed site "doesn't follow the content of famous GitHub repositories,
where they have everything, like the whole roadmap" and a direct instruction to research
those repositories and "revamp this thing... it should be insanely good."

## Why this spec exists

Read against the registry rather than against taste: `data/nodes.json`'s 67 nodes are
entirely about **using AI tools to build** — chat UIs (ChatGPT/Claude/Gemini), coding
agents (Claude Code/Cursor/Copilot), MCP, deployment platforms, and per-track creative
tools (image/video/audio generators, game engines). Compared against two reference
"AI Engineer" roadmaps fetched this session —
[aishwaryanr/awesome-generative-ai-guide's 5-day roadmap](https://raw.githubusercontent.com/aishwaryanr/awesome-generative-ai-guide/main/resources/genai_roadmap.md)
(Day 1 LLM foundations, Day 2 prompting, **Day 3 RAG, Day 4 agents and tools, Day 5
evaluation and shipping**, plus an optional fine-tuning day) and a web search summarising
roadmap.sh's AI Engineer path (Python, ML basics, **LLMs, RAG, evaluation, deployment**) —
the gap is specific and consistent across both sources: **retrieval-augmented generation,
vector databases, agent *frameworks* (as opposed to agent *harnesses* like Claude Code),
evals, and local/open-weight models.** None of the 67 existing nodes touch any of these.

That gap is the honest version of "the content is trash" and "doesn't follow the famous
repos" — not a request to copy those repos' prose (`CONTEXT.md` section 3 forbids that
outright) but a request to close a real, nameable coverage hole using this project's own
mechanism: real, verified pointers.

## Scope

**One new frontier branch, on the `app` track only.** `CONTEXT.md` section 6 is explicit —
every newly-discovered node enters `zone: "frontier"`, no exceptions, and
`data/research-log.md` confirms Phase A applied this literally regardless of star count.
A node discovered today cannot satisfy graduation's "≥90 days since first indexed"
regardless of anything else true about it, so this content cannot land as a new main-road
*act* — main-road placement means the pocket solver, new curve geometry, and a promotion
this spec has no standing to make. A branch is also simply the right container: it is
where "worth knowing about, not yet load-bearing enough to be a numbered stop" already
lives for every other spec that has added tools since Phase A.

Scoped to `app` only, not all four tracks, because placing these nodes on every track
that could plausibly claim them means placing them on every track's road (a node's
`tracks` field is checked against placement — `UNPLACED_NODE` fails the build if a track
is claimed but nothing places the node on it). One track proves the pattern without
multiplying the same six nodes across four branches this session. Extending to
`portfolio`/`media`/`game` is real, separate follow-up work, logged to `BACKLOG.md`
rather than done here.

**Anchor: `api-keys`, under the `intuition` act.** `api-keys`'s own blurb — "the secret
string that lets an app or plugin talk to a model on your behalf" — is exactly the
prerequisite these six nodes share: every one of them is something you reach for once you
have a key and want to do more than chat.

## The six nodes

All `zone: "frontier"`, `first_indexed`/`verified_at: "2026-08-20"`, `status: "core"`
(each is a repo whose star count and `pushed_at` were read from the GitHub API this
session, matching Phase A's literal rule for what earns `core`). In branch order:

| id | What | Stars (2026-08-20) | Last push |
| --- | --- | --- | --- |
| `rag-techniques` | `NirDiamant/RAG_Techniques` — 40+ runnable RAG pattern notebooks | 29,133 | 2026-08-19 |
| `chroma` | `chroma-core/chroma` — open-source vector database | 29,098 | 2026-08-19 |
| `langchain` | `langchain-ai/langchain` — the default LLM-app framework | 144,622 | 2026-08-20 |
| `llamaindex` | `run-llama/llama_index` — data framework for RAG | 51,761 | 2026-08-19 |
| `promptfoo` | `promptfoo/promptfoo` — prompt/agent testing and red-teaming | 24,399 | 2026-08-20 |
| `ollama` | `ollama/ollama` — run open-weight models locally | 179,025 | 2026-08-20 |

Every URL above was fetched this session (via the GitHub MCP tools and `WebFetch`) and
confirmed live before being written into `nodes.json` — `CONTEXT.md`'s one hard rule on
URLs. Several plausible companion links (`docs.trychroma.com`, `python.langchain.com`,
`ollama.com`, `en.wikipedia.org`) are blocked outright by this environment's egress
proxy; rather than write in a URL this session could not itself verify, every node ships
with exactly one link, its GitHub repo. A later session with different network access
can add a docs link once it can fetch one.

## Out of scope

- Any change to `CONTEXT.md`. Nothing here needed one — the frontier-branch mechanism
  already covers content discovered outside a scheduled Phase A pass.
- Extending this branch's nodes' `tracks` to `game`/`portfolio`/`media`, or building an
  equivalent branch for them. Logged to `BACKLOG.md`.
- The onboarding/walkthrough request from the same conversation. Separate concern
  (first-use UI discoverability, not registry content); not touched here.
- Reworking the four existing tracks' architecture into a skills-sequenced "AI Engineer"
  path. The owner's direction was to close a content gap inside the existing shape, not
  to replace `CONTEXT.md` section 4's outcome-track model.

## Acceptance

1. `npm run validate:data` reports 0 errors, 0 warnings with the six new nodes and the
   new branch in place.
2. `npm run build` and `npx tsc --noEmit` both exit 0.
3. In a real browser: the branch renders under the `app` track's "Intuition" act, anchored
   at `api-keys`, with all six cards legible and correctly ordered; no console errors.
4. Every one of the six links opens the real repo it claims to.
