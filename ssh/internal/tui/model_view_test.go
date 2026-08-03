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

// workMarker is a line unique to the WORK briefcase art.
const workMarker = "|__|__________|__|"

func TestCursorMoveShowsSectionLanding(t *testing.T) {
	m := press(viewAt(t, 80, 24), tea.KeyMsg{Type: tea.KeyDown})
	view := m.View()
	if !strings.Contains(view, workMarker) {
		t.Errorf("landing view missing WORK art:\n%s", view)
	}
	if !strings.Contains(view, "2 entries · enter to open") {
		t.Errorf("landing view missing entry count:\n%s", view)
	}
}

func TestEscReturnsToSectionLanding(t *testing.T) {
	m := viewAt(t, 80, 24)
	m = press(m, tea.KeyMsg{Type: tea.KeyDown})  // highlight WORK
	m = press(m, tea.KeyMsg{Type: tea.KeyEnter}) // open WORK
	m = press(m, tea.KeyMsg{Type: tea.KeyEsc})   // back
	view := m.View()
	if !strings.Contains(view, "2 entries · enter to open") {
		t.Errorf("esc should land on WORK section landing:\n%s", view)
	}
}

func TestLandingHidesArtOnShortTerminal(t *testing.T) {
	m := press(viewAt(t, 60, 15), tea.KeyMsg{Type: tea.KeyDown})
	view := m.View()
	if strings.Contains(view, workMarker) {
		t.Errorf("short-terminal landing should hide art:\n%s", view)
	}
	if !strings.Contains(view, "2 entries · enter to open") {
		t.Errorf("landing text missing on short terminal:\n%s", view)
	}
}

func TestResizeKeepsSectionLanding(t *testing.T) {
	m := press(viewAt(t, 80, 24), tea.KeyMsg{Type: tea.KeyDown})
	var mdl tea.Model = m
	mdl, _ = mdl.Update(tea.WindowSizeMsg{Width: 90, Height: 30})
	view := mdl.(Model).View()
	if !strings.Contains(view, "2 entries · enter to open") {
		t.Errorf("resize should keep the section landing:\n%s", view)
	}
}

func TestEntryShowsSectionArt(t *testing.T) {
	m := viewAt(t, 80, 24)
	m = press(m, tea.KeyMsg{Type: tea.KeyDown})
	m = press(m, tea.KeyMsg{Type: tea.KeyEnter})
	view := m.View()
	if !strings.Contains(view, workMarker) {
		t.Errorf("entry view missing WORK art:\n%s", view)
	}
	if !strings.Contains(view, "ScoreData") {
		t.Errorf("entry view missing entry title:\n%s", view)
	}
}

func TestEntryHidesArtOnShortTerminal(t *testing.T) {
	m := viewAt(t, 60, 15)
	m = press(m, tea.KeyMsg{Type: tea.KeyDown})
	m = press(m, tea.KeyMsg{Type: tea.KeyEnter})
	view := m.View()
	if strings.Contains(view, workMarker) {
		t.Errorf("short-terminal entry should hide art:\n%s", view)
	}
	if !strings.Contains(view, "ScoreData") {
		t.Errorf("entry title missing on short terminal:\n%s", view)
	}
}

func TestLandingUsesSingularEntryNoun(t *testing.T) {
	m := viewAt(t, 80, 24)
	m = press(m, tea.KeyMsg{Type: tea.KeyDown})
	m = press(m, tea.KeyMsg{Type: tea.KeyUp}) // back to ABOUT (1 entry)
	view := m.View()
	if !strings.Contains(view, "1 entry · enter to open") {
		t.Errorf("landing should use singular noun for 1 entry:\n%s", view)
	}
}
