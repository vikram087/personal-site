package content

import (
	"strings"
	"testing"
)

func TestParseFrontmatterFields(t *testing.T) {
	raw := []byte(`---
title: ScoreData
summary: Intelligence tools for enterprises.
date: 2026-06-01
org: ScoreData
role: Software Engineer Intern
period: June 2025 – June 2026
---

Built an LLM observability platform.`)

	e, err := Parse("professional/work/scoredata", raw)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if e.Meta.Title != "ScoreData" {
		t.Errorf("Title = %q", e.Meta.Title)
	}
	if e.Meta.Date != "2026-06-01" {
		t.Errorf("Date = %q", e.Meta.Date)
	}
	if e.Meta.Role != "Software Engineer Intern" {
		t.Errorf("Role = %q", e.Meta.Role)
	}
	if e.Slug != "professional/work/scoredata" {
		t.Errorf("Slug = %q", e.Slug)
	}
	if !strings.Contains(e.Body, "LLM observability") {
		t.Errorf("Body = %q", e.Body)
	}
}

func TestParseStripsMultilineJSXAndImages(t *testing.T) {
	raw := []byte(`---
title: Skiing
summary: Skiing & Snowboarding
---

Some intro text.

<Gallery
  images={[
    { src: '/photos/skiing-1.webp', alt: 'Skiing' },
    { src: '/photos/skiing-2.webp', alt: 'Skiing' },
  ]}
/>

![about](/photos/about.webp)

Closing text.`)

	e, err := Parse("hobbies/skiing", raw)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	for _, banned := range []string{"<Gallery", "/>", "![about]", ".webp"} {
		if strings.Contains(e.Body, banned) {
			t.Errorf("Body still contains %q:\n%s", banned, e.Body)
		}
	}
	if !strings.Contains(e.Body, "Some intro text.") || !strings.Contains(e.Body, "Closing text.") {
		t.Errorf("surrounding prose lost:\n%s", e.Body)
	}
}

func TestParseLinks(t *testing.T) {
	raw := []byte(`---
title: This Website
links:
  github: https://github.com/vpenumarti/personal-site
---

Colophon.`)
	e, err := Parse("professional/projects/this-website", raw)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if e.Meta.Links["github"] != "https://github.com/vpenumarti/personal-site" {
		t.Errorf("Links = %v", e.Meta.Links)
	}
}

func TestParseErrors(t *testing.T) {
	cases := map[string][]byte{
		"no frontmatter":           []byte("just text"),
		"unterminated frontmatter": []byte("---\ntitle: X\n"),
		"missing title":            []byte("---\nsummary: no title here\n---\nbody"),
	}
	for name, raw := range cases {
		if _, err := Parse("x", raw); err == nil {
			t.Errorf("%s: expected error, got nil", name)
		}
	}
}
