# TUI ASCII Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add themed ASCII pictograms to the SSH TUI's welcome screen, section landings, and entry pages so the right pane never looks empty.

**Architecture:** A new `art.go` in `ssh/internal/tui` holds pictograms as raw-string constants keyed by section title, plus a size guard (`artFits`). `model.go` gains a `showLanding` view for the highlighted section and threads art into the existing `showWelcome` and `renderEntry` render paths. No content-pipeline or web changes.

**Tech Stack:** Go, Bubble Tea, lipgloss, teatest (existing test deps — no new dependencies).

**Spec:** `docs/superpowers/specs/2026-08-02-tui-ascii-art-design.md`

## Global Constraints

- Section art ≤ 32 columns wide; welcome art ≤ 40 columns wide (rune-counted).
- Art is hidden whenever viewport height < `artMinHeight` (14) or viewport width < the art's widest line.
- Art renders with the existing `dimStyle`; no new colors or styles.
- All `Model` methods keep value receivers (copy-on-update, no mutation of shared state).
- Art strings are Go raw strings — they must not contain backticks.
- Run all commands from the `ssh/` directory (it is its own Go module, `vik.run/ssh`).
- Commit messages use conventional-commit format (`feat:`, `test:`). Work happens on a feature branch; do not push or merge — the user owns that.

---

### Task 1: Art assets and size guard (`art.go`)

**Files:**
- Create: `ssh/internal/tui/art.go`
- Test: `ssh/internal/tui/art_test.go` (internal test package `tui` — it checks unexported symbols; the existing `model_test.go` stays in `tui_test`)

**Interfaces:**
- Consumes: `content.Sections(content.FS())` from `vik.run/ssh/internal/content` (already exists).
- Produces: `welcomeArt string` (const), `sectionArt map[string]string` (keyed by section title, e.g. `"WORK"`), `artFits(art string, width, height int) bool`, `artWidth(art string) int`, `artMinHeight` (const, 14). Tasks 2–4 rely on these exact names.

- [ ] **Step 1: Write the failing test**

Create `ssh/internal/tui/art_test.go`:

```go
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
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `ssh/`): `go test ./internal/tui/ -run 'TestEvery|TestArt' -v`
Expected: FAIL to compile with `undefined: sectionArt` (and friends).

- [ ] **Step 3: Write the implementation**

Create `ssh/internal/tui/art.go` with exactly this content:

```go
package tui

import "strings"

// artMinHeight is the smallest viewport height that still shows art;
// below this the art would crowd out real content.
const artMinHeight = 14

// welcomeArt is the starfield scene shown on the welcome page.
const welcomeArt = `
     *       .        ✦         *
         .      .--~~--.     .
   ✦          /   o  .  \        *
       *     |  .    __  |    .
   .          \   -.__.- /   ✦
        ✦      '--.__.--'       .
     *      .        *       .`

// sectionArt maps section titles (as produced by content.Sections) to
// their pictograms. Unknown titles have no art and render nothing.
var sectionArt = map[string]string{
	"ABOUT": `
            _____
        .-''     ''-.
     __/   .    o    \__
    -=(  .     .   .   )=-
       \__  o     .  __/
          ''-.....-''`,
	"WORK": `
           .----.
      ____|      |____
     |    '------'    |
     |   __________   |
     |  |          |  |
     |__|__________|__|`,
	"VENTURES": `
           |>>>>
           |
          _|_
         /   \      /\
        /     \    /  \
       /       \__/    \
      /                 \`,
	"PROJECTS": `
           /\
          /  \
         |    |
         | () |
         |    |
        /|----|\
       /_|    |_\
          \/\/`,
	"EDUCATION": `
          ___________
      .-''           ''-.
     <===================>
       \                /
        '--.________.--'
              ||  \
              ||  (o)`,
	"HOBBIES": `
          ______
        .'  __  '.
       /   /  \   \
      |    \__/    |
      |  __    __  |
       \/  \  /  \/
        '.__\/__.'`,
	"CONTACT": `
                   .  *  .
          __      *
         /  \__  .
         \     \__
          \       \
           \_______\
             |   |
            _|___|_`,
}

// artFits reports whether art should be rendered in a viewport of the
// given dimensions.
func artFits(art string, width, height int) bool {
	return art != "" && height >= artMinHeight && artWidth(art) <= width
}

// artWidth returns the rune width of the art's longest line.
func artWidth(art string) int {
	w := 0
	for _, line := range strings.Split(art, "\n") {
		if n := len([]rune(line)); n > w {
			w = n
		}
	}
	return w
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `ssh/`): `go test ./internal/tui/ -run 'TestEvery|TestArt' -v`
Expected: PASS (all four tests).

- [ ] **Step 5: Commit**

```bash
git add ssh/internal/tui/art.go ssh/internal/tui/art_test.go
git commit -m "feat: add ASCII pictograms and size guard for TUI"
```

---

### Task 2: Welcome-screen art

**Files:**
- Modify: `ssh/internal/tui/model.go` (the `showWelcome` method, currently lines 139–152)
- Test: `ssh/internal/tui/model_view_test.go` (new file, internal package `tui` so tests can reference art constants)

**Interfaces:**
- Consumes: `welcomeArt`, `artFits` from Task 1.
- Produces: `viewAt(t *testing.T, w, h int) Model` and `press(m Model, key tea.KeyMsg) Model` test helpers in `model_view_test.go`, plus the `viewSections()` fixture — Tasks 3 and 4 reuse all three.

- [ ] **Step 1: Write the failing test**

Create `ssh/internal/tui/model_view_test.go`:

```go
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
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `ssh/`): `go test ./internal/tui/ -run TestWelcome -v`
Expected: `TestWelcomeShowsArtOnLargeTerminal` FAILS (no marker in view); `TestWelcomeHidesArtOnShortTerminal` passes (art doesn't exist yet — that's fine).

