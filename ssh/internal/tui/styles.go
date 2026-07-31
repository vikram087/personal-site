// Package tui renders the two-pane terminal browser served over SSH.
package tui

import "github.com/charmbracelet/lipgloss"

// Nebula palette, echoing the website's starmap theme.
var (
	colStarlight = lipgloss.Color("#E8E6F0")
	colNebula    = lipgloss.Color("#8B7EC8")
	colAccent    = lipgloss.Color("#C8A2E8")
	colDim       = lipgloss.Color("#6E6788")

	headerStyle   = lipgloss.NewStyle().Foreground(colAccent).Bold(true)
	itemStyle     = lipgloss.NewStyle().Foreground(colStarlight)
	selectedStyle = lipgloss.NewStyle().Foreground(colAccent).Bold(true)
	dimStyle      = lipgloss.NewStyle().Foreground(colDim)
	leftPaneStyle = lipgloss.NewStyle().
			BorderStyle(lipgloss.NormalBorder()).
			BorderRight(true).
			BorderForeground(colNebula).
			PaddingRight(1)
	footerStyle = lipgloss.NewStyle().Foreground(colDim)
)
