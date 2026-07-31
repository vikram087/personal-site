package content

import (
	"testing"
	"testing/fstest"
)

func testFS() fstest.MapFS {
	mdx := func(s string) *fstest.MapFile { return &fstest.MapFile{Data: []byte(s)} }
	return fstest.MapFS{
		"about.mdx":                   mdx("---\ntitle: About\n---\n\nHi."),
		"contact.mdx":                 mdx("---\ntitle: Contact\n---\n\nEmail me."),
		"professional/work/old.mdx":   mdx("---\ntitle: Older\ndate: 2024-01-01\n---\n\nOld."),
		"professional/work/new.mdx":   mdx("---\ntitle: Newer\ndate: 2026-01-01\n---\n\nNew."),
		"professional/work/bad.mdx":   mdx("no frontmatter at all"),
		"hobbies/skiing.mdx":          mdx("---\ntitle: Skiing\n---\n\n<Gallery\n  images={[]}\n/>\n\nPow."),
	}
}

func TestSectionsBuildsOrderedTree(t *testing.T) {
	secs := Sections(testFS())

	titles := make([]string, len(secs))
	for i, s := range secs {
		titles[i] = s.Title
	}
	want := []string{"ABOUT", "WORK", "HOBBIES", "CONTACT"}
	if len(titles) != len(want) {
		t.Fatalf("sections = %v, want %v", titles, want)
	}
	for i := range want {
		if titles[i] != want[i] {
			t.Fatalf("sections = %v, want %v", titles, want)
		}
	}
}

func TestSectionsSortsByDateDescAndSkipsBad(t *testing.T) {
	secs := Sections(testFS())

	var work Section
	for _, s := range secs {
		if s.Title == "WORK" {
			work = s
		}
	}
	if len(work.Entries) != 2 {
		t.Fatalf("WORK entries = %d, want 2 (bad.mdx skipped)", len(work.Entries))
	}
	if work.Entries[0].Meta.Title != "Newer" || work.Entries[1].Meta.Title != "Older" {
		t.Errorf("order = %q, %q; want Newer, Older",
			work.Entries[0].Meta.Title, work.Entries[1].Meta.Title)
	}
}
