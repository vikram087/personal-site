package tui

import "strings"

// artMinHeight is the smallest viewport height that still shows art;
// below this the art would crowd out real content.
const artMinHeight = 14

// welcomeArt is the starfield scene shown on the welcome page.
const welcomeArt = `
     *       .        ✦         *
         .      .--~~--.     .
   ✦          /   o  .  \        *
       *     |  .    __  |    .
   .          \   -.__.- /   ✦
        ✦      '--.__.--'       .
     *      .        *       .`

// sectionArt maps section titles (as produced by content.Sections) to
// their pictograms. Unknown titles have no art and render nothing.
var sectionArt = map[string]string{
	"ABOUT": `
            _____
        .-''     ''-.
     __/   .    o    \__
    -=(  .     .   .   )=-
       \__  o     .  __/
          ''-.....-''`,
	"WORK": `
           .----.
      ____|      |____
     |    '------'    |
     |   __________   |
     |  |          |  |
     |__|__________|__|`,
	"VENTURES": `
           |>>>>
           |
          _|_
         /   \      /\
        /     \    /  \
       /       \__/    \
      /                 \`,
	"PROJECTS": `
           /\
          /  \
         |    |
         | () |
         |    |
        /|----|\
       /_|    |_\
          \/\/`,
	"EDUCATION": `
          ___________
      .-''           ''-.
     <===================>
       \                /
        '--.________.--'
              ||  \
              ||  (o)`,
	"HOBBIES": `
          ______
        .'  __  '.
       /   /  \   \
      |    \__/    |
      |  __    __  |
       \/  \  /  \/
        '.__\/__.'`,
	"CONTACT": `
                   .  *  .
          __      *
         /  \__  .
         \     \__
          \       \
           \_______\
             |   |
            _|___|_`,
}

// artFits reports whether art should be rendered in a viewport of the
// given dimensions.
func artFits(art string, width, height int) bool {
	return art != "" && height >= artMinHeight && artWidth(art) <= width
}

// artWidth returns the rune width of the art's longest line.
func artWidth(art string) int {
	w := 0
	for _, line := range strings.Split(art, "\n") {
		if n := len([]rune(line)); n > w {
			w = n
		}
	}
	return w
}
