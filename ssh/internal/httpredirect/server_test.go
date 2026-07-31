package httpredirect

import (
	"net/http"
	"net/http/httptest"
	"testing"
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
