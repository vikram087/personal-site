// Package content loads, parses, and organizes the site's MDX content
// for terminal rendering.
package content

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// SyncDir copies every .mdx file under src into dst, preserving relative
// paths. dst is wiped first so deleted source files don't linger, and
// dst/.gitkeep is recreated so the (gitignored) directory stays tracked.
func SyncDir(src, dst string) error {
	if err := os.RemoveAll(dst); err != nil {
		return err
	}
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	err := filepath.WalkDir(src, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(p, ".mdx") {
			return nil
		}
		rel, err := filepath.Rel(src, p)
		if err != nil {
			return err
		}
		out := filepath.Join(dst, rel)
		if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
			return err
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		return os.WriteFile(out, b, 0o644)
	})
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dst, ".gitkeep"), nil, 0o644)
}
