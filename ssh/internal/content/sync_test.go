package content

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSyncDirCopiesOnlyMDXPreservingPaths(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()

	mustWrite(t, filepath.Join(src, "about.mdx"), "---\ntitle: About\n---\nhi")
	mustWrite(t, filepath.Join(src, "professional/work/a.mdx"), "---\ntitle: A\n---\nbody")
	mustWrite(t, filepath.Join(src, "notes.txt"), "not mdx")

	if err := SyncDir(src, dst); err != nil {
		t.Fatalf("SyncDir: %v", err)
	}

	if _, err := os.Stat(filepath.Join(dst, "about.mdx")); err != nil {
		t.Errorf("about.mdx missing: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "professional/work/a.mdx")); err != nil {
		t.Errorf("nested mdx missing: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "notes.txt")); !os.IsNotExist(err) {
		t.Error("non-mdx file should not be copied")
	}
	if _, err := os.Stat(filepath.Join(dst, ".gitkeep")); err != nil {
		t.Errorf(".gitkeep should be recreated: %v", err)
	}
}

func TestSyncDirWipesStaleFiles(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()
	mustWrite(t, filepath.Join(dst, "stale.mdx"), "old")
	mustWrite(t, filepath.Join(src, "fresh.mdx"), "---\ntitle: F\n---\nnew")

	if err := SyncDir(src, dst); err != nil {
		t.Fatalf("SyncDir: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "stale.mdx")); !os.IsNotExist(err) {
		t.Error("stale file should be removed")
	}
}

func mustWrite(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}
