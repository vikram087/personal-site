# TUI ASCII Art — Design

**Date:** 2026-08-02
**Scope:** `ssh/internal/tui` (Bubble Tea SSH content browser)

## Problem

The TUI's right pane looks empty: the welcome screen is a few lines of text,
cursor movement in section mode leaves that welcome text sitting there, and
short entries render as a title plus a paragraph in a large blank pane.

## Goal

Add themed ASCII pictograms so every page has visual weight, in the existing
nebula palette, without crowding out content on small terminals.

## Design

### Art source: `ssh/internal/tui/art.go`

A new file holding hand-drawn pictograms as Go string constants, exposed as a
lookup keyed by section title, plus a distinct welcome scene:

| Key       | Pictogram                          |
|-----------|------------------------------------|
| ABOUT     | Ringed planet                      |
| WORK      | Briefcase                          |
| VENTURES  | Flag on a summit                   |
| PROJECTS  | Rocket                             |
| EDUCATION | Graduation cap                     |
| HOBBIES   | Soccer ball                        |
| CONTACT   | Satellite dish                     |
| (welcome) | Wide starfield-with-planet scene   |

Constraints:

- Section art: ~6–8 lines tall, ≤ 32 columns wide (fits the 60×15 minimum
  terminal after the 16-col left pane and borders).
- Welcome scene may be wider (up to ~40 cols) since it targets the full pane.
- Rendered with the existing `dimStyle`/`headerStyle` lipgloss styles so art
  reads as decoration, not content.
- Art is presentation, not content: it lives in the TUI package. The MDX
  content tree and `synccontent` pipeline are untouched.
- Lookup for an unknown section title returns empty string; callers render
  nothing rather than a placeholder.

### Placement

1. **Welcome screen** (`showWelcome`): starfield scene above the existing
   name/intro text. Shown on first resize, as today.
2. **Section landing** (new): in `modeSections`, cursor movement re-renders
   the right pane with the highlighted section's art, title, and entry count
   (e.g. "8 entries · enter to open"). Initial view remains the welcome
   screen. Esc from entry mode shows the landing of the section returned to
   (replacing today's welcome reset).
3. **Entry pages** (`renderEntry`): the owning section's art is prepended
   above the entry title. `renderEntry` gains the section title (or art
   string) as a parameter.

### Small-terminal guard

If the viewport height is below a named constant threshold (art height plus a
few content lines — approximately 14), art is skipped entirely on all three
placements. Width guard: art is also skipped if the viewport is narrower than
the art's widest line.

### Immutability

All model changes follow the existing value-receiver copy-on-update pattern;
no shared mutable state between sessions.

## Testing

Table-driven tests alongside `model_test.go`:

- Every section title produced by the content layout has non-empty art.
- All art lines respect the width constraint.
- `View()` contains art for: welcome, section landing after cursor move,
  and an open entry.
- Art is absent when the terminal height is below the threshold.
- Esc from entry mode shows the section landing, not the welcome text.

## Out of scope

- Figlet/generated banners, external art libraries.
- Art in MDX frontmatter or the web UI.
- Color/theme changes beyond reusing existing styles.
