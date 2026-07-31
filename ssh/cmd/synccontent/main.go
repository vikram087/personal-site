// Command synccontent copies the repo's content/ MDX tree into the
// embeddable data directory. Run via `go generate ./...` from ssh/.
package main

import (
	"log"
	"os"

	"vik.run/ssh/internal/content"
)

func main() {
	// go:generate runs with cwd = the directory containing the directive
	// (ssh/internal/content), so defaults are relative to that.
	src, dst := "../../../content", "data"
	if len(os.Args) == 3 {
		src, dst = os.Args[1], os.Args[2]
	}
	if err := content.SyncDir(src, dst); err != nil {
		log.Fatalf("synccontent: %v", err)
	}
	log.Printf("synccontent: copied %s -> %s", src, dst)
}
