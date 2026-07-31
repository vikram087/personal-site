// Package httpredirect serves a permanent redirect from vik.run's web
// ports to the main website.
package httpredirect

import (
	"net/http"
	"time"
)

// Handler 301-redirects every request to target.
func Handler(target string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target, http.StatusMovedPermanently)
	})
}

// Server returns an *http.Server configured to 301-redirect every
// request on addr to target. The caller owns its lifecycle (e.g. to
// call Shutdown for graceful termination alongside other listeners).
func Server(addr, target string) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           Handler(target),
		ReadHeaderTimeout: 5 * time.Second,
	}
}
