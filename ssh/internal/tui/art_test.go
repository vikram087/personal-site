package tui

import (
	"strings"
	"testing"

	"vik.run/ssh/internal/content"
)

// Static list guards against the embedded content tree being empty
// (data/ is populated by go generate); the dynamic loop below catches
// sections added later.
var knownSections = []string{
	"ABOUT", "WORK", "VENTURES", "PROJECTS", "EDUCATION", "HOBBIES", "CONTACT",
}

func TestEveryKnownSectionHasArt(t *testing.T) {
	for _, title := range knownSections {
		if strings.TrimSpace(sectionArt[title]) == "" {
			t.Errorf("section %q has no art", title)
		}
	}
}

func TestEveryLoadedSectionHasArt(t *testing.T) {
	for _, s := range content.Sections(content.FS()) {
		if strings.TrimSpace(sectionArt[s.Title]) == "" {
			t.Errorf("loaded section %q has no art", s.Title)
		}
	}
}

func TestArtWidthLimits(t *testing.T) {
	for title, art := range sectionArt {
		if w := artWidth(art); w > 32 {
			t.Errorf("art for %q is %d cols wide, max 32", title, w)
		}
	}
	if w := artWidth(welcomeArt); w > 40 {
		t.Errorf("welcome art is %d cols wide, max 40", w)
	}
}

func TestArtFits(t *testing.T) {
	art := sectionArt["ABOUT"]
	w := artWidth(art)
	cases := []struct {
		name          string
		width, height int
		want          bool
	}{
		{"fits", w, artMinHeight, true},
		{"too short", w, artMinHeight - 1, false},
		{"too narrow", w - 1, artMinHeight, false},
	}
	for _, c := range cases {
		if got := artFits(art, c.width, c.height); got != c.want {
			t.Errorf("%s: artFits(art, %d, %d) = %v, want %v",
				c.name, c.width, c.height, got, c.want)
		}
	}
	if artFits("", 100, 100) {
		t.Error("empty art should never fit")
	}
}
