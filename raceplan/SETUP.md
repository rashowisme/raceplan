# Getting started (for you, the human)

## 1. Prerequisites
- Node.js LTS, git, and pnpm (`corepack enable`)
- Claude Code (VS Code extension or the `claude` CLI)
- VS Code

## 2. Set up the folder
1. Create an empty folder, e.g. `raceplan/`, and copy these files in, keeping the paths:
   - `CLAUDE.md`
   - `docs/training-spec.md`
   - `.claude/settings.json` (auto-accepts edits and safe commands, blocks push/deploy/rm -rf)
2. In a terminal inside the folder: `git init && git add . && git commit -m "docs: project brief"`
3. Open the folder in VS Code and open Claude Code.

## 3. First prompt
```
Read CLAUDE.md and docs/training-spec.md fully. Then build v1 milestone by
milestone (M0 → M7) as described in CLAUDE.md §7. Commit after each milestone
and keep docs/progress.md up to date. Work autonomously; only stop for items in §8.
When a milestone is done, give me a 2–3 line summary and continue to the next.
```

## 4. Continuing in a new session
A long build will likely span several sessions. When you start a new one:
```
Read CLAUDE.md, docs/progress.md and docs/decisions.md, then continue with the
next unfinished milestone.
```
Starting a fresh session per milestone (or using `/clear`) keeps Claude focused and cheaper, since the progress file carries the context forward.

## 5. Tips
- You can redirect at any time ("skip polish for now, fix the pace calculation").
- If you'd rather not be asked for permission at all, `claude --dangerously-skip-permissions` exists, but only use it inside a container/VM, not on your main machine. The settings file already removes most prompts.
- Review `docs/decisions.md` now and then. It's where Claude explains the choices it made without you.
- Things I chose for you (change them in CLAUDE.md if you disagree): tests + commit after every milestone, Claude never pushes or deploys, plans stored only in the browser for v1, an optional "target time" field, a "PR date" field so old PRs count less, and "currently injured" blocks plan generation.
