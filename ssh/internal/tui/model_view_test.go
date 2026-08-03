package tui

import (
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"

	"vik.run/ssh/internal/content"
)

// viewSections mirrors the fixture in model_test.go but is visible to
// the internal test package.
func viewSections() []content.Section {
	return []content.Section{
		{Title: "ABOUT", Entries: []content.Entry{
			{Slug: "about", Meta: content.Meta{Title: "About"}, Body: "Hi, I'm Vikram."},
		}},
		{Title: "WORK", Entries: []content.Entry{
			{Slug: "professional/work/scoredata",
				Meta: content.Meta{Title: "ScoreData", Role: "SWE Intern", Period: "2025–2026"},
				Body: "Built an observability platform."},
			{Slug: "professional/work/fiery",
				Meta: content.Meta{Title: "Fiery"},
				Body: "Did more things."},
		}},
	}
}

// viewAt builds a model, applies a window size, and returns it.
func viewAt(t *testing.T, w, h int) Model {
	t.Helper()
	var mdl tea.Model = New(viewSections())
	mdl, _ = mdl.Update(tea.WindowSizeMsg{Width: w, Height: h})
	return mdl.(Model)
}

// press sends one key to the model and returns the updated copy.
func press(m Model, key tea.KeyMsg) Model {
	var mdl tea.Model = m
	mdl, _ = mdl.Update(key)
	return mdl.(Model)
}

// welcomeMarker is a line unique to welcomeArt.
const welcomeMarker = "'--.__.--'"

func TestWelcomeShowsArtOnLargeTerminal(t *testing.T) {
	view := viewAt(t, 80, 24).View()
	if !strings.Contains(view, welcomeMarker) {
		t.Errorf("welcome view missing art marker %q:\n%s", welcomeMarker, view)
	}
}

func TestWelcomeHidesArtOnShortTerminal(t *testing.T) {
	// 60x15 is the minimum supported size; viewport height is
	// 15 - chromeH = 12 < artMinHeight, so art must be hidden.
	view := viewAt(t, 60, 15).View()
	if strings.Contains(view, welcomeMarker) {
		t.Errorf("short-terminal welcome should hide art:\n%s", view)
	}
	if !strings.Contains(view, "VIKRAM PENUMARTI") {
		t.Errorf("welcome text missing on short terminal:\n%s", view)
	}
}
