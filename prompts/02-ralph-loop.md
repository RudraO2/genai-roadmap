# Prompt 02 — Ralph loop

This exact text is piped to Claude Code on every iteration. It never changes.
State lives in the repo, not in the prompt.

---

## The loop script

```bash
#!/usr/bin/env bash
# run-ralph.sh — run inside a container or a dedicated git worktree.
set -uo pipefail

MAX_ITER=${1:-40}

for i in $(seq 1 "$MAX_ITER"); do
  echo "=== Ralph iteration $i · $(date) ==="

  if ! grep -q '^- \[ \]' BACKLOG.md; then
    echo "Backlog empty. Stopping."
    break
  fi

  cat prompts/02-ralph-loop.md | claude -p \
    --permission-mode acceptEdits \
    --allowedTools "Read,Write,Edit,Glob,Grep,Bash,WebSearch,WebFetch" \
    --max-turns 40 \
    --output-format text \
    | tee -a logs/ralph-$(date +%F).log

  sleep 5
done
```

Two things worth knowing before you run this unattended:

- `--permission-mode acceptEdits` auto-approves file edits but still gates other
  actions. If you reach for `--dangerously-skip-permissions` instead, only do it
  inside a container — it approves everything, including destructive shell commands.
- A cold `claude -p` reloads full project context each iteration, which costs real
  tokens. Start with `MAX_ITER=5` and read the log before letting it run to 40.

---

## The prompt itself

Everything below this line is the content piped to Claude Code.

---

You are working autonomously on one task, then exiting. Another instance of you will
pick up the next one. Leave the repo in a state that a stranger could continue from.

### Step 1 — Load context

Read in this order:
1. `CONTEXT.md` — the constitution. Non-negotiable.
2. `BACKLOG.md` — the task list.
3. `PROGRESS.md` — what previous iterations did and learned.
4. `BLOCKED.md` — do not retry anything listed here.

### Step 2 — Claim exactly one task

Take the **first unchecked** task in `BACKLOG.md` that is not listed in `BLOCKED.md`.

Immediately mark it `- [~]` (in progress) and commit that single change before doing
any work. This is how a crashed iteration doesn't get silently redone.

**Do exactly one task. Not two. Not "while I'm in here."** If you notice other work
that needs doing, append it to the end of `BACKLOG.md` as a new task and move on.

### Step 3 — Read the spec

Open the spec file named in the task. Follow it precisely. If the spec is ambiguous,
choose the simpler interpretation and record the choice in `PROGRESS.md` — do not
invent scope to resolve ambiguity.

### Step 4 — Do the work

Constraints, all of which override anything a spec seems to imply:

- Store pointers, never content. If the task asks you to write an explanation of a
  tool, stop — that's a spec error. Log it to `BLOCKED.md`.
- No backend, no auth, no database, no server routes.
- No new npm dependencies. If one seems necessary, log to `BLOCKED.md` and pick the
  next task instead.
- All color and typography values go in `theme.css` as custom properties. Zero
  hardcoded hex outside that file.
- Re-read the anti-slop section of `CONTEXT.md` before writing any UI. If what you
  are about to build has a gradient, a glow, glassmorphism, or an emoji icon, you have
  violated the constitution.
- Never edit `CONTEXT.md`.
- Never add a URL to `nodes.json` that you have not fetched successfully in this
  session.

### Step 5 — Verify

Run, and do not proceed until all pass:

```bash
npm run build
npx tsc --noEmit
```

If either fails, fix it. If you cannot fix it in this iteration, revert your changes
with `git checkout .`, set the task back to `- [ ]`, append a note to `BLOCKED.md`
explaining the failure, and exit cleanly.

### Step 6 — Record and commit

1. Mark the task `- [x]` in `BACKLOG.md`.
2. Append to `PROGRESS.md`:
   ```
   ## T0XX — <task title> — <date>
   Did: <one or two sentences>
   Decided: <any ambiguity you resolved and why>
   Next iteration should know: <anything non-obvious>
   ```
3. Commit everything with message `T0XX: <task title>`.
4. **Exit.** Do not start another task.

### Step 7 — Self-check before exiting

Answer these in your final output:

- Did I complete exactly one task?
- Does the build pass?
- Did I add any content that should have been a link?
- Did I add any hardcoded color outside `theme.css`?
- Would the next instance know where to pick up from `PROGRESS.md` alone?
