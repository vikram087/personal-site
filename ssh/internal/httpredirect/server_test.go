package httpredirect

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRedirectsEverythingToTarget(t *testing.T) {
	h := Handler("https://vikram.sh")
	for _, path := range []string{"/", "/anything/nested?q=1"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusMovedPermanently {
			t.Errorf("%s: status = %d, want 301", path, rec.Code)
		}
		if loc := rec.Header().Get("Location"); loc != "https://vikram.sh" {
			t.Errorf("%s: Location = %q", path, loc)
		}
	}
}

func TestServerWiresRedirectHandler(t *testing.T) {
	srv := Server(":0", "https://vikram.sh")

	if srv.Addr != ":0" {
		t.Errorf("Addr = %q, want %q", srv.Addr, ":0")
	}
	if srv.ReadHeaderTimeout != 5*time.Second {
		t.Errorf("ReadHeaderTimeout = %v, want 5s", srv.ReadHeaderTimeout)
	}

	req := httptest.NewRequest(http.MethodGet, "/anything", nil)
	rec := httptest.NewRecorder()
	srv.Handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusMovedPermanently {
		t.Errorf("status = %d, want 301", rec.Code)
	}
	if loc := rec.Header().Get("Location"); loc != "https://vikram.sh" {
		t.Errorf("Location = %q, want %q", loc, "https://vikram.sh")
	}
}
