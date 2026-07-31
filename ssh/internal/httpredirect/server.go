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

// ListenAndServe blocks serving the redirect on addr.
func ListenAndServe(addr, target string) error {
	srv := &http.Server{
		Addr:              addr,
		Handler:           Handler(target),
		ReadHeaderTimeout: 5 * time.Second,
	}
	return srv.ListenAndServe()
}
