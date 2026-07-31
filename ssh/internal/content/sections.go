package content

import (
	"io/fs"
	"log"
	"path"
	"sort"
	"strings"
)

// Section is one left-pane menu group with its parsed entries.
type Section struct {
	Title   string
	Entries []Entry
}

// layout fixes the menu order. Sections list either a directory to scan
// or explicit files.
var layout = []struct {
	title string
	dir   string
	files []string
}{
	{title: "ABOUT", files: []string{"about.mdx"}},
	{title: "WORK", dir: "professional/work"},
	{title: "VENTURES", dir: "professional/ventures"},
	{title: "PROJECTS", dir: "professional/projects"},
	{title: "EDUCATION", dir: "education"},
	{title: "HOBBIES", dir: "hobbies"},
	{title: "CONTACT", files: []string{"contact.mdx"}},
}

// Sections builds the ordered section tree from an MDX file tree.
// Unreadable or malformed files are skipped with a log line; sections
// that end up empty are omitted.
func Sections(fsys fs.FS) []Section {
	sections := make([]Section, 0, len(layout))
	for _, l := range layout {
		entries := loadEntries(fsys, l.dir, l.files)
		if len(entries) == 0 {
			continue
		}
		sections = append(sections, Section{Title: l.title, Entries: entries})
	}
	return sections
}

func loadEntries(fsys fs.FS, dir string, files []string) []Entry {
	names := files
	if dir != "" {
		dirents, err := fs.ReadDir(fsys, dir)
		if err != nil {
			log.Printf("content: skipping section dir %s: %v", dir, err)
			return nil
		}
		names = nil
		for _, d := range dirents {
			if !d.IsDir() && strings.HasSuffix(d.Name(), ".mdx") {
				names = append(names, path.Join(dir, d.Name()))
			}
		}
	}

	entries := make([]Entry, 0, len(names))
	for _, name := range names {
		raw, err := fs.ReadFile(fsys, name)
		if err != nil {
			log.Printf("content: skipping %s: %v", name, err)
			continue
		}
		e, err := Parse(strings.TrimSuffix(name, ".mdx"), raw)
		if err != nil {
			log.Printf("content: skipping %s: %v", name, err)
			continue
		}
		entries = append(entries, e)
	}

	sort.SliceStable(entries, func(i, j int) bool {
		if entries[i].Meta.Date != entries[j].Meta.Date {
			return entries[i].Meta.Date > entries[j].Meta.Date // desc; empty sorts last
		}
		return entries[i].Meta.Title < entries[j].Meta.Title
	})
	return entries
}
