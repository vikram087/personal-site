// Command ssh serves the personal site as a terminal UI over SSH
// (ssh vik.run) and redirects web traffic to https://vikram.sh.
package main

import (
	"context"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/activeterm"
	bm "github.com/charmbracelet/wish/bubbletea"
	"github.com/charmbracelet/wish/logging"
	wishrecover "github.com/charmbracelet/wish/recover"

	"vik.run/ssh/internal/content"
	"vik.run/ssh/internal/httpredirect"
	"vik.run/ssh/internal/tui"
)

const shutdownGrace = 10 * time.Second

func main() {
	sshAddr := ":" + envOr("SSH_PORT", "2222")
	httpAddr := ":" + envOr("HTTP_PORT", "8080")
	target := envOr("REDIRECT_TARGET", "https://vikram.sh")

	sections := content.Sections(content.FS())
	if len(sections) == 0 {
		log.Println("warning: no content loaded — did `go generate ./...` run?")
	}

	srv, err := wish.NewServer(append(hostKeyOption(),
		wish.WithAddress(sshAddr),
		wish.WithMiddleware(
			wishrecover.Middleware(
				bm.Middleware(teaHandler(sections)),
				activeterm.Middleware(),
				logging.Middleware(),
			),
		),
	)...)
	if err != nil {
		log.Fatalf("creating ssh server: %v", err)
	}

	go func() {
		log.Printf("http redirect %s -> %s", httpAddr, target)
		if err := httpredirect.ListenAndServe(httpAddr, target); err != nil &&
			!errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("http server: %v", err)
		}
	}()

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		log.Printf("ssh server listening on %s", sshAddr)
		if err := srv.ListenAndServe(); err != nil &&
			!errors.Is(err, ssh.ErrServerClosed) {
			log.Fatalf("ssh server: %v", err)
		}
	}()

	<-done
	log.Println("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), shutdownGrace)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
		log.Printf("shutdown: %v", err)
	}
}

// teaHandler builds a fresh TUI model per SSH session.
func teaHandler(sections []content.Section) bm.Handler {
	return func(s ssh.Session) (tea.Model, []tea.ProgramOption) {
		return tui.New(sections), []tea.ProgramOption{tea.WithAltScreen()}
	}
}

// hostKeyOption loads the persistent host key from SSH_HOST_KEY
// (base64-encoded PEM, set as a Fly secret). Without it, a key is
// generated at .data/host_key — fine for dev, warns in case prod
// forgot the secret (visitors would see key-changed warnings).
func hostKeyOption() []ssh.Option {
	if b64 := os.Getenv("SSH_HOST_KEY"); b64 != "" {
		pem, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			log.Fatalf("SSH_HOST_KEY is not valid base64: %v", err)
		}
		return []ssh.Option{wish.WithHostKeyPEM(pem)}
	}
	log.Println("warning: SSH_HOST_KEY not set; using generated key at .data/host_key")
	return []ssh.Option{wish.WithHostKeyPath(".data/host_key")}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
