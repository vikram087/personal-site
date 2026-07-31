package content

import (
	"embed"
	"io/fs"
)

//go:generate go run vik.run/ssh/cmd/synccontent

// data holds the site's MDX tree, copied in by `go generate` (see
// cmd/synccontent). Only .gitkeep is committed.
//
//go:embed all:data
var dataFS embed.FS

// FS returns the embedded content tree rooted at the MDX files.
func FS() fs.FS {
	sub, err := fs.Sub(dataFS, "data")
	if err != nil {
		panic(err) // impossible: "data" is a compile-time-known embedded dir
	}
	return sub
}