- [ ] **Step 3: Write the implementation**

In `ssh/internal/tui/model.go`, replace the whole `showWelcome` method with:

```go
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run (from `ssh/`): `go test ./internal/tui/ -v`
Expected: PASS (including the existing teatest tests in `model_test.go`).

- [ ] **Step 5: Commit**

```bash
git add ssh/internal/tui/model.go ssh/internal/tui/model_view_test.go
git commit -m "feat: show starfield art on TUI welcome screen"
```

---

### Task 3: Section landing pages

**Files:**
- Modify: `ssh/internal/tui/model.go` (`refreshViewport`, the `esc` case in `keyPressed`, new `showLanding` method)
- Test: `ssh/internal/tui/model_view_test.go` (append tests)

**Interfaces:**
- Consumes: `sectionArt`, `artFits` (Task 1); `viewAt`, `press` helpers (Task 2).
- Produces: `showLanding() Model` method on `Model`. No later task depends on it by name.

- [ ] **Step 1: Write the failing tests**

Append to `ssh/internal/tui/model_view_test.go`:

```go
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `ssh/`): `go test ./internal/tui/ -run 'TestCursorMove|TestEscReturns|TestLandingHides' -v`
Expected: all three FAIL (right pane still shows welcome text, never "2 entries").

- [ ] **Step 3: Write the implementation**

In `ssh/internal/tui/model.go`:

(a) Replace the early return in `refreshViewport` so section-mode cursor moves render a landing:

```go
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
```

(b) Add `showLanding` directly below `showWelcome`:

```go
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
```

(c) In `keyPressed`, change the `esc` case to land on the section instead of the welcome page:

```go
	case "esc":
		if m.mode == modeEntries {
			m.mode, m.cursor = modeSections, m.section
			m = m.showLanding()
		}
		return m, nil
```

- [ ] **Step 4: Run the full package tests**

Run (from `ssh/`): `go test ./internal/tui/ -v`
Expected: PASS. Note: `TestNavigateDrillDownAndQuit` in `model_test.go` exercises esc + re-open and must still pass unchanged.

- [ ] **Step 5: Commit**

```bash
git add ssh/internal/tui/model.go ssh/internal/tui/model_view_test.go
git commit -m "feat: add section landing pages with art to TUI"
```

---

### Task 4: Entry-page art

**Files:**
- Modify: `ssh/internal/tui/model.go` (`renderEntry` and its call site in `refreshViewport`)
- Test: `ssh/internal/tui/model_view_test.go` (append tests)

**Interfaces:**
- Consumes: `sectionArt`, `artFits` (Task 1); `viewAt`, `press` helpers (Task 2).
- Produces: `renderEntry(e content.Entry, art string, width, height int) string` (signature change from `renderEntry(e content.Entry, width int)`).

- [ ] **Step 1: Write the failing tests**

Append to `ssh/internal/tui/model_view_test.go`:

```go
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `ssh/`): `go test ./internal/tui/ -run TestEntry -v`
Expected: `TestEntryShowsSectionArt` FAILS (no art above entries); `TestEntryHidesArtOnShortTerminal` passes trivially.

- [ ] **Step 3: Write the implementation**

In `ssh/internal/tui/model.go`:

(a) Change the `renderEntry` signature and prepend art:

```go
// renderEntry renders the section's art (when it fits) above an entry's
// metadata header and glamour-styled markdown body, falling back to raw
// markdown if glamour fails.
func renderEntry(e content.Entry, art string, width, height int) string {
	var b strings.Builder
	if artFits(art, width, height) {
		b.WriteString(dimStyle.Render(art) + "\n\n")
	}
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
```

(b) Update the call site in `refreshViewport`:

```go
	m.vp.SetContent(renderEntry(entries[m.cursor],
		sectionArt[m.sections[m.section].Title], m.vp.Width, m.vp.Height))
```

- [ ] **Step 4: Run the full module tests and vet**

Run (from `ssh/`): `go vet ./... && go test ./...`
Expected: PASS across the whole module.

- [ ] **Step 5: Commit**

```bash
git add ssh/internal/tui/model.go ssh/internal/tui/model_view_test.go
git commit -m "feat: render section art above TUI entry pages"
```
