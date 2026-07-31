# `ssh vik.run` — Terminal Version of the Personal Site

**Date:** 2026-07-30
**Status:** Approved

## Overview

A Go SSH application serving a read-only TUI version of the personal site's
content. Visitors run `ssh vik.run` and get a two-pane terminal browser of the
same MDX content that powers the website (deployed on Vercel at `vikram.sh`).
Built with Charm's Wish (SSH server) and Bubble Tea (TUI framework), deployed
on Fly.io.

Domain split:

- `vik.run` → Fly.io app (SSH on 22, HTTP on 80/443 redirecting to `vikram.sh`)
- `vikram.sh` → existing Next.js site on Vercel (unchanged)

## Architecture

A single Go module at `ssh/` inside this repo. One process, two listeners:

- **SSH (internal 2222, external 22 via Fly):** Wish server with Bubble Tea
  middleware. All users/keys accepted — no auth; visitors get the TUI, never a
  shell. Wish's `activeterm` middleware rejects non-interactive sessions
  (`scp`, `sftp`, plain `ssh vik.run <cmd>`).
- **HTTP (internal 8080, external 80/443 via Fly):** trivial handler that
  301-redirects every request to `https://vikram.sh`.

## Components

Small files, one job each:

| File | Responsibility |
|------|----------------|
| `ssh/main.go` | Wire up both servers, graceful shutdown |
| `ssh/internal/content/content.go` | `go:embed` of synced MDX data |
| `ssh/internal/content/parse.go` | Frontmatter parsing, JSX stripping |
| `ssh/internal/tui/model.go` | Bubble Tea root model: list + viewport state |
| `ssh/internal/tui/sections.go` | Section tree mapping embedded files to menu |
| `ssh/internal/tui/styles.go` | lipgloss theme (nebula purple / starlight) |
| `ssh/internal/httpredirect/server.go` | HTTP → `vikram.sh` redirect listener |
| `ssh/internal/gen/sync.go` | `go generate` tool: copy `../content` into embed dir |

## Content Pipeline

Chosen approach: **embed MDX directly** (over a Node build-time converter or
hardcoded Go content).

- `go:embed` cannot reference files outside the `ssh/` module, so
  `go generate ./...` runs a small Go tool that copies
  `../content/**/*.mdx` into `ssh/internal/content/data/`.
- The copy is a build artifact: gitignored, never hand-edited.
- The Dockerfile runs `go generate` before `go build`, so every Fly deploy
  embeds the current site content.
- Frontmatter supplies list labels and ordering.
- JSX component tags (`<Gallery … />` etc.) are stripped with a conservative
  regex before rendering; images are dropped (no images over SSH).
- Markdown renders in the viewport via glamour with a custom style matching
  the TUI theme.

## Content Scope

Full mirror of the site:

- About
- Work (8 entries under `content/professional/work/`)
- Ventures (3 entries under `content/professional/ventures/`)
- Projects (3 entries under `content/professional/projects/`)
- Education (2 entries under `content/education/`)
- Hobbies (4 entries under `content/hobbies/`)
- Contact

## TUI Behavior

Two-pane browser (lazygit-style):

```
┌ vik.run ─────────────────────────────────┐
│ ABOUT      │ # ScoreData                 │
│ WORK     ▸ │                             │
│ VENTURES   │ AI-powered lead scoring...  │
│ PROJECTS   │                             │
│ EDUCATION  │ Worked on the data          │
│ HOBBIES    │ pipeline that...            │
│ CONTACT    │                             │
│            │                             │
│ ↑↓ nav · enter open · esc back · q quit  │
└──────────────────────────────────────────┘
```

- Left pane: section list. Sections with multiple entries (Work, Ventures,
  Projects, Education, Hobbies) drill down to an entry list; ESC goes up a
  level. About and Contact open directly.
- Right pane: glamour-rendered scrollable viewport.
- Keys: `↑/↓` or `j/k` navigate, `enter` open, `esc` back, `q`/`ctrl+c` quit.
- Footer: keybindings plus a plug for `https://vikram.sh`.
- Handles terminal resize; shows a minimum-size message below 60×15.

## Deployment (Fly.io)

- `ssh/fly.toml` + `ssh/Dockerfile` (multi-stage: golang builder → minimal
  runner).
- Services: external 22 → internal 2222 (raw TCP); external 80/443 → internal
  8080 (Fly terminates TLS).
- SSH host key persists via Fly secret `SSH_HOST_KEY` (base64-encoded PEM),
  generated once locally, loaded at boot — so visitors never see key-changed
  warnings across deploys. Dev fallback: ephemeral generated key.
- `fly certs add vik.run` for the HTTPS redirect cert.
- DNS: `vik.run` A/AAAA → Fly IPs; `vikram.sh` stays on Vercel.

## Error Handling

- Malformed or missing frontmatter → file skipped with a log line, never a
  crash.
- Glamour render error → fall back to raw markdown text.
- Per-connection panic recovery (Wish middleware) so one visitor's session
  can't kill the server.
- Missing `SSH_HOST_KEY` in production → log a warning and generate an
  ephemeral key (degraded but alive).

## Testing

Go-native, no live SSH required (`go test ./...`):

- Unit: frontmatter parsing, JSX stripping, section-tree building from
  embedded content.
- TUI: `teatest` model test for the navigation flow (open section → open
  entry → esc back → quit).
- HTTP: redirect handler test (status + Location header).

## Out of Scope

- Images/galleries over SSH (dropped at render time)
- Auth, user accounts, or shell access
- Analytics
- Moving the website off Vercel
