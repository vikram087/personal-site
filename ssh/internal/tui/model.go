package tui

import (
	"fmt"
	"sort"
	"strings"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/lipgloss"

	"vik.run/ssh/internal/content"
)

const (
	minWidth  = 60
	minHeight = 15
	leftWidth = 16
	chromeH   = 3 // header + footer + spacing
)

type mode int

const (
	modeSections mode = iota
	modeEntries
)

// Model is the Bubble Tea model for the two-pane content browser.
// All updates return new copies (value receivers); nothing is shared
// between sessions except the immutable sections slice.
type Model struct {
	sections []content.Section
	mode     mode
	cursor   int // index into the visible left-pane list
	section  int // active section while in modeEntries
	width    int
	height   int
	vp       viewport.Model
	ready    bool
}

// New builds the root model. sections must be non-nil; an empty slice
// renders an empty menu rather than crashing.
func New(sections []content.Section) Model {
	return Model{sections: sections}
}

func (m Model) Init() tea.Cmd { return nil }

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		return m.resized(msg), nil
	case tea.KeyMsg:
		return m.keyPressed(msg)
	}
	return m, nil
}

func (m Model) resized(msg tea.WindowSizeMsg) Model {
	m.width, m.height = msg.Width, msg.Height
	vpW := max(msg.Width-leftWidth-3, 10)
	vpH := max(msg.Height-chromeH, 3)
	if !m.ready {
		m.vp = viewport.New(vpW, vpH)
		m.ready = true
		m = m.showWelcome()
	} else {
		m.vp.Width, m.vp.Height = vpW, vpH
		if m.mode == modeEntries {
			m = m.refreshViewport()
		} else {
			m = m.showWelcome()
		}
	}
	return m
}

func (m Model) keyPressed(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "q", "ctrl+c":
		return m, tea.Quit
	case "up", "k":
		if m.cursor > 0 {
			m.cursor--
			m = m.refreshViewport()
		}
		return m, nil
	case "down", "j":
		if m.cursor < m.listLen()-1 {
			m.cursor++
			m = m.refreshViewport()
		}
		return m, nil
	case "enter":
		if m.mode == modeSections && len(m.sections) > 0 {
			m.mode, m.section, m.cursor = modeEntries, m.cursor, 0
			m = m.refreshViewport()
		}
		return m, nil
	case "esc":
		if m.mode == modeEntries {
			m.mode, m.cursor = modeSections, m.section
			m = m.showLanding()
		}
		return m, nil
	default:
		// Everything else (pgup/pgdn/u/d/mouse) scrolls the viewport.
		var cmd tea.Cmd
		m.vp, cmd = m.vp.Update(msg)
		return m, cmd
	}
}

func (m Model) listLen() int {
	if m.mode == modeEntries {
		return len(m.sections[m.section].Entries)
	}
	return len(m.sections)
}

// refreshViewport re-renders the right pane for the current selection.
func (m Model) refreshViewport() Model {
	if m.mode != modeEntries {
		return m.showLanding()
	}
	entries := m.sections[m.section].Entries
	if len(entries) == 0 {
		m.vp.SetContent(dimStyle.Render("nothing here yet"))
		return m
	}
	m.vp.SetContent(renderEntry(entries[m.cursor], m.vp.Width))
	m.vp.GotoTop()
	return m
}

func (m Model) showWelcome() Model {
	parts := []string{""}
	if artFits(welcomeArt, m.vp.Width, m.vp.Height) {
		parts = append(parts, dimStyle.Render(welcomeArt), "")
	}
	parts = append(parts,
		headerStyle.Render("  VIKRAM PENUMARTI"),
		dimStyle.Render("  software engineer · uc davis cs"),
		"",
		itemStyle.Render("  ↑↓ to browse, enter to open a section."),
		"",
		dimStyle.Render("  prefer a browser? https://vikram.sh"),
	)
	m.vp.SetContent(strings.Join(parts, "\n"))
	m.vp.GotoTop()
	return m
}

