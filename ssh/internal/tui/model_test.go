package tui_test

import (
	"bytes"
	"testing"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/x/exp/teatest"

	"vik.run/ssh/internal/content"
	"vik.run/ssh/internal/tui"
)

func testSections() []content.Section {
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

func TestNavigateDrillDownAndQuit(t *testing.T) {
	tm := teatest.NewTestModel(t, tui.New(testSections()),
		teatest.WithInitialTermSize(80, 24))

	// Sections render.
	teatest.WaitFor(t, tm.Output(), func(b []byte) bool {
		return bytes.Contains(b, []byte("WORK"))
	}, teatest.WithDuration(3*time.Second))

	// Down to WORK, enter: entry list + first entry's rendered body appear.
	tm.Send(tea.KeyMsg{Type: tea.KeyDown})
	tm.Send(tea.KeyMsg{Type: tea.KeyEnter})
	teatest.WaitFor(t, tm.Output(), func(b []byte) bool {
		return bytes.Contains(b, []byte("ScoreData")) &&
			bytes.Contains(b, []byte("observability"))
	}, teatest.WithDuration(3*time.Second))

	// Esc back to sections. Prove the drill-up actually happened by moving
	// up from WORK to ABOUT (only possible in sections mode) and opening
	// it: the About body has not appeared in the output stream before,
	// so this can only pass if esc really returned us to the section list.
	tm.Send(tea.KeyMsg{Type: tea.KeyEsc})
	tm.Send(tea.KeyMsg{Type: tea.KeyUp})
	tm.Send(tea.KeyMsg{Type: tea.KeyEnter})
	teatest.WaitFor(t, tm.Output(), func(b []byte) bool {
		return bytes.Contains(b, []byte("Hi, I'm Vikram."))
	}, teatest.WithDuration(3*time.Second))

	tm.Send(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("q")})
	tm.WaitFinished(t, teatest.WithFinalTimeout(3*time.Second))
}

func TestTooSmallTerminalShowsResizeHint(t *testing.T) {
	tm := teatest.NewTestModel(t, tui.New(testSections()),
		teatest.WithInitialTermSize(40, 10))
	teatest.WaitFor(t, tm.Output(), func(b []byte) bool {
		return bytes.Contains(b, []byte("resize"))
	}, teatest.WithDuration(3*time.Second))
	tm.Send(tea.KeyMsg{Type: tea.KeyCtrlC})
	tm.WaitFinished(t, teatest.WithFinalTimeout(3*time.Second))
}
