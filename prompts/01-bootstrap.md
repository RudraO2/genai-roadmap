# Prompt 01 — Bootstrap

Run this ONCE, interactively, before starting the Ralph loop. Do not run this headless.
Review its output yourself before proceeding.

---

Read `CONTEXT.md` in full. It is the constitution for this project. Everything below
operates inside it.

You are going to do three things in order, and you will stop for my review after each.

## Phase A — Research the node registry

I have seeded `data/seeds.md` with tools and concepts I already know are worth
including. **Your job is enrichment and verification, not discovery from scratch.**

For every seed, use web search and web fetch to establish:

- The canonical repository URL (verify it returns 200)
- The canonical docs URL, if different
- Star count and date of last commit
- A blurb of max 90 characters, in your own words, saying what it is and why someone
  would care
- `level` — beginner / intermediate / advanced
- `requires` — which other node ids must come first
- `tracks` — which of game / app / portfolio / media this serves

Then expand carefully. For each seed, look at:
- The repo's own "related projects" / "alternatives" sections
- GitHub topic pages for its tags
- `awesome-*` lists that include it

**Every discovered item enters with `zone: "frontier"`. Never the main path.**
Only seeds I gave you may start in `zone: "main"`.

### Research honesty rules

- If you cannot verify a repo URL returns 200, **drop the node**. Do not guess a URL.
- If you cannot find a last-commit date, mark the node `status: "emerging"` and note it.
- Do not include a tool because a blog post ranked it. Include it because the repo is
  real, active, and someone would plausibly use it this month.
- Search results skew toward SEO listicles and are three months behind X discourse.
  Treat a listicle as a lead to verify, never as a source to copy.
- Target 40–70 nodes total. If you have 200, you have not filtered.

Write `data/nodes.json` and `data/tracks.json`. Then **stop and show me a summary
table** of what you indexed, what you rejected and why, and what you couldn't verify.

## Phase B — Write the specs

Once I approve the registry, decompose the build into specs in `specs/`, numbered,
in dependency order. Each spec is a single markdown file containing:

- **Goal** — one paragraph
- **Scope** — explicit in/out lists
- **Interfaces** — the exact types, props, and file paths it creates or touches
- **Acceptance criteria** — a checklist someone else could verify without asking you
- **Depends on** — spec numbers

Constraints on the decomposition:

- Each spec must be completable in a single focused session
- Each must leave the app in a working, buildable state
- Spec 01 must be the type definitions and data schema — everything else imports from it
- The visual shell must come early so the aesthetic can be judged before systems are built
- No spec may introduce a backend, auth, or database

Aim for 8–12 specs. **Stop and show me the list of spec titles before writing them
in full.**

## Phase C — Build the backlog

Once I approve the specs, convert them into `BACKLOG.md`: a flat, ordered checklist of
atomic tasks. Each task:

- Has a stable id (`T001`, `T002`, …)
- Names its spec file
- Is small enough to complete and verify in one pass
- Is written so that someone with no memory of this conversation could execute it

Format exactly:

```
- [ ] T001 · spec-01-schema.md · Define Node and Track TypeScript interfaces in src/types.ts
```

Then stop. I will start the loop.