// showLanding renders the highlighted section's art, title, and entry
// count in the right pane while browsing the section list.
func (m Model) showLanding() Model {
	if len(m.sections) == 0 {
		return m.showWelcome()
	}
	s := m.sections[m.cursor]
	var b strings.Builder
	if art := sectionArt[s.Title]; artFits(art, m.vp.Width, m.vp.Height) {
		b.WriteString(dimStyle.Render(art) + "\n\n")
	}
	b.WriteString(headerStyle.Render("  "+s.Title) + "\n")
	noun := "entries"
	if len(s.Entries) == 1 {
		noun = "entry"
	}
	b.WriteString(dimStyle.Render(fmt.Sprintf("  %d %s · enter to open", len(s.Entries), noun)))
	m.vp.SetContent(b.String())
	m.vp.GotoTop()
	return m
}

// renderEntry renders an entry's metadata header plus its glamour-styled
// markdown body, falling back to raw markdown if glamour fails.
func renderEntry(e content.Entry, width int) string {
	var b strings.Builder
	b.WriteString(headerStyle.Render(e.Meta.Title) + "\n")
	if line := metaLine(e.Meta); line != "" {
		b.WriteString(dimStyle.Render(line) + "\n")
	}
	b.WriteString("\n" + renderMarkdown(e.Body, width))
	names := make([]string, 0, len(e.Meta.Links))
	for name := range e.Meta.Links {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		b.WriteString("\n" + dimStyle.Render(name+": "+e.Meta.Links[name]))
	}
	return b.String()
}

func metaLine(meta content.Meta) string {
	parts := make([]string, 0, 3)
	for _, p := range []string{meta.Role, meta.Org, meta.Period} {
		if p != "" {
			parts = append(parts, p)
		}
	}
	if len(parts) == 0 && meta.Summary != "" {
		return meta.Summary
	}
	return strings.Join(parts, " · ")
}

func renderMarkdown(md string, width int) string {
	r, err := glamour.NewTermRenderer(
		glamour.WithStandardStyle("dark"),
		glamour.WithWordWrap(max(width-2, 20)),
	)
	if err != nil {
		return md
	}
	out, err := r.Render(md)
	if err != nil {
		return md
	}
	return out
}

func (m Model) View() string {
	if !m.ready {
		return "loading..."
	}
	if m.width < minWidth || m.height < minHeight {
		return fmt.Sprintf("\n  please resize your terminal to at least %dx%d\n  (current: %dx%d) · q to quit\n",
			minWidth, minHeight, m.width, m.height)
	}
	header := headerStyle.Render(" vik.run ") + dimStyle.Render(strings.Repeat("─", max(m.width-10, 0)))
	panes := lipgloss.JoinHorizontal(lipgloss.Top, m.leftPane(), m.vp.View())
	footer := footerStyle.Render(" ↑↓ nav · enter open · esc back · q quit · https://vikram.sh")
	return lipgloss.JoinVertical(lipgloss.Left, header, panes, footer)
}

func (m Model) leftPane() string {
	labels := make([]string, 0, m.listLen())
	if m.mode == modeEntries {
		for _, e := range m.sections[m.section].Entries {
			labels = append(labels, truncate(e.Meta.Title, leftWidth-3))
		}
	} else {
		for _, s := range m.sections {
			labels = append(labels, truncate(s.Title, leftWidth-3))
		}
	}
	lines := make([]string, len(labels))
	for i, label := range labels {
		if i == m.cursor {
			lines[i] = selectedStyle.Render("▸ " + label)
		} else {
			lines[i] = itemStyle.Render("  " + label)
		}
	}
	return leftPaneStyle.
		Width(leftWidth).
		Height(max(m.height-chromeH, 3)).
		Render(strings.Join(lines, "\n"))
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:max(n-1, 1)]) + "…"
}
