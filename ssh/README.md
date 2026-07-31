# ssh vik.run

Terminal version of the personal site, served over SSH with
[Wish](https://github.com/charmbracelet/wish) +
[Bubble Tea](https://github.com/charmbracelet/bubbletea). Web requests to
vik.run redirect to https://vikram.sh.

## Local dev

```bash
go generate ./...   # sync ../content into the embed dir
go run .
ssh -p 2222 localhost
```

Content changes on the site require re-running `go generate` (and a
redeploy in prod — the Dockerfile does it automatically).

## Tests

```bash
go test ./...
```

## Deploy (Fly.io)

One-time setup:

```bash
fly apps create vik-run

# Persistent host key so visitors never see key-changed warnings:
ssh-keygen -t ed25519 -f /tmp/vikrun_hostkey -N ""
fly secrets set -a vik-run SSH_HOST_KEY="$(base64 < /tmp/vikrun_hostkey)"
rm /tmp/vikrun_hostkey /tmp/vikrun_hostkey.pub

# Raw TCP (port 22) needs a dedicated IPv4 (~$2/mo). IPv6 is free.
fly ips allocate-v4 -a vik-run
fly ips allocate-v6 -a vik-run

# TLS cert for the HTTPS redirect:
fly certs add -a vik-run vik.run
```

DNS (at the registrar): `A @ -> <dedicated v4 from fly ips list>`,
`AAAA @ -> <v6>`. `vikram.sh` stays on Vercel.

Every deploy (from the **repo root**, so `content/` is in the build
context):

```bash
fly deploy . --config ssh/fly.toml --dockerfile ssh/Dockerfile --remote-only
```

Verify: `ssh vik.run` shows the TUI; `curl -I https://vik.run` returns a
redirect to https://vikram.sh (with `force_https = true`, plain
`http://vik.run` first hits Fly's edge redirect to https://vik.run).
