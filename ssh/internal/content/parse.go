package content

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// Meta is the MDX frontmatter shape used across content/.
type Meta struct {
	Title   string            `yaml:"title"`
	Summary string            `yaml:"summary"`
	Date    string            `yaml:"date"`
	Org     string            `yaml:"org"`
	Role    string            `yaml:"role"`
	Period  string            `yaml:"period"`
	Links   map[string]string `yaml:"links"`
}

// Entry is one content file, parsed and ready for terminal rendering.
type Entry struct {
	Slug string
	Meta Meta
	Body string
}

var (
	// Capitalized tags are JSX components (e.g. <Gallery ... />), possibly
	// spanning multiple lines. Attribute values in this content never
	// contain '>', so [^>] is a safe conservative bound.
	jsxPaired      = regexp.MustCompile(`(?s)<([A-Z][A-Za-z0-9.]*)(\s[^>]*?)?>.*?</[A-Za-z0-9.]+>`)
	jsxSelfClosing = regexp.MustCompile(`(?s)<[A-Z][A-Za-z0-9.]*(\s[^>]*?)?/>`)
	mdImage        = regexp.MustCompile(`!\[[^\]]*\]\([^)]*\)`)
)

// Parse splits frontmatter from body, decodes the YAML, and strips
// terminal-unrenderable constructs (JSX components, images) from the body.
func Parse(slug string, raw []byte) (Entry, error) {
	meta, body, err := splitFrontmatter(raw)
	if err != nil {
		return Entry{}, fmt.Errorf("%s: %w", slug, err)
	}
	if meta.Title == "" {
		return Entry{}, fmt.Errorf("%s: frontmatter missing title", slug)
	}
	return Entry{Slug: slug, Meta: meta, Body: stripUnrenderable(body)}, nil
}

func splitFrontmatter(raw []byte) (Meta, string, error) {
	var m Meta
	delim := []byte("---\n")
	if !bytes.HasPrefix(raw, delim) {
		return m, "", fmt.Errorf("missing frontmatter")
	}
	rest := raw[len(delim):]
	end := bytes.Index(rest, []byte("\n---"))
	if end < 0 {
		return m, "", fmt.Errorf("unterminated frontmatter")
	}
	if err := yaml.Unmarshal(rest[:end], &m); err != nil {
		return m, "", fmt.Errorf("invalid frontmatter: %w", err)
	}
	return m, string(rest[end+len("\n---"):]), nil
}

func stripUnrenderable(body string) string {
	body = jsxPaired.ReplaceAllString(body, "")
	body = jsxSelfClosing.ReplaceAllString(body, "")
	body = mdImage.ReplaceAllString(body, "")
	return strings.TrimSpace(body)
}
